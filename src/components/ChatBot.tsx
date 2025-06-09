import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ChatBot = () => {
  const { messages, isLoading, isConnected, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-card rounded-xl shadow-2xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Asistente Virtual</h1>
            <div className="flex items-center gap-2 text-sm opacity-90">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Desconectado</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <Button
          onClick={clearChat}
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-background">
        <div className="min-h-full p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  ¡Comienza una conversación!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escribe un mensaje para empezar a chatear
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <ChatInput onSendMessage={sendMessage} disabled={!isConnected} />
      
      {/* Connection Status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive text-center">
            Sin conexión al servidor. Reintentando...
          </p>
        </div>
      )}
    </div>
  );
};
