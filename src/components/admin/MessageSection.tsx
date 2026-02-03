import { useState } from "react";
import { Send, Search, User, Clock, Check, CheckCheck, Paperclip, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const mockConversations = [
  { 
    id: 1, 
    name: "Mrs. Grace Moyo", 
    role: "Teacher",
    avatar: null,
    lastMessage: "Thank you for the update on John's progress.",
    time: "10:30 AM",
    unread: 2,
    online: true
  },
  { 
    id: 2, 
    name: "Mr. & Mrs. Ndlovu", 
    role: "Parent",
    avatar: null,
    lastMessage: "We received the fee statement.",
    time: "9:15 AM",
    unread: 0,
    online: false
  },
  { 
    id: 3, 
    name: "Mr. David Ncube", 
    role: "Teacher",
    avatar: null,
    lastMessage: "The science lab equipment has arrived.",
    time: "Yesterday",
    unread: 0,
    online: true
  },
  { 
    id: 4, 
    name: "Mrs. Accounts Manager", 
    role: "Staff",
    avatar: null,
    lastMessage: "Monthly report is ready for review.",
    time: "Yesterday",
    unread: 1,
    online: false
  },
  { 
    id: 5, 
    name: "Mr. Sports Coordinator", 
    role: "Staff",
    avatar: null,
    lastMessage: "Sports day preparations are on track.",
    time: "Dec 3",
    unread: 0,
    online: false
  },
];

const mockMessages = [
  { id: 1, sender: "Mrs. Grace Moyo", content: "Good morning! I wanted to discuss John Moyo's performance in mathematics.", time: "10:15 AM", isMine: false },
  { id: 2, sender: "You", content: "Good morning Mrs. Moyo. Yes, I've noticed he's been improving this term.", time: "10:18 AM", isMine: true, status: "read" },
  { id: 3, sender: "Mrs. Grace Moyo", content: "That's great to hear. He's been putting in extra effort during study sessions.", time: "10:22 AM", isMine: false },
  { id: 4, sender: "You", content: "I'll arrange for additional tutoring sessions to help him maintain this momentum before the exams.", time: "10:25 AM", isMine: true, status: "read" },
  { id: 5, sender: "Mrs. Grace Moyo", content: "Thank you for the update on John's progress.", time: "10:30 AM", isMine: false },
];

const MessageSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageText, setMessageText] = useState("");

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In real app, this would send the message
      setMessageText("");
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex rounded-xl border border-border overflow-hidden bg-card">
      {/* Conversations List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-foreground mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={cn(
                "w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left",
                selectedConversation.id === conv.id && "bg-secondary"
              )}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                {conv.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-medium text-foreground text-sm truncate">{conv.name}</h4>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{conv.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{conv.role}</p>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              {selectedConversation.online && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{selectedConversation.name}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.online ? "Online" : "Offline"} • {selectedConversation.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.isMine ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2",
                  msg.isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  msg.isMine ? "justify-end" : "justify-start"
                )}>
                  <span className={cn(
                    "text-xs",
                    msg.isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {msg.time}
                  </span>
                  {msg.isMine && (
                    msg.status === "read" 
                      ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                      : <Check className="h-3 w-3 text-primary-foreground/70" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-end gap-3">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              variant="gold" 
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSection;
