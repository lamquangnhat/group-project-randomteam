import { useState, useRef, useEffect } from "react";
import { Send, MapPin, Compass, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { locationsApi, adaptLocation } from "../lib/api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  destinations?: Array<{
    name: string;
    location: string;
  }>;
}

export function AIAssistancePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI travel assistant. Ask me anything about destinations, travel tips, itineraries, or local recommendations. I can also show you maps to help visualize your journey!"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const raw = await locationsApi.aiSearch(prompt);
      const adapted = raw.map(adaptLocation);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          adapted.length > 0
            ? `Here are ${adapted.length} place${adapted.length === 1 ? "" : "s"} I found for you:`
            : "I couldn't find matching destinations for that. Try a different travel-related question.",
        destinations: adapted.map((d) => ({ name: d.name, location: d.location })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I couldn't reach the search service. Please make sure the backend is running and try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the best beaches in Bali?",
    "Plan a 7-day trip to Paris",
    "Budget travel tips for Southeast Asia",
    "Best time to visit the Maldives"
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_25%,#46e6b4_0%,transparent_28%),radial-gradient(circle_at_88%_10%,#75c7ff_0%,transparent_25%),linear-gradient(135deg,#071827_0%,#173a58_55%,#0f6170_100%)] px-4 py-8 text-white shadow-md sm:px-6 lg:px-8">
        <div className="absolute -left-20 top-4 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-10 top-4 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-50 ring-1 ring-white/15">
                  <Compass className="h-3.5 w-3.5 text-emerald-300" />
                  Smart travel ideas
                </div>
                <h1 className="text-3xl font-black tracking-tight">AI Travel Assistant</h1>
                <p className="text-sm text-slate-100/85">Your personal guide to exploring the world</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm text-slate-100 shadow-lg backdrop-blur">
              Ask for itineraries, beaches, food spots, budgets, or destination tips.
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 1 && (
            <div className="mb-8">
              <p className="text-muted-foreground text-sm mb-4">Try asking:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="text-left px-4 py-3 bg-card rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                )}

                <div className={`flex flex-col gap-3 ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-3xl`}>
                  <div
                    className={`px-5 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary text-black'
                        : 'bg-card border border-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>

                  {message.destinations && message.destinations.length > 0 && (
                    <div className="w-full max-w-2xl space-y-3">
                      {message.destinations.map((destination, index) => (
                        <div key={index} className="bg-card rounded-xl overflow-hidden border border-border shadow-md">
                          <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-sm">{destination.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{destination.location}</span>
                          </div>
                          <div className="aspect-video bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Compass className="w-16 h-16 text-primary/20" />
                            </div>
                            <div className="relative z-10 text-center p-8">
                              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <MapPin className="w-6 h-6 text-black" />
                              </div>
                              <p className="text-sm text-muted-foreground">Interactive map view</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                (Map integration would show {destination.name} here)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-6 h-6 bg-primary rounded-full"></div>
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div className="px-5 py-3 rounded-2xl bg-card border border-border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about travel destinations, tips, or planning..."
              className="flex-1 px-4 py-3 bg-input-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-primary text-black rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by backend AI search. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}
