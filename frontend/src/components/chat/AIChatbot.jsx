import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsChatDotsFill, BsXLg, BsSendFill, BsStars } from 'react-icons/bs';
import client from '../../api/client';
import './AIChatbot.css';

const SUGGESTIONS = [
    'How can I be more productive?',
    'Help me prioritize my tasks',
    'Tips for better focus',
    'Plan my morning routine',
];

const SESSION_KEY = 'flowstate_chat_history';

// ── Inline markdown renderer ──────────────────────────────────────────────────
// Handles: **bold**, `code`, ## headers, bullet lists, numbered lists, line breaks

function formatInline(text) {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const codeMatch = remaining.match(/`([^`]+?)`/);

        const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
        const codeIdx = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

        if (boldIdx === Infinity && codeIdx === Infinity) {
            parts.push(remaining);
            break;
        }

        if (boldIdx <= codeIdx) {
            if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx));
            parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldIdx + boldMatch[0].length);
        } else {
            if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx));
            parts.push(
                <code key={key++} style={{ background: 'rgba(99,102,241,0.15)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {codeMatch[1]}
                </code>
            );
            remaining = remaining.slice(codeIdx + codeMatch[0].length);
        }
    }

    return parts;
}

function MessageContent({ content }) {
    const lines = content.split('\n');
    const elements = [];
    let listBuffer = [];
    let listType = null;

    const flushList = () => {
        if (listBuffer.length === 0) return;
        if (listType === 'ordered') {
            elements.push(<ol key={elements.length} style={{ paddingLeft: '20px', margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>{listBuffer}</ol>);
        } else {
            elements.push(<ul key={elements.length} style={{ paddingLeft: '20px', margin: '4px 0', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: '2px' }}>{listBuffer}</ul>);
        }
        listBuffer = [];
        listType = null;
    };

    lines.forEach((line, i) => {
        if (!line.trim()) {
            flushList();
            elements.push(<br key={`br-${i}`} />);
            return;
        }

        // Headers
        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
            flushList();
            const text = line.replace(/^#{1,3}\s/, '');
            elements.push(
                <p key={i} style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: '6px 0 2px' }}>
                    {formatInline(text)}
                </p>
            );
            return;
        }

        // Bullet list
        if (/^[-*•]\s/.test(line)) {
            if (listType && listType !== 'unordered') flushList();
            listType = 'unordered';
            listBuffer.push(<li key={i} style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{formatInline(line.replace(/^[-*•]\s/, ''))}</li>);
            return;
        }

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
            if (listType && listType !== 'ordered') flushList();
            listType = 'ordered';
            listBuffer.push(<li key={i} style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{formatInline(line.replace(/^\d+\.\s/, ''))}</li>);
            return;
        }

        flushList();
        elements.push(
            <p key={i} style={{ margin: '2px 0', lineHeight: 1.55, fontSize: '13.5px' }}>
                {formatInline(line)}
            </p>
        );
    });

    flushList();
    return <div>{elements}</div>;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Persist messages to sessionStorage on every change
    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
        } catch { /* storage quota exceeded — non-critical */ }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    const sendMessage = async (text) => {
        const userMessage = text || input.trim();
        if (!userMessage || isLoading) return;

        const updatedMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = updatedMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
            const { data } = await client.post('/chatbot/', { message: userMessage, history });
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
            setMessages(prev => [...prev, { role: 'error', content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
        sessionStorage.removeItem(SESSION_KEY);
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button className="chatbot-fab" onClick={() => setIsOpen(true)}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        title="Chat with FlowState AI" aria-label="Open AI chatbot">
                        <BsChatDotsFill />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div className="chatbot-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}>

                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="chatbot-header-left">
                                <div className="chatbot-avatar"><BsStars /></div>
                                <div className="chatbot-header-info">
                                    <h3>FlowState AI</h3>
                                    <span>Productivity assistant</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {messages.length > 0 && (
                                    <button onClick={clearHistory} className="chatbot-close"
                                        title="Clear conversation" style={{ fontSize: '11px', width: 'auto', padding: '4px 8px', borderRadius: '6px' }}>
                                        Clear
                                    </button>
                                )}
                                <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close chatbot">
                                    <BsXLg />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            {messages.length === 0 ? (
                                <div className="chatbot-welcome">
                                    <div className="chatbot-welcome-icon"><BsStars /></div>
                                    <h4>Hi there! 👋</h4>
                                    <p>I&apos;m your FlowState AI assistant. Ask me anything about productivity, task management, or building better habits.</p>
                                    <div className="chatbot-suggestions">
                                        {SUGGESTIONS.map(s => (
                                            <button key={s} className="chatbot-suggestion" onClick={() => sendMessage(s)}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className={`chatbot-message ${msg.role === 'error' ? 'chatbot-error' : msg.role}`}>
                                        {msg.role === 'assistant' ? <MessageContent content={msg.content} /> : msg.content}
                                    </div>
                                ))
                            )}

                            {isLoading && (
                                <div className="chatbot-typing">
                                    <span /><span /><span />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chatbot-input-area">
                            <input ref={inputRef} className="chatbot-input" type="text"
                                placeholder="Ask anything..." value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                disabled={isLoading} />
                            <button className="chatbot-send" onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading} aria-label="Send message">
                                <BsSendFill />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
