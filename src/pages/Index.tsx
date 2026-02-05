import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Send, Bot, User, Sparkles, Loader2, ArrowRight,
  GraduationCap, Tractor, Building2, Users, Heart, Shield, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import {
  sendChatMessage,
  type ChatMessage,
  type UserProfile
} from "@/lib/api";

const quickCategories = [
  { icon: GraduationCap, label: "Students", query: "scholarships for students" },
  { icon: Tractor, label: "Farmers", query: "schemes for farmers" },
  { icon: Building2, label: "Business", query: "business loans and MSME schemes" },
  { icon: Users, label: "Women", query: "schemes for women empowerment" },
  { icon: Heart, label: "Senior Citizens", query: "pension schemes for elderly" },
];

const suggestedQuestions = [
  "What schemes am I eligible for?",
  "Find education loans for college students",
  "Housing schemes for low income families",
  "Health insurance schemes in India",
];

export default function Index() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getUserProfile = (): Partial<UserProfile> | undefined => {
    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : undefined;
  };

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue.trim();
    if (!messageToSend || isTyping) return;

    // Start chat mode
    if (!hasStartedChat) {
      setHasStartedChat(true);
      // Add welcome message first
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: "Hi! I'm your AI assistant. I'll help you find government schemes you're eligible for. Just tell me what you need! 🎯",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }

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
        currentPage: "home",
        userProfile: getUserProfile(),
        conversationHistory: messages.slice(-10),
      });

      if (result.success && result.data) {
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: result.data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error("Failed");
      }
    } catch {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again!",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickCategory = (query: string) => {
    handleSend(query);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-180px)] flex flex-col">
        {/* Hero Section - Compact when chatting */}
        <section
          className={`relative transition-all duration-500 ${hasStartedChat ? 'py-6' : 'py-12 md:py-20'
            }`}
          style={{ background: 'var(--gradient-hero)' }}
        >
          <div className="container-gov">
            <div className="text-center max-w-3xl mx-auto">
              {!hasStartedChat && (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm mb-4 animate-fade-in">
                    <Sparkles className="h-4 w-4" />
                    <span>AI-powered scheme discovery</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4 animate-fade-in">
                    Find government schemes you're{" "}
                    <span className="text-gradient">eligible</span> for
                  </h1>

                  <p className="text-base md:text-lg text-primary-foreground/80 mb-8 animate-fade-in">
                    Just type what you need — our AI will find the best schemes for you.
                  </p>
                </>
              )}

              {hasStartedChat && (
                <h2 className="text-lg font-semibold text-primary-foreground flex items-center justify-center gap-2">
                  <Bot className="h-5 w-5" />
                  JanScheme AI Assistant
                </h2>
              )}
            </div>
          </div>
        </section>

        {/* Chat Section */}
        <section className="flex-1 bg-background">
          <div className="container-gov py-6">
            <div className="max-w-3xl mx-auto">

              {/* Messages Area */}
              {hasStartedChat && (
                <div className="bg-card rounded-xl border border-border shadow-sm mb-4 max-h-[400px] overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={i}>{part.slice(2, -2)}</strong>
                                : part
                            )}
                          </p>
                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Finding schemes...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="bg-card rounded-xl border border-border shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={hasStartedChat ? "Type your question..." : "What kind of help do you need? (e.g., scholarship for college)"}
                      className="pr-12 py-6 text-base rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                      disabled={isTyping}
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || isTyping}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-accent hover:bg-accent/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Suggested Questions - Show before chat starts */}
                {!hasStartedChat && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(question)}
                          className="px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm text-foreground transition-colors border border-border/50"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Categories - Show before chat starts */}
              {!hasStartedChat && (
                <div className="mt-8">
                  <h3 className="text-center text-muted-foreground text-sm mb-4">
                    Or browse by category:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {quickCategories.map((cat, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickCategory(cat.query)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <cat.icon className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Indicators */}
              {!hasStartedChat && (
                <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-success" />
                    <span>Official government data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>3,400+ schemes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span>AI-powered matching</span>
                  </div>
                </div>
              )}

              {/* Action buttons when chatting */}
              {hasStartedChat && (
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/search">
                      Browse All Schemes
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/profile">
                      Complete My Profile
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
