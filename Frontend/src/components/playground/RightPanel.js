'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Send, MessageSquarePlus, History, X, Pencil, Trash2,
    Sparkles, Bot, ImageIcon
} from 'lucide-react';
import { apiFetch } from '@/utils/api';

export default function RightPanel({ subject, currentTopic, activeMode, language = 'en', languageName = 'English' }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [infographicMode, setInfographicMode] = useState(false);
    const [lightboxImg, setLightboxImg] = useState(null);
    const messagesEndRef = useRef(null);

    const subjectId = subject?.id;
    const subjectName = subject?.name || '';

    // Load threads when subject changes
    useEffect(() => {
        if (!subjectId) return;
        const loadThreads = async () => {
            try {
                const data = await apiFetch(`/api/chat/threads/${subjectId}`);
                setThreads(data || []);
            } catch (err) {
            }
        };
        loadThreads();
    }, [subjectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isTyping) return;
        const currentInput = input.trim();
        setInput('');

        if (infographicMode) {
            // ─── Infographic generation mode ───
            const userMsg = { role: 'user', content: `🎨 Generate infographic: ${currentInput}`, time: Date.now() };
            setMessages(prev => [...prev, userMsg]);
            setIsTyping(true);

            try {
                const res = await apiFetch('/api/images/generate', {
                    method: 'POST',
                    body: JSON.stringify({
                        prompt: currentInput,
                        subjectId,
                        topicTitle: currentTopic,
                        language: languageName,
                    })
                });

                const imgMsg = {
                    role: 'ai', content: `[IMG]${res.imageUrl}`, time: Date.now(),
                    imageUrl: res.imageUrl,
                    imagePrompt: currentInput,
                };
                setMessages(prev => [...prev, imgMsg]);

                // Always save infographic chat to history (create thread if needed)
                try {
                    const saveRes = await apiFetch('/api/chat/send', {
                        method: 'POST',
                        body: JSON.stringify({
                            threadId: activeThread,
                            subjectId,
                            message: `🎨 Generate infographic: ${currentInput}`,
                            topicTitle: currentTopic,
                            subjectName,
                            mode: activeMode,
                            language: languageName,
                            skipAI: true,
                            aiResponse: `[IMG]${res.imageUrl}`,
                        })
                    });
                    // Update thread state if a new thread was created
                    if (!activeThread && saveRes.threadId) {
                        setActiveThread(saveRes.threadId);
                        setThreads(prev => [{ id: saveRes.threadId, name: saveRes.threadName || `🎨 ${currentInput.substring(0, 40)}`, updated_at: new Date().toISOString() }, ...prev]);
                    }
                } catch (saveErr) {
                }
            } catch (err) {
                setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Failed to generate image. Please try again.', time: Date.now() }]);
            } finally {
                setIsTyping(false);
            }
        } else {
            // ─── Normal chat mode ───
            const userMsg = { role: 'user', content: currentInput, time: Date.now() };
            setMessages(prev => [...prev, userMsg]);
            setIsTyping(true);

            try {
                const res = await apiFetch('/api/chat/send', {
                    method: 'POST',
                    body: JSON.stringify({
                        threadId: activeThread,
                        subjectId,
                        message: currentInput,
                        topicTitle: currentTopic,
                        subjectName,
                        mode: activeMode,
                        language: languageName
                    })
                });

                const aiMsg = { role: 'ai', content: res.response, time: Date.now() };
                setMessages(prev => [...prev, aiMsg]);

                if (!activeThread && res.threadId) {
                    setActiveThread(res.threadId);
                    setThreads(prev => [{ id: res.threadId, name: res.threadName || currentInput.substring(0, 50), updated_at: new Date().toISOString() }, ...prev]);
                }
            } catch (err) {
                setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Sorry, something went wrong. Please try again.', time: Date.now() }]);
            } finally {
                setIsTyping(false);
            }
        }
    }, [input, activeThread, currentTopic, activeMode, subjectId, subjectName, languageName, isTyping, infographicMode]);

    const newChat = () => {
        setMessages([]);
        setActiveThread(null);
        setShowHistory(false);
    };

    const selectThread = async (thread) => {
        setShowHistory(false);
        setActiveThread(thread.id);
        try {
            const data = await apiFetch(`/api/chat/messages/${thread.id}`);
            setMessages((data || []).map(m => {
                const isImage = m.content?.startsWith('[IMG]');
                return {
                    role: m.role,
                    content: m.content,
                    time: new Date(m.created_at).getTime(),
                    ...(isImage ? {
                        imageUrl: m.content.replace('[IMG]', ''),
                        imagePrompt: 'Infographic',
                    } : {}),
                };
            }));
        } catch (err) {
        }
    };

    const removeThread = async (threadId) => {
        try {
            await apiFetch(`/api/chat/threads/${threadId}`, { method: 'DELETE' });
            setThreads(prev => prev.filter(t => t.id !== threadId));
            if (activeThread === threadId) { setMessages([]); setActiveThread(null); }
        } catch (err) {
        }
    };

    const renameThread = async (threadId) => {
        if (!editName.trim()) return;
        try {
            await apiFetch(`/api/chat/threads/${threadId}`, { method: 'PUT', body: JSON.stringify({ name: editName.trim() }) });
            setThreads(prev => prev.map(t => t.id === threadId ? { ...t, name: editName.trim() } : t));
        } catch (err) { }
        setEditingId(null);
        setEditName('');
    };

    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, j) => {
            if (line.startsWith('```')) return null;
            const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
            return (
                <p key={j} style={{ margin: j > 0 ? '6px 0 0' : 0 }}>
                    {parts.map((part, k) => {
                        if (part.startsWith('**') && part.endsWith('**'))
                            return <strong key={k}>{part.slice(2, -2)}</strong>;
                        if (part.startsWith('`') && part.endsWith('`'))
                            return <code key={k} style={{ background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{part.slice(1, -1)}</code>;
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'relative',
        }}>
            {/* Lightbox Overlay */}
            {lightboxImg && createPortal(
                <div onClick={() => setLightboxImg(null)} style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.85)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    <img src={lightboxImg} alt="Infographic" style={{
                        maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12,
                        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                    }} />
                    <button onClick={() => setLightboxImg(null)} style={{
                        position: 'absolute', top: 20, right: 20,
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)', border: 'none',
                        color: 'white', fontSize: '1.25rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>,
                document.body
            )}

            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Bot size={14} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AI Tutor
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    {/* Infographic toggle */}
                    <button onClick={() => {
                        if (!infographicMode && messages.length > 0) {
                            // Switching TO infographic mode while mid-conversation → start new chat
                            setMessages([]);
                            setActiveThread(null);
                        }
                        setInfographicMode(!infographicMode);
                    }} title="Infographic Mode"
                        style={{
                            padding: '6px', borderRadius: 'var(--radius-sm)',
                            background: infographicMode ? 'rgba(245,158,11,0.15)' : 'transparent',
                            border: infographicMode ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                            cursor: 'pointer', color: infographicMode ? '#f59e0b' : 'var(--text-muted)',
                            transition: 'all 0.2s',
                        }}>
                        <ImageIcon size={16} />
                    </button>
                    <button onClick={() => setShowHistory(!showHistory)} title="Chat History"
                        style={{
                            padding: '6px', borderRadius: 'var(--radius-sm)',
                            background: showHistory ? 'rgba(99,102,241,0.1)' : 'transparent',
                            border: 'none', cursor: 'pointer', color: showHistory ? 'var(--accent)' : 'var(--text-muted)',
                            transition: 'all 0.2s',
                        }}>
                        <History size={16} />
                    </button>
                    <button onClick={newChat} title="New Chat"
                        style={{
                            padding: '6px', borderRadius: 'var(--radius-sm)', background: 'transparent',
                            border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s',
                        }}>
                        <MessageSquarePlus size={16} />
                    </button>
                </div>
            </div>

            {/* Infographic mode banner */}
            {infographicMode && (
                <div style={{
                    padding: '8px 16px', background: 'rgba(245,158,11,0.08)',
                    borderBottom: '1px solid rgba(245,158,11,0.15)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b',
                }}>
                    🎨 Infographic Mode — Describe the image you want!
                </div>
            )}

            {/* Chat History Drawer */}
            {showHistory && (
                <div style={{
                    position: 'absolute', top: 52, left: 0, right: 0, bottom: 0,
                    background: 'var(--bg-card)', zIndex: 10,
                    borderTop: '1px solid var(--border-color)',
                    overflowY: 'auto', animation: 'fadeIn 0.15s ease-out',
                }}>
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Chat History</span>
                            <button onClick={() => setShowHistory(false)} style={{
                                background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
                            }}><X size={16} /></button>
                        </div>
                        {threads.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '32px 0' }}>
                                No previous chats
                            </p>
                        ) : threads.map(thread => (
                            <div key={thread.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                                background: activeThread === thread.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                                marginBottom: 4, cursor: 'pointer', transition: 'background 0.15s',
                            }} onClick={() => selectThread(thread)}>
                                <MessageSquarePlus size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                {editingId === thread.id ? (
                                    <input value={editName} onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && renameThread(thread.id)}
                                        onBlur={() => renameThread(thread.id)} autoFocus
                                        style={{
                                            flex: 1, fontSize: '0.8125rem', padding: '2px 6px',
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                            borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
                                        }}
                                    />
                                ) : (
                                    <span style={{
                                        flex: 1, fontSize: '0.8125rem', color: 'var(--text-primary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>{thread.name}</span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setEditingId(thread.id); setEditName(thread.name); }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                                    <Pencil size={12} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); removeThread(thread.id); }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 12,
            }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sparkles size={24} style={{ color: 'var(--accent)' }} />
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Ask me anything
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            about <strong style={{ color: 'var(--accent)' }}>{currentTopic}</strong>
                        </p>
                        {infographicMode && (
                            <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 8 }}>
                                🎨 Infographic mode is ON — describe the image you want
                            </p>
                        )}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                        <div style={{
                            maxWidth: '88%', padding: msg.imageUrl ? '6px' : '12px 16px', borderRadius: 16,
                            fontSize: '0.8125rem', lineHeight: 1.6,
                            animation: 'fadeIn 0.2s ease-out',
                            ...(msg.role === 'user' ? {
                                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                                color: 'white', borderBottomRightRadius: 4,
                            } : {
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', borderBottomLeftRadius: 4,
                            }),
                        }}>
                            {msg.imageUrl ? (
                                <div>
                                    <img
                                        src={msg.imageUrl}
                                        alt={msg.imagePrompt || 'Infographic'}
                                        onClick={() => setLightboxImg(msg.imageUrl)}
                                        style={{
                                            width: '100%', maxWidth: 320, borderRadius: 12,
                                            cursor: 'zoom-in', display: 'block',
                                            transition: 'transform 0.2s',
                                        }}
                                    />
                                    <p style={{
                                        fontSize: '0.7rem', color: 'var(--text-muted)',
                                        padding: '6px 8px 4px', margin: 0,
                                    }}>
                                        🎨 {msg.imagePrompt || 'Infographic'} — <span style={{ cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }} onClick={() => setLightboxImg(msg.imageUrl)}>click to enlarge</span>
                                    </p>
                                </div>
                            ) : msg.role === 'user' ? (
                                <p>{msg.content}</p>
                            ) : (
                                renderMarkdown(msg.content)
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '12px 20px', borderRadius: 16, borderBottomLeftRadius: 4,
                            background: 'var(--bg-secondary)',
                            display: 'flex', gap: 4, alignItems: 'center',
                        }}>
                            {infographicMode ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🎨 Generating image...</span>
                            ) : (
                                [0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)',
                                        animation: `float 1.4s ease-in-out infinite`,
                                        animationDelay: `${i * 0.2}s`,
                                    }} />
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '12px 14px', borderTop: '1px solid var(--border-color)',
                background: 'transparent',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--bg-secondary)', borderRadius: 28,
                    padding: '4px 6px 4px 18px',
                    border: `1px solid ${infographicMode ? 'rgba(245,158,11,0.3)' : 'var(--border-color)'}`,
                    transition: 'border-color 0.2s',
                }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder={infographicMode ? 'Describe the infographic you want...' : 'Type your message...'}
                        disabled={isTyping}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            fontSize: '0.8125rem', color: 'var(--text-primary)', padding: '8px 0',
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isTyping}
                        style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: input.trim() && !isTyping
                                ? (infographicMode ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))')
                                : 'var(--bg-card)',
                            border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', flexShrink: 0,
                        }}
                    >
                        {infographicMode
                            ? <ImageIcon size={14} style={{ color: input.trim() && !isTyping ? 'white' : 'var(--text-muted)' }} />
                            : <Send size={14} style={{ color: input.trim() && !isTyping ? 'white' : 'var(--text-muted)' }} />
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
