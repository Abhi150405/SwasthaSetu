import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { MessageCircle, ArrowLeft, Send, User as UserIcon, Paperclip, Mic, Smile, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'doctor';
  timestamp: Date;
};

export default function DoctorChat() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { currentUser, doctors, setMessagingMounted, setActiveChatId, conversations, addMessage } = useAppState();
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    setMessagingMounted(true);
    return () => setMessagingMounted(false);
  }, []);
  
  // Use doctorId as the active chat (which acts as request id or other user id in our mapping)
  useEffect(() => {
    setActiveChatId(doctorId || null);
    return () => setActiveChatId(null);
  }, [doctorId]);
  const [isLoading, setIsLoading] = useState(false);
  const msgs = doctorId ? (conversations[doctorId] || []) : [];

  // Get the current doctor's details
  const doctor = doctors.find(d => d.id === doctorId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser || !doctorId) return;

    addMessage(doctorId, { from: 'patient', text: message });
    setMessage('');
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please sign in to view your messages.</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Doctor Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested doctor could not be found.</p>
            <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      <div className="border-b bg-background">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
              className="shrink-0 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile when in chat */}
        <div className="hidden md:block w-80 border-r bg-background">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                className="pl-9 bg-muted/50 border-0"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-180px)]">
            {doctors.map((doc) => (
              <button
                key={doc.id}
                className={`w-full p-4 text-left transition-colors flex items-center gap-3 hover:bg-muted/50 ${
                  doc.id === doctorId ? 'bg-muted' : ''
                }`}
                onClick={() => navigate(`/messages/${doc.id}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/avatars/${doc.id}.jpg`} />
                  <AvatarFallback>
                    {doc.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{doc.name}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{doc.specialty}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Chat header */}
          <div className="border-b p-4 flex items-center gap-3 bg-background">
            <Avatar>
              <AvatarImage src={`/avatars/${doctor.id}.jpg`} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {doctor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{doctor.name}</h2>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
          </div>
          
          {/* Messages */}
          <ScrollArea className="h-[calc(100vh-280px)] p-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                </div>
              ) : msgs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-1 text-foreground">No messages yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Start the conversation with {doctor.name.split(' ')[0]}. Send a message to discuss your health concerns.
                  </p>
                </div>
              ) : (
                <>
                  {msgs.map((msg, index) => {
                    const isUser = msg.from === 'patient' || (msg.from as string) === 'user';
                    const showDate = index === 0 || 
                      new Date(msg.ts).toDateString() !== new Date(msgs[index - 1].ts).toDateString();
                    
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              {format(new Date(msg.ts), 'MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={cn(
                            "max-w-[85%] md:max-w-[70%] rounded-2xl p-3 relative",
                            isUser 
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted rounded-bl-none"
                          )}>
                            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                            <div className={cn(
                              "text-xs mt-1 flex justify-end",
                              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.ts), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </ScrollArea>

          {/* Message input */}
          <div className="border-t p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Mic className="h-4 w-4" />
                  <span className="sr-only">Voice message</span>
                </Button>
              </div>
              <div className="relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Message ${doctor.name.split(' ')[0]}...`}
                  className="min-h-[40px] max-h-32 py-2 pl-4 pr-16 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Add emoji</span>
                  </Button>
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-8 w-8"
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
