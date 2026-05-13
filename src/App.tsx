/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2, ArrowDownCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getChatResponseStream } from './services/geminiService';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: "Assalomu alaykum! Men Gemini AI botiman. Sizga qanday yordam bera olaman?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, modelMessage]);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      let accumulatedText = '';
      const stream = getChatResponseStream(userMessage.content, history);
      
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMessageId 
            ? { ...msg, content: "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring." } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'model',
        content: "Chat tozalandi. Sizga yana qanday yordam bera olaman?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0B] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-primary/20">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col gap-4 relative">
        
        {/* Header Section */}
        <header className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground/90">Gemini AI Bot</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={clearChat} title="Chatni tozalash" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Chat Main Card */}
        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl bg-white/80 dark:bg-black/40 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5">
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea ref={scrollRef} className="h-full px-4 pt-6">
              <div className="flex flex-col gap-6 pb-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className={cn(
                        "flex items-start gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500",
                        message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <Avatar className={cn(
                        "w-8 h-8 border shadow-sm mt-1",
                        message.role === 'user' ? "border-primary/20" : "border-muted/20 bg-muted/10"
                      )}>
                        {message.role === 'model' ? (
                          <>
                            <AvatarImage src="/bot-avatar.png" />
                            <AvatarFallback className="bg-primary/5 text-primary">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src="/user-avatar.png" />
                            <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>

                      <div className={cn(
                        "flex flex-col gap-1",
                        message.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                          message.role === 'user' 
                            ? "bg-primary text-primary-foreground rounded-tr-none font-medium" 
                            : "bg-muted/30 dark:bg-white/5 text-foreground rounded-tl-none border border-black/5 dark:border-white/5"
                        )}>
                          {message.content || (isLoading && index === messages.length - 1 && (
                            <div className="flex gap-1 py-1">
                              <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 px-1 font-medium italic">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && messages[messages.length - 1].content === "" && (
                   <div className="flex items-center gap-2 text-muted-foreground text-xs italic opacity-50 px-12">
                     <Sparkles className="w-3 h-3 animate-spin" />
                     Geni fikrlamoqda...
                   </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Footer / Input Section */}
          <CardFooter className="p-4 bg-muted/10 dark:bg-black/20 border-t border-black/5 dark:border-white/5">
            <div className="relative w-full flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Xabar yozing..."
                className="flex-1 bg-white dark:bg-white/5 border-none shadow-inner ring-1 ring-black/5 focus-visible:ring-primary h-12 rounded-xl pr-12 transition-all"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 h-9 w-9 p-0 rounded-lg bg-primary hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Floating Scroll Down Indicator (Optional) */}
        <div className="absolute bottom-24 right-8 z-10 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
           <ArrowDownCircle className="w-6 h-6 text-muted-foreground/40 animate-bounce" />
        </div>
        
        <footer className="text-center">
          <p className="text-[11px] text-muted-foreground/50 font-medium tracking-tight">
            Built with Gemini 3 Pro • {new Date().getFullYear()} AI Bot
          </p>
        </footer>
      </div>
    </div>
  );
}

