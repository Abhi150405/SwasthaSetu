import React from 'react';
import { useAppState } from '@/context/app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ArrowLeft, Search, PlusCircle, MessageSquarePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { currentUser, doctors, requests } = useAppState();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Get the list of consulted doctors with last message info
  const consultedDoctors = React.useMemo(() => {
    if (!currentUser) return [];
    
    // For demo purposes, show all doctors as consulted
    const allDoctors = [...doctors].map(doctor => ({
      ...doctor,
      lastMessage: 'How are you feeling today?',
      unreadCount: Math.floor(Math.random() * 5), // Random unread count for demo
      lastMessageTime: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random time in last 7 days
    }));
    
    // Filter by search query
    const filtered = searchQuery
      ? allDoctors.filter(doctor =>
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allDoctors;
    
    // Sort by most recent message
    return filtered.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    
    // In a real app, you would use this logic:
    // const consultedDoctorIds = requests
    //   .filter(r => r.userId === currentUser.id && r.status === 'accepted')
    //   .map(r => r.doctorId);
    // return doctors.filter(d => consultedDoctorIds.includes(d.id));
  }, [currentUser, doctors, requests, searchQuery]);

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

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground">Chat with your healthcare providers</p>
          </div>
        </div>
        <Button>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar with doctor list */}
        <Card className="md:col-span-1 border-0 shadow-sm">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
            {consultedDoctors.length === 0 ? (
              <div className="p-6 text-center">
                <div className="rounded-full bg-muted p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No doctors found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search' : 'You have no recent conversations'}
                </p>
                {!searchQuery && (
                  <Button size="sm" className="mt-3" variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Find a doctor
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {consultedDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors flex items-start gap-3 relative"
                    onClick={() => navigate(`/messages/${doctor.id}`)}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={`/avatars/${doctor.id}.jpg`} />
                      <AvatarFallback>
                        {doctor.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{doctor.name}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {doctor.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {doctor.specialty}
                      </p>
                      <p className="text-sm mt-1 text-foreground/80 truncate">
                        {doctor.lastMessage}
                      </p>
                    </div>
                    {doctor.unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute right-3 top-1/2 -translate-y-1/2">
                        {doctor.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Main chat area */}
        <Card className="md:col-span-3 flex flex-col h-[calc(100vh-180px)] border-0 shadow-sm">
          <CardHeader className="border-b flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Select a conversation</CardTitle>
            <CardDescription className="text-center">
              Choose a doctor from the list to view your messages or start a new conversation.
            </CardDescription>
            <Button className="mt-4" variant="outline">
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
