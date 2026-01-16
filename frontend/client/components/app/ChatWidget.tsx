import React, { useEffect, useRef, useState, useCallback } from "react";

// Speech Recognition type declaration
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
};
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Camera, MessageCircle, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { useAppState } from "@/context/app-state";

type ChatMessage = {
  role: "user" | "bot";
  text?: string;
  image?: string;
  ts: number;
};

// Typewriter effect component
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);
  
  return <>{displayText}</>;
};

export const ChatWidget: React.FC<{ mode?: "floating" | "panel" }> = ({
  mode = "floating",
}) => {
  const isFloating = mode === "floating";
  const [open, setOpen] = useState<boolean>(() => {
    if (!isFloating) return true;
    try {
      return localStorage.getItem("app:chatOpen") === "1";
    } catch {
      return false;
    }
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi! I'm Setu. Tell me what you ate or ask for tips.",
      ts: Date.now() - 60000,
    },
    {
      role: "user",
      text: "Any quick tip for digestion?",
      ts: Date.now() - 45000,
    },
    {
      role: "bot",
      text: "Favor warm, cooked meals. Sip ginger-cumin tea after meals.",
      ts: Date.now() - 42000,
    },
  ]);
  
  // Sequential responses for the chat bot
  const sequentialResponses = [
    "Hey Dr.doom what can I do for you...",
    "The patient dashboard for Neha Gupta is now open and visible on the screen.\nIs there anything else I can do for you, Dr. Doom?",
    "The weekly diet plan for Neha Gupta has been generated and now you can modify or save it for them.\nIs there any further action required of me, Doctor?",
    "The diet plan has been successfully exported to a PDF. It is now available to share with Neha."
  ];
  
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const { markMealTaken, updateWater } = useAppState();
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (!isFloating) return { x: 24, y: 24 };
    try {
      const x = parseInt(localStorage.getItem("app:chat:x") || "");
      const y = parseInt(localStorage.getItem("app:chat:y") || "");
      if (!Number.isNaN(x) && !Number.isNaN(y)) return { x, y };
    } catch {}
    return { x: 24, y: 24 };
  });

  // Camera state
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");
  const [wasVoiceInput, setWasVoiceInput] = useState(false);
  
  // Text-to-speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  
  // Working indicator state
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!isFloating) return;
    try {
      localStorage.setItem("app:chatOpen", open ? "1" : "0");
    } catch {}
  }, [open, isFloating]);

  useEffect(() => {
    if (!isFloating || !open) return;
    if (pos.x === 24 && pos.y === 24 && typeof window !== "undefined") {
      const w = 416; // ~w-96
      const h = 560;
      setPos({
        x: Math.max(8, window.innerWidth - w - 16),
        y: Math.max(8, window.innerHeight - h - 16),
      });
    }
  }, [open, isFloating]);

  useEffect(() => {
    if (!isFloating) return;
    try {
      localStorage.setItem("app:chat:x", String(pos.x));
      localStorage.setItem("app:chat:y", String(pos.y));
    } catch {}
  }, [pos, isFloating]);

  const onMouseDownHeader = (e: React.MouseEvent) => {
    if (!open || !isFloating) return;
    draggingRef.current = true;
    offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const cw = rect?.width || 416;
      const ch = rect?.height || 560;
      const nx = Math.min(
        Math.max(0, ev.clientX - offsetRef.current.dx),
        window.innerWidth - cw,
      );
      const ny = Math.min(
        Math.max(0, ev.clientY - offsetRef.current.dy),
        window.innerHeight - ch,
      );
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err) {
      setMessages((m) =>
        m.concat({
          role: "bot",
          text: "Camera access denied. You can still upload an image.",
          ts: Date.now(),
        }),
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setMessages((m) =>
      m.concat({ role: "user", image: dataUrl, ts: Date.now() }),
    );
    setTimeout(
      () =>
        setMessages((m) =>
          m.concat({
            role: "bot",
            text: "Got it! I detect whole grains and fresh produce. Want a quick calorie estimate?",
            ts: Date.now(),
          }),
        ),
      500,
    );
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMessages((m) =>
        m.concat({
          role: "bot",
          text: "Speech recognition is not supported in your browser. Please try Chrome or Edge.",
          ts: Date.now(),
        }),
      );
      return;
    }

    // Set voice input flag when starting to listen
    setWasVoiceInput(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    console.log('Starting speech recognition...');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      transcriptRef.current = transcript;
      setInput(transcript);
      console.log('Speech recognition result:', transcript);
      
      // Auto-send immediately when we get the result
      setTimeout(() => {
        if (transcript.trim()) {
          console.log('Auto-sending from onresult:', transcript);
          handleSend();
          transcriptRef.current = "";
        }
      }, 100);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setMessages((m) =>
        m.concat({
          role: "bot",
          text: "Sorry, I couldn't hear you clearly. Please try again.",
          ts: Date.now(),
        }),
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Speech recognition ended');
      
      // Fallback auto-send if not already sent from onresult
      setTimeout(() => {
        const currentInput = input.trim();
        if (currentInput && transcriptRef.current !== "") {
          console.log('Fallback auto-send from onend:', currentInput);
          handleSend();
          transcriptRef.current = "";
        }
      }, 100);
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setIsListening(true);
      console.log('Speech recognition started successfully');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('Manually stopping speech recognition');
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported');
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    speechSynthesisRef.current = window.speechSynthesis;
    speechSynthesisRef.current.speak(utterance);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    
    // If not voice input, reset the voice input flag
    if (!wasVoiceInput) {
      setWasVoiceInput(false);
    }
    
    setMessages((m) => [...m, { role: "user", text, ts: Date.now() }]);
    setInput("");

    const t = text.toLowerCase();
    console.log("User input:", text);
    console.log("Lowercase input:", t);
    
    let reply = "Noted. How else can I help?";
    
    // Special case: greetings trigger the first response
    if (t.includes("hi") || t.includes("hello") || t.includes("hey") || t.includes("hii")) {
      if (currentResponseIndex === 0) {
        reply = sequentialResponses[0];
        setCurrentResponseIndex(1);
        console.log("Greeting detected - starting sequence with first response");
      }
    }
    // Check for sequential response triggers - more flexible detection
    else if (t.includes("sequence") || t.includes("next") || t.includes("continue") || 
        t.includes("start") || t.includes("begin") || t.includes("go") || 
        t.includes("response") || t.includes("dr") || t.includes("doctor") ||
        t.includes("doom") || t.includes("neha")) {
      console.log("Sequential response triggered");
      console.log("Current index:", currentResponseIndex);
      console.log("Total responses:", sequentialResponses.length);
      
      if (currentResponseIndex < sequentialResponses.length) {
        reply = sequentialResponses[currentResponseIndex];
        console.log("Reply set to:", reply);
        setCurrentResponseIndex(prev => {
          console.log("Updating index from", prev, "to", prev + 1);
          return prev + 1;
        });
      } else {
        reply = "All sequential responses have been completed. Starting over from the beginning.";
        setCurrentResponseIndex(0);
        console.log("Resetting index to 0");
      }
    } else if (t.includes("reset") || t.includes("start over")) {
      reply = "Sequential responses reset. Starting from the beginning.";
      setCurrentResponseIndex(0);
      console.log("Manual reset - index set to 0");
    } else if (t.includes("water")) {
      updateWater(250);
      reply = "Logged 250ml water. Keep hydrating!";
    } else if (
      t.includes("ate my lunch") ||
      t.includes("lunch done") ||
      t.includes("meal done")
    ) {
      markMealTaken();
      reply =
        "Great! I marked your lunch as taken. Want a light herbal tea later?";
    } else if (t.includes("tip") || t.includes("advice")) {
      reply =
        "Choose warm, cooked meals. Avoid iced drinks. Ginger and cumin can aid digestion.";
    }

    // Show working indicator immediately
    setIsWorking(true);
    
    // After 2 seconds, show the actual response
    setTimeout(() => {
      const botMessage = { role: "bot" as const, text: reply, ts: Date.now() };
      setMessages((m) => [...m, botMessage]);
      
      setIsWorking(false);
      
      // Only speak the bot response if the input was voice
      if (wasVoiceInput) {
        speakText(reply);
        // Reset voice input flag after speaking
        setWasVoiceInput(false);
      }
    }, 2000);
  };

  const toggleSpeech = () => {
    if (speechSynthesisRef.current) {
      if (isSpeaking) {
        speechSynthesisRef.current.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const Header = (
    <div
      className={cn(
        "flex items-center justify-between border-b px-3 py-2",
        isFloating && "cursor-move",
      )}
      onMouseDown={onMouseDownHeader}
    >
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">Setu</div>
        {isSpeaking && (
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
            <Volume2 className="h-3 w-3 animate-pulse" />
            <span>Speaking...</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleSpeech}
          className={cn(
            "h-6 w-6 p-0",
            isSpeaking ? "text-gray-600 hover:text-gray-700" : "text-gray-400 hover:text-gray-600"
          )}
          title={isSpeaking ? "Stop Speaking" : "Speech Output"}
        >
          {isSpeaking ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        </Button>
        {isFloating && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        )}
      </div>
    </div>
  );

  const Body = (
    <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm bg-gradient-to-b from-gray-50 to-white">
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex animate-in slide-in-from-bottom-2 duration-300",
            m.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div className="max-w-[85%] group">
            {/* Message bubble */}
            <div
              className={cn(
                "relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md",
                m.role === "user"
                  ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm",
              )}
            >
              {m.image ? (
                <div className="space-y-2">
                  <img
                    src={m.image}
                    alt="captured"
                    className={cn(
                      "rounded-lg max-w-full h-auto",
                      m.role === "user" ? "border-2 border-white/30" : "border border-gray-200",
                    )}
                  />
                  {m.text && (
                    <div className={cn(
                      "text-sm",
                      m.role === "user" ? "text-blue-100" : "text-gray-600"
                    )}>
                      {m.role === "bot" ? <TypewriterText text={m.text || ""} /> : m.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm leading-relaxed">
                  {m.role === "bot" ? <TypewriterText text={m.text || ""} /> : m.text}
                </div>
              )}
              
              {/* Role indicator */}
              <div className={cn(
                "absolute -top-2 text-xs font-medium px-2 py-1 rounded-full",
                m.role === "user" 
                  ? "bg-blue-600 text-white left-2" 
                  : "bg-green-100 text-green-700 right-2"
              )}>
                {m.role === "user" ? "You" : "Setu"}
              </div>
            </div>
            
            {/* Timestamp */}
            <div className={cn(
              "mt-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              m.role === "user" ? "text-right text-blue-500" : "text-left text-gray-500"
            )}>
              {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
      
      {/* Typing indicator */}
      {isListening && (
        <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-[85%]">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-gray-500">Listening...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Working indicator */}
      {isWorking && (
        <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-[85%]">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-gray-500">Working...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={endRef} />
    </div>
  );

  const Composer = (
    <div className="border-t bg-gradient-to-b from-white to-gray-50 p-4">
      {/* Quick Action Buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInput("I drank water")}
          className="text-xs h-8 px-3 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          💧 +250ml Water
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInput("I ate my lunch")}
          className="text-xs h-8 px-3 border-green-200 hover:bg-green-50 hover:border-green-300 transition-colors"
        >
          🍽️ I ate lunch
        </Button>
        <label className="inline-flex cursor-pointer items-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result || "");
                setMessages((m) =>
                  m.concat({ role: "user", image: dataUrl, ts: Date.now() }),
                );
                setTimeout(
                  () =>
                    setMessages((m) =>
                      m.concat({
                        role: "bot",
                        text: "Looks good! I can scan barcodes or estimate ingredients from photos.",
                        ts: Date.now(),
                      }),
                    ),
                  500,
                );
              };
              reader.readAsDataURL(file);
            }}
          />
          <span className="text-xs h-8 px-3 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-colors rounded-md border flex items-center gap-1">
            📷 Upload
          </span>
        </label>
      </div>

      {/* Input Area */}
      <div className="relative mb-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message or use voice input..."
          className="min-h-[60px] max-h-32 resize-none rounded-lg border-gray-200 focus:border-gray-400 focus:ring-gray-200 pr-24 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {/* Camera Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => (cameraOn ? stopCamera() : startCamera())}
            className={cn(
              "h-9 w-9 p-0 rounded-full relative overflow-hidden transition-all duration-300",
              !cameraOn && "bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-600 hover:text-blue-700 shadow-sm hover:shadow-md",
              cameraOn && "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 shadow-md hover:shadow-lg ring-2 ring-blue-200"
            )}
            title={cameraOn ? "Close Camera" : "Open Camera"}
          >
            <div className="relative flex items-center justify-center">
              <Camera className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              {cameraOn && (
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
              )}
            </div>
          </Button>

          {/* Microphone Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => (isListening ? stopListening() : startListening())}
            className={cn(
              "h-9 w-9 p-0 rounded-full relative overflow-hidden transition-all duration-300 group",
              !isListening && "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-600 hover:text-emerald-700 shadow-sm hover:shadow-md",
              isListening && "bg-gradient-to-br from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 shadow-md hover:shadow-lg ring-2 ring-red-200 animate-pulse"
            )}
            title={isListening ? "Stop Recording" : "Voice Input"}
          >
            <div className="relative flex items-center justify-center">
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
                </>
              ) : (
                <Mic className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              )}
            </div>
          </Button>
          
          {/* Manual Send Button (only show when listening and has input) */}
          {isListening && input.trim() && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                console.log('Manual send triggered');
                handleSend();
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                }
              }}
              className="h-9 w-9 p-0 rounded-full relative overflow-hidden transition-all duration-300 group bg-gradient-to-br from-green-50 to-lime-50 hover:from-green-100 hover:to-lime-100 text-green-600 hover:text-green-700 shadow-sm hover:shadow-md hover:ring-2 hover:ring-green-200"
              title="Send Now"
            >
              <div className="relative flex items-center justify-center">
                <Send className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
                <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-20"></div>
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Camera Preview */}
      {cameraOn && (
        <div className="mb-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3">
          <video
            ref={videoRef}
            className="h-32 w-full rounded-md bg-black/10 object-cover"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={stopCamera}
              className="text-xs h-7 px-3"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={capturePhoto}
              className="text-xs h-7 px-3 bg-gray-600 hover:bg-gray-700"
            >
              📸 Capture Photo
            </Button>
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className="w-full h-10 bg-gray-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        <span>Send Message</span>
      </button>
    </div>
  );

  if (!isFloating) {
    return (
      <Card className="w-full h-svh flex flex-col rounded-none border-0 bg-white/80 backdrop-blur-sm">
        {Header}
        {Body}
        {Composer}
      </Card>
    );
  }

  return (
    <div className={cn("fixed z-40 flex flex-col items-end gap-3")}>
      {open && (
        <div
          ref={containerRef}
          style={{ left: pos.x, top: pos.y, position: "fixed" }}
        >
          <Card className="w-96 shadow-xl border-[#6B7280]/50">
            {Header}
            {Body}
            {Composer}
          </Card>
        </div>
      )}
      {!open && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <MessageCircle />
        </Button>
      )}
    </div>
  );
};
