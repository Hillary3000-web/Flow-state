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

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = async (text) => {
        const userMessage = text || input.trim();
        if (!userMessage || isLoading) return;

        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Send conversation history for context
            const history = newMessages.slice(0, -1).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const { data } = await client.post('/chatbot/', {
                message: userMessage,
                history,
            });

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.reply },
            ]);
        } catch (err) {
            const errorMsg =
                err.response?.data?.error || 'Something went wrong. Please try again.';
            setMessages((prev) => [
                ...prev,
                { role: 'error', content: errorMsg },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="chatbot-fab"
                        onClick={() => setIsOpen(true)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        title="Chat with FlowState AI"
                        aria-label="Open AI chatbot"
                    >
                        <BsChatDotsFill />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="chatbot-header-left">
                                <div className="chatbot-avatar">
                                    <BsStars />
                                </div>
                                <div className="chatbot-header-info">
                                    <h3>FlowState AI</h3>
                                    <span>Productivity assistant</span>
                                </div>
                            </div>
                            <button
                                className="chatbot-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close chatbot"
                            >
                                <BsXLg />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            {messages.length === 0 ? (
                                <div className="chatbot-welcome">
                                    <div className="chatbot-welcome-icon">
                                        <BsStars />
                                    </div>
                                    <h4>Hi there! 👋</h4>
                                    <p>
                                        I&apos;m your FlowState AI assistant. Ask me anything about
                                        productivity, task management, or building better habits.
                                    </p>
                                    <div className="chatbot-suggestions">
                                        {SUGGESTIONS.map((s) => (
                                            <button
                                                key={s}
                                                className="chatbot-suggestion"
                                                onClick={() => sendMessage(s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`chatbot-message ${msg.role === 'error' ? 'chatbot-error' : msg.role}`}
                                    >
                                        {msg.content}
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
                            <input
                                ref={inputRef}
                                className="chatbot-input"
                                type="text"
                                placeholder="Ask anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button
                                className="chatbot-send"
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading}
                                aria-label="Send message"
                            >
                                <BsSendFill />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
