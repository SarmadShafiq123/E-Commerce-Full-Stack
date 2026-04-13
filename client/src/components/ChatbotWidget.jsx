import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

const QUICK_REPLIES = [
  'Shipping info',
  'Return policy',
  'Payment methods',
  'Track my order',
  'Discount codes',
];

const BotMsg = ({ text }) => (
  <div className="flex items-start gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-white text-[10px]">LB</span>
    </div>
    <div className="bg-white border border-[#EAEAEA] rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
      <p className="text-sm text-[#1A1A1A] leading-relaxed">{text}</p>
    </div>
  </div>
);

const UserMsg = ({ text }) => (
  <div className="flex justify-end mb-3">
    <div className="bg-[#1A1A1A] rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]">
      <p className="text-sm text-white leading-relaxed">{text}</p>
    </div>
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-start gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
      <span className="text-white text-[10px]">LB</span>
    </div>
    <div className="bg-white border border-[#EAEAEA] rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex gap-1 items-center">
        {[0,1,2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);

const ChatbotWidget = () => {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! Welcome to Luxe Bags. How can I help you today? 👜' },
  ]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { type: 'user', text: msg }]);
    setInput('');
    setTyping(true);

    try {
      const { data } = await aiAPI.chat(msg);
      // Small delay for natural feel
      await new Promise((r) => setTimeout(r, 600));
      setTyping(false);
      setMessages((prev) => [...prev, { type: 'bot', text: data.data.response }]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setTyping(false);
      setMessages((prev) => [...prev, {
        type: 'bot',
        text: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
      }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center hover:opacity-80 transition duration-300"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-medium rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-[#FAFAFA] rounded-2xl border border-[#EAEAEA] flex flex-col overflow-hidden"
          style={{ height: 480 }}>

          {/* Header */}
          <div className="bg-[#1A1A1A] px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white text-xs font-medium">LB</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Luxe Bags Assistant</p>
              <p className="text-white/50 text-[10px]">AI-powered support</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((m, i) =>
              m.type === 'bot'
                ? <BotMsg key={i} text={m.text} />
                : <UserMsg key={i} text={m.text} />
            )}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {QUICK_REPLIES.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="shrink-0 px-3 py-1.5 bg-white border border-[#EAEAEA] rounded-full text-[10px] tracking-wide text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition duration-300 whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 bg-white border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
            />
            <button type="submit" disabled={!input.trim() || typing}
              className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center hover:opacity-80 transition duration-300 disabled:opacity-40 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
