
import { ChatBot } from '@/components/ChatBot';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Chatbot Coomeva
          </h1>
        </div>
        
        <ChatBot />
        
      </div>
    </div>
  );
};

export default Index;
