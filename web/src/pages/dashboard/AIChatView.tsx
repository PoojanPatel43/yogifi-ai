import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import api from '../../lib/api';

interface ChatMessage {
  id: string; // generated locally for key
  role: 'USER' | 'AI';
  content: string;
}

const AIChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    const fetchHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        if (res.data?.data && Array.isArray(res.data.data)) {
          // Backend returns List<ChatHistoryResponse>:
          // [{ conversationId, title, updatedAt, messages: [{ role, content, createdAt }] }]
          // Flatten all conversations' messages into a single list
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const history: ChatMessage[] = res.data.data.flatMap((conversation: any, ci: number) =>
            (conversation.messages || []).map((msg: any, mi: number) => ({
              id: `hist-${ci}-${mi}`,
              role: (msg.role || 'AI').toUpperCase() as 'USER' | 'AI',
              content: msg.content || msg.message || ''
            }))
          );
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'USER', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat/ask', { message: userMessage });
      if (response.data?.data) {
        const aiResponse = response.data.data;
        setMessages(prev => [...prev, { 
          id: Date.now().toString() + 'ai', 
          role: aiResponse.role || 'AI', 
          content: aiResponse.message 
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'AI', content: 'Connection to Intelligence Engine failed. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-6 shrink-0">
        <h2 className="font-serif italic text-3xl text-cream mb-2">Intelligence Interface</h2>
        <p className="font-outfit text-cream/50">General wellness & protocol inquiries.</p>
      </div>

      <div className="flex-1 bg-[#111] rounded-[2rem] border border-cream/5 flex flex-col overflow-hidden relative">
        
        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {messages.length === 0 && !isLoading && (
             <div className="h-full flex items-center justify-center text-cream/30 font-outfit italic">
               Waiting for input...
             </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'USER' ? 'bg-cream/10 text-cream' : 'bg-moss text-clay'}`}>
                  {msg.role === 'USER' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`px-5 py-4 rounded-2xl font-outfit leading-relaxed ${
                  msg.role === 'USER' 
                    ? 'bg-clay text-cream rounded-tr-sm' 
                    : 'bg-[#1A1A1A] text-cream/90 border border-cream/5 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 shrink-0 rounded-full bg-moss text-clay flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-[#1A1A1A] border border-cream/5 rounded-tl-sm text-cream/50 font-mono tracking-widest text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-clay rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-[#111] border-t border-cream/5">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the intelligence model..."
              className="w-full bg-[#1A1A1A] border border-cream/10 rounded-full px-6 py-4 pr-14 text-cream font-outfit focus:outline-none focus:border-clay/50 transition-colors placeholder:text-cream/30"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full bg-clay text-cream hover:bg-[#a64627] disabled:opacity-50 disabled:hover:bg-clay transition-all"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AIChatView;
