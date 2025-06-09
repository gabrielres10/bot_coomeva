
import { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 mb-1"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={disabled}
            className={cn(
              "pr-12 py-3 resize-none bg-muted/50 border-muted-foreground/20 focus:border-primary",
              "transition-all duration-200 hover:bg-muted/70"
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || disabled}
            className={cn(
              "absolute right-1 top-1 h-8 w-8 transition-all duration-200",
              message.trim() && !disabled 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </form>
  );
};
