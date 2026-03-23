'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { Send, Smile, Paperclip, Loader2, User } from 'lucide-react';
import RankBadge, { RankType } from '../profile/RankBadge';

interface ChatWindowProps {
  userId: string;
  conversationId: string;
  userRank?: RankType;
  userAvatarUrl?: string;
  userName?: string;
}

export default function ChatWindow({ 
  userId, 
  conversationId, 
  userRank = 'Initiate', 
  userAvatarUrl,
  userName = 'Case Discussion'
}: ChatWindowProps) {
  const { messages, isConnected, typingUsers, sendMessage, sendTyping } = useChat(userId, conversationId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    sendTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB] bg-white flex items-center justify-center">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 scale-75 z-10">
              <RankBadge rank={userRank} showIconOnly={true} />
            </div>
            <div className={`absolute -top-0.5 -left-0.5 w-3 h-3 border-2 border-white rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          </div>
          <div>
            <h3 className="font-bold text-[#111827] text-sm leading-tight">{userName}</h3>
            <p className="text-[10px] text-gray-500">{isConnected ? 'Online' : 'Reconnecting...'}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <div 
            key={msg.id || idx} 
            className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.sender_id === userId 
                ? 'bg-[#00B4D8] text-white rounded-tr-none' 
                : 'bg-white text-[#1A1A1A] border border-[#E5E7EB] rounded-tl-none'
            }`}>
              <p>{msg.content}</p>
              <span className={`text-[10px] mt-1 block opacity-70 ${msg.sender_id === userId ? 'text-right' : 'text-left'}`}>
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
             <div className="bg-white border border-[#E5E7EB] p-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#E5E7EB] flex items-center gap-2">
        <button type="button" className="p-2 text-gray-400 hover:text-[#00B4D8] transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <input 
            type="text" 
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full pl-4 pr-10 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#00B4D8] outline-none transition-all"
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00B4D8]">
            <Smile className="w-5 h-5" />
          </button>
        </div>
        <button 
          type="submit" 
          disabled={!input.trim() || !isConnected}
          className="p-2.5 bg-[#111827] text-white rounded-xl hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
