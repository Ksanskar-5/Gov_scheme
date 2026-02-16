import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendChatMessage,
  getChatSuggestions,
  type ChatMessage,
  type UserProfile
} from "@/lib/api";

const defaultSuggestions = [
  "What schemes can help farmers?",
  "Am I eligible for housing subsidy?",
  "How to apply for education scholarship?",
  "Business loans for women entrepreneurs"
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const params = useParams<{ id?: string }>();

  // Get current scheme ID if on scheme detail page
  const getCurrentSchemeId = (): number | undefined => {
    if (location.pathname.startsWith("/scheme/") && params.id) {
      // The ID in params is actually the slug, we'd need to fetch the scheme
      // For now, we'll pass undefined and let the backend handle it
      return undefined;
    }
    return undefined;
  };

  // Get current page context
  const getCurrentPage = (): string => {
    if (location.pathname.startsWith("/scheme/")) return "scheme";
    if (location.pathname === "/search") return "search";
    if (location.pathname === "/profile") return "profile";
    if (location.pathname === "/dashboard") return "dashboard";
    return "home";
  };

  // Get user profile from localStorage
  const getUserProfile = (): Partial<UserProfile> | undefined => {
    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : undefined;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggestions and initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: "Namaste! 🙏 I'm your AI scheme advisor. Ask me about government schemes, eligibility, or application processes. How can I help you today?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);

      // Load suggestions
      loadSuggestions();
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      const result = await getChatSuggestions(getCurrentSchemeId(), getCurrentPage());
      if (result.success && result.data) {
        setSuggestions(result.data);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue.trim();
    if (!messageToSend || isTyping) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const result = await sendChatMessage(messageToSend, {
        currentSchemeId: getCurrentSchemeId(),
        currentPage: getCurrentPage(),
        userProfile: getUserProfile(),
        conversationHistory: messages.slice(-10), // Last 10 messages
      });

      if (result.success && result.data) {
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: result.data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Update suggestions if provided
        if (result.data.suggestedActions && result.data.suggestedActions.length > 0) {
          setSuggestions(result.data.suggestedActions);
        }
      } else {
        // Fallback response
        const fallbackMessage: ChatMessage = {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or browse the schemes directly.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, something went wrong. Please check your connection and try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-gov-lg flex items-center justify-center transition-all duration-300 group ${isOpen
          ? "bg-muted-foreground hover:bg-muted-foreground/90 scale-95"
          : "bg-gradient-to-r from-primary to-accent hover:scale-110 chat-button-glow"
          }`}
        aria-label={isOpen ? "Close chat" : "Open AI assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-200" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center animate-bounce-subtle">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-card/95 backdrop-blur-xl rounded-2xl shadow-gov-xl border border-border/50 overflow-hidden animate-scale-in"
          role="dialog"
          aria-label="AI Chat Assistant"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">JanScheme Assistant</h3>
                <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-Powered Help
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[360px] overflow-y-auto p-4 space-y-4 bg-secondary/30">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user"
                  ? "bg-accent text-white"
                  : "bg-primary text-primary-foreground"
                  }`}>
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${message.role === "user"
                  ? "bg-accent text-white rounded-tr-sm"
                  : "bg-card border border-border rounded-tl-sm"
                  }`}>
                  {message.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-border bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    disabled={isTyping}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about schemes..."
                className="flex-1"
                aria-label="Type your message"
                disabled={isTyping}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              AI provides guidance only. Verify with official sources.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
