import React from 'react';
import { Message as MessageType } from '../types/chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center ${
                   isBot ? 'bg-gray-100' : 'bg-gray-800'} 
                   ${isBot ? 'mr-2' : 'ml-2 order-2'}`}>
        {isBot ? (
          <Bot className="w-4 h-4 text-gray-600" />
        ) : (
          <User className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`flex flex-col max-w-[80%] 
                   ${isBot ? 'items-start' : 'items-end'} 
                   ${isBot ? '' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-2 prose prose-sm max-w-none 
            ${isBot
                ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                : 'bg-gray-800 text-white rounded-tr-none'
            }`}
        >
          {message.isTyping ? (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : (
              isBot ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )
            )}
        </div>
        <span className={`text-xs text-gray-500 mt-1 
                   ${isBot ? 'text-left' : 'text-right'}`}>
          {format(message.timestamp, 'HH:mm aaaa', { locale: es })}
        </span>
      </div>
    </div>
  );
};
