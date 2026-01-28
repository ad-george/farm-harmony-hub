import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Search, Paperclip, MoreHorizontal, Check, CheckCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participant: {
    name: string;
    role: string;
    avatar?: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: "1",
    participant: { name: "John Doe", role: "Owner" },
    lastMessage: "Please review the quarterly report I sent",
    timestamp: "2 min ago",
    unread: 2,
    messages: [
      { id: "1", senderId: "owner", content: "Good morning! How are the operations going?", timestamp: "9:00 AM", read: true },
      { id: "2", senderId: "me", content: "Everything is running smoothly. We completed the wheat harvest yesterday.", timestamp: "9:15 AM", read: true },
      { id: "3", senderId: "owner", content: "That's great news! What's the total yield?", timestamp: "9:20 AM", read: true },
      { id: "4", senderId: "me", content: "We got 450 tons, which is 8% above our projection!", timestamp: "9:25 AM", read: true },
      { id: "5", senderId: "owner", content: "Excellent work! Please review the quarterly report I sent", timestamp: "9:30 AM", read: false },
      { id: "6", senderId: "owner", content: "I need your input on the budget allocation for next quarter", timestamp: "9:31 AM", read: false },
    ],
  },
  {
    id: "2",
    participant: { name: "Sarah Williams", role: "Manager - Sunrise Acres" },
    lastMessage: "The irrigation system is fixed",
    timestamp: "1 hour ago",
    unread: 0,
    messages: [
      { id: "1", senderId: "sarah", content: "Hi! The irrigation system had some issues this morning", timestamp: "8:00 AM", read: true },
      { id: "2", senderId: "me", content: "What happened? Is it affecting the crops?", timestamp: "8:10 AM", read: true },
      { id: "3", senderId: "sarah", content: "A few sprinkler heads were clogged. We've cleaned them out.", timestamp: "8:30 AM", read: true },
      { id: "4", senderId: "sarah", content: "The irrigation system is fixed", timestamp: "8:45 AM", read: true },
    ],
  },
  {
    id: "3",
    participant: { name: "Mike Johnson", role: "Employee" },
    lastMessage: "Task completed for today",
    timestamp: "3 hours ago",
    unread: 0,
    messages: [
      { id: "1", senderId: "me", content: "Mike, please check the fence in the north pasture", timestamp: "7:00 AM", read: true },
      { id: "2", senderId: "mike", content: "On it! Will report back when done.", timestamp: "7:15 AM", read: true },
      { id: "3", senderId: "mike", content: "Found and fixed two broken sections.", timestamp: "10:00 AM", read: true },
      { id: "4", senderId: "mike", content: "Task completed for today", timestamp: "10:30 AM", read: true },
    ],
  },
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(conversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send to the backend
    setNewMessage("");
  };

  return (
    <DashboardLayout
      title="Messages"
      subtitle="Communicate with your team"
    >
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-card shadow-card overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredConversations.map((conv) => {
              const initials = conv.participant.name
                .split(" ")
                .map((n) => n[0])
                .join("");
              const isSelected = selectedConversation.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors border-b border-border/50",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.participant.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground truncate">
                          {conv.participant.name}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {conv.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-primary">{conv.participant.role}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2 rounded-xl bg-card shadow-card overflow-hidden flex flex-col"
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedConversation.participant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-foreground">
                  {selectedConversation.participant.name}
                </h4>
                <p className="text-xs text-primary">
                  {selectedConversation.participant.role}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {selectedConversation.messages.map((message) => {
                const isMe = message.senderId === "me";
                return (
                  <div
                    key={message.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1 mt-1",
                          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        <span className="text-xs">{message.timestamp}</span>
                        {isMe && (
                          message.read ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Textarea
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                className="shrink-0 bg-primary hover:bg-primary/90"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
