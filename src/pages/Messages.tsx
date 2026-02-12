import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Search, MoreHorizontal, Check, CheckCheck, Plus, UserPlus, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAppData } from "@/contexts/AppDataContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const { conversations, employees, sendMessage, markConversationAsRead, getTotalUnreadCount } = useAppData();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConvId) || null;

  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId) setSelectedConvId(conversations[0].id);
  }, [conversations, selectedConvId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedConversation?.messages]);

  const filteredConversations = conversations.filter((conv) => conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortedConversations = [...filteredConversations].sort((a, b) => (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0));

  const handleSelectConversation = (conv: any) => {
    setSelectedConvId(conv.id);
    if (conv.unread > 0) markConversationAsRead(conv.participant.user_id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await sendMessage(selectedConversation.participant.user_id, newMessage.trim());
      setNewMessage("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStartNewChat = async () => {
    if (!selectedEmployee) { toast.error("Please select a team member"); return; }
    const employee = employees.find((e) => e.user_id === selectedEmployee);
    if (!employee) return;

    const existingConv = conversations.find((c) => c.participant.user_id === employee.user_id);
    if (existingConv) { setSelectedConvId(existingConv.id); setIsNewChatOpen(false); return; }

    if (initialMessage.trim()) {
      await sendMessage(employee.user_id, initialMessage.trim());
    }
    setIsNewChatOpen(false);
    setSelectedEmployee("");
    setInitialMessage("");
    toast.success(`Conversation started with ${employee.name}`);
  };

  const totalUnread = getTotalUnreadCount();

  return (
    <DashboardLayout title="Messages" subtitle="Communicate with your team">
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl bg-card shadow-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><h3 className="font-semibold">Inbox</h3>{totalUnread > 0 && <Badge className="bg-primary text-primary-foreground">{totalUnread}</Badge>}</div>
              <Button size="sm" onClick={() => setIsNewChatOpen(true)}><UserPlus className="h-4 w-4 mr-1" />New</Button>
            </div>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
          </div>
          <ScrollArea className="flex-1">
            {sortedConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No conversations yet. Start a new chat!</div>
            ) : sortedConversations.map((conv) => {
              const initials = conv.participant.name.split(" ").map((n) => n[0]).join("");
              const isSelected = selectedConvId === conv.id;
              return (
                <div key={conv.id} onClick={() => handleSelectConversation(conv)}
                  className={cn("p-4 cursor-pointer transition-colors border-b border-border/50", isSelected ? "bg-primary/5" : "hover:bg-muted/50", conv.unread > 0 && "bg-primary/5")}>
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12"><AvatarImage src={conv.participant.avatar} /><AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                      {conv.unread > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">{conv.unread}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between"><h4 className={cn("font-semibold truncate", conv.unread > 0 && "text-foreground")}>{conv.participant.name}</h4><span className="text-xs text-muted-foreground">{conv.timestamp}</span></div>
                      <p className="text-xs text-primary truncate">{conv.participant.role}</p>
                      <p className={cn("text-sm truncate mt-1", conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>{conv.lastMessage}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </motion.div>

        {selectedConversation ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-xl bg-card shadow-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary">{selectedConversation.participant.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
              <div><h4 className="font-semibold text-foreground">{selectedConversation.participant.name}</h4><p className="text-xs text-primary">{selectedConversation.participant.role}</p></div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><p>No messages yet</p><p className="text-sm">Send a message to start</p></div>
                ) : selectedConversation.messages.map((message) => {
                  const isMe = message.senderId === "me";
                  return (
                    <div key={message.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[70%] rounded-2xl px-4 py-2", isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md")}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className={cn("flex items-center justify-end gap-1 mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          <span className="text-xs">{message.timestamp}</span>
                          {isMe && (message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())} className="flex-1" />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="lg:col-span-2 rounded-xl bg-card shadow-card flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Conversation</DialogTitle><DialogDescription>Select a team member to chat with</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Team Member</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{employees.filter((e) => e.user_id !== user?.id).map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.name} ({e.role})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Message (optional)</Label><Input value={initialMessage} onChange={(e) => setInitialMessage(e.target.value)} placeholder="Type a message..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsNewChatOpen(false)}>Cancel</Button><Button onClick={handleStartNewChat}>Start Chat</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
