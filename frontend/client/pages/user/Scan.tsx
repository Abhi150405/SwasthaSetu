import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Scan() {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    qty: string;
    kcal: number;
    tags: string[];
  } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = async () => {
    setError(null);
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
    } catch (e) {
      setError(
        "Camera access denied or unavailable. You can still upload an image or enter a code.",
      );
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const scan = () => {
    // Mock: capture current frame (if camera on) to simulate a scan
    if (cameraOn && videoRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFileName("camera-frame");
    }
    setResult({
      name: "Oats",
      qty: "100g",
      kcal: 389,
      tags: ["Warm", "Rasa: Madhura", "Light"],
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Food Scanner</h1>
          <p className="text-slate-600">Scan barcodes or upload images to analyze food items</p>
        </div>
        
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-800">Scan Food Item</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Use your camera or upload an image</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" x2="9.01" y1="9" y2="9"/>
                  <line x1="15" x2="15.01" y1="9" y2="9"/>
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Barcode</label>
                  <div className="flex space-x-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter or paste barcode"
                      className="flex-1"
                    />
                    <label className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Camera</label>
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                    {!cameraOn ? (
                      <button
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center w-full p-8 space-y-3 transition-colors duration-200 hover:bg-slate-100 rounded-lg"
                      >
                        <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                          </svg>
                        </div>
                        <span className="font-medium text-slate-700">Turn on Camera</span>
                        <p className="text-xs text-slate-500">Or upload an image above</p>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                          <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-16 w-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center space-x-3">
                          <Button 
                            onClick={scan}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            Capture & Scan
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={stopCamera}
                            className="border-slate-300 hover:bg-slate-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <rect x="6" y="6" width="12" height="12" rx="2"/>
                              <path d="M18 12h.01"/>
                              <path d="M12 18h.01"/>
                              <path d="M6 12h.01"/>
                              <path d="M12 6h.01"/>
                            </svg>
                            Stop
                          </Button>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">Food Analysis</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Nutritional information and recommendations</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{result.name}</h3>
                    <p className="text-slate-500">{result.qty}</p>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-4 py-2 rounded-lg text-center sm:text-right">
                    <div className="text-sm font-medium text-emerald-700">Calories</div>
                    <div className="text-2xl font-bold">{result.kcal}</div>
                    <div className="text-xs text-emerald-600">per serving</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-medium text-slate-800 mb-3">Ayurvedic Properties</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((t, i) => (
                      <Badge 
                        key={i} 
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <svg className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Best consumed in the morning for optimal digestion
                    </li>
                    <li className="flex items-start">
                      <svg className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Pairs well with warm spices like cinnamon and cardamom
                    </li>
                    <li className="flex items-start">
                      <svg className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Consider adding ghee for better nutrient absorption
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-slate-400 text-center pt-2">
                  Source: {fileName || (cameraOn ? "Camera" : code ? "Barcode" : "Sample data" )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
