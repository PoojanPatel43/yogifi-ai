import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import api from '../../lib/api';

interface ChatMessage {
  id: string;
  role: 'USER' | 'AI';
  content: string;
}

const AIChatView: React.FC = () => {
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        if (res.data?.data && Array.isArray(res.data.data)) {
          type RawMsg = { role?: string; content?: string; message?: string };
          type RawConversation = { messages?: RawMsg[] };
          const history: ChatMessage[] = res.data.data.flatMap((conversation: RawConversation, ci: number) =>
            (conversation.messages || []).map((msg: RawMsg, mi: number) => ({
              id: `hist-${ci}-${mi}`,
              role: (msg.role || 'AI').toUpperCase() as 'USER' | 'AI',
              content: msg.content || msg.message || '',
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
          content: aiResponse.message,
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'AI',
        content: 'Connection failed. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <p className="ck-label" style={{ marginBottom: '0.5rem' }}>Intelligence Interface</p>
        <h2 style={{
          fontFamily: '"Outfit", sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '0.4rem',
        }}>
          AI Coach Chat
        </h2>
        <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '0.875rem' }}>
          General wellness &amp; protocol inquiries.
        </p>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid var(--brutal)' }}>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.length === 0 && !isLoading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontWeight: 300, fontStyle: 'italic' }}>
              Ask me anything about yoga and wellness…
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              style={{ display: 'flex', justifyContent: msg.role === 'USER' ? 'flex-end' : 'flex-start' }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '80%', flexDirection: msg.role === 'USER' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{
                  width: '32px', height: '32px', flexShrink: 0,
                  background: msg.role === 'USER' ? 'var(--brutal)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg)',
                }}>
                  {msg.role === 'USER' ? <User size={14} /> : <Bot size={14} />}
                </div>
                {/* Bubble — hard shadow */}
                <div style={{
                  padding: '0.875rem 1.125rem',
                  background: msg.role === 'USER' ? 'var(--brutal)' : 'var(--bg)',
                  color:      msg.role === 'USER' ? 'var(--bg)'     : 'var(--ink)',
                  fontWeight: 300, fontSize: '0.875rem', lineHeight: 1.6,
                  border: '2px solid var(--brutal)',
                  boxShadow: msg.role === 'USER'
                    ? '4px 4px 0 0 rgba(210,232,35,0.5)'
                    : '4px 4px 0 0 var(--brutal)',
                  borderLeft: msg.role === 'AI' ? '3px solid var(--accent)' : '2px solid var(--brutal)',
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', flexShrink: 0 }}>
                <Bot size={14} />
              </div>
              <div style={{
                padding: '0.875rem 1.125rem', background: 'var(--bg)',
                border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)',
                display: 'flex', gap: '0.4rem', alignItems: 'center',
              }}>
                {[0, 1, 2].map(d => (
                  <div
                    key={d}
                    style={{
                      width: 6, height: 6,
                      background: 'var(--accent)',
                      animation: `bounce 0.9s ${d * 0.15}s infinite`,
                    }}
                    className="animate-bounce"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, padding: '1rem 1.5rem', borderTop: '2px solid var(--brutal)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the intelligence model…"
              className="ck-input"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-brutalist"
              style={{ padding: '0.625rem 1rem', opacity: (isLoading || !input.trim()) ? 0.4 : 1, flexShrink: 0 }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
