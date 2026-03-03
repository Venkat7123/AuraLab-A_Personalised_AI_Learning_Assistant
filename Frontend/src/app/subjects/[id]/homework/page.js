'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Send, ImagePlus, Loader2, X, Trash2, Sparkles,
    MessageSquare, BookOpen, Plus, Clock, User, Bot, ChevronLeft, Languages
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useSubject } from '@/context/SubjectContext';
import { apiFetch, apiUpload } from '@/utils/api';

const LANG_NAME_MAP = {
    'en': 'English', 'ta': 'Tamil', 'hi': 'Hindi', 'kn': 'Kannada', 'te': 'Telugu',
};

export default function HomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { subject, language, setLanguage } = useSubject();
    const [mounted, setMounted] = useState(false);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [question, setQuestion] = useState('');
    const [sending, setSending] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Chat sessions (grouped from history)
    const [sessions, setSessions] = useState([]);
    const [activeSessionIdx, setActiveSessionIdx] = useState(0);

    const fileRef = useRef(null);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Colors
    const accentColors = [
        ['#6366f1', '#8b5cf6'],
        ['#ec4899', '#f43f5e'],
        ['#10b981', '#14b8a6'],
        ['#f59e0b', '#f97316'],
        ['#06b6d4', '#3b82f6'],
        ['#8b5cf6', '#a855f7'],
    ];
    const colors = subject
        ? accentColors[Math.abs(subject.id?.charCodeAt(0) || 0) % accentColors.length]
        : accentColors[0];

    // Auth + set mounted
    useEffect(() => {
        if (!authLoading && !user) { router.push('/login'); return; }
        if (subject) {
            setMounted(true);
            document.title = `Homework – ${subject?.name || 'Subject'} – AuraLab`;
        }
    }, [user, authLoading, subject, router]);

    // Mobile detection and sidebar state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkMobile = () => {
                const mobile = window.innerWidth <= 768;
                setIsMobile(mobile);
                setSidebarOpen(!mobile); // Close sidebar by default on mobile
            };
            checkMobile(); // Initial check
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, []); // Run once on mount

    // Load history and group into sessions
    useEffect(() => {
        if (!subject || !user) return;
        const loadHistory = async () => {
            try {
                const data = await apiFetch(`/api/scan/history/${subject.id}`);
                if (data && data.length > 0) {
                    const allMsgs = data.map(entry => ({
                        role: entry.role,
                        imageUrl: entry.image_url || null,
                        text: entry.text || null,
                        createdAt: entry.created_at,
                    }));
                    // Group into sessions: each user message + its AI response
                    const grouped = [];
                    let current = [];
                    for (const msg of allMsgs) {
                        current.push(msg);
                        if (msg.role === 'ai') {
                            grouped.push({
                                title: current.find(m => m.role === 'user')?.text || 'Homework scan',
                                messages: [...current],
                                time: current[0].createdAt,
                            });
                            current = [];
                        }
                    }
                    if (current.length > 0) {
                        grouped.push({
                            title: current.find(m => m.role === 'user')?.text || 'Homework scan',
                            messages: [...current],
                            time: current[0].createdAt,
                        });
                    }
                    setSessions(grouped);
                    setActiveSessionIdx(grouped.length - 1);
                    setMessages(allMsgs);
                }
            } catch (err) {
            }
        };
        loadHistory();
    }, [subject, user]);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    // Handlers
    const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDragOver(false);
    };
    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleSend = async () => {
        if (!image) return;
        const imgUrl = preview;
        const questionText = question.trim();
        const userMsg = { role: 'user', imageUrl: imgUrl, text: questionText || null };
        setMessages(prev => [...prev, userMsg]);
        setPreview(null);
        const fileToUpload = image;
        setImage(null);
        setQuestion('');
        if (fileRef.current) fileRef.current.value = '';
        setSending(true);
        try {
            const data = await apiUpload('/api/scan/homework', fileToUpload, {
                fields: { question: questionText || '', subject_id: subject.id, language: language },
            });
            // Use Supabase URL instead of blob URL for persistence
            const permanentImgUrl = data.image_url || imgUrl;
            const aiMsg = { role: 'ai', text: data.answer };
            // Update user message with permanent URL + add AI response
            setMessages(prev => {
                const updated = [...prev];
                // Replace the last user msg's blob URL with Supabase URL
                const lastUserIdx = updated.length - 1;
                if (updated[lastUserIdx]?.role === 'user') {
                    updated[lastUserIdx] = { ...updated[lastUserIdx], imageUrl: permanentImgUrl };
                }
                updated.push(aiMsg);
                return updated;
            });
            // Update sessions with permanent URL
            const persistedUserMsg = { ...userMsg, imageUrl: permanentImgUrl };
            setSessions(prev => {
                const newSession = {
                    title: questionText || 'Homework scan',
                    messages: [persistedUserMsg, aiMsg],
                    time: new Date().toISOString(),
                };
                const updated = [...prev, newSession];
                setActiveSessionIdx(updated.length - 1);
                return updated;
            });
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: `❌ **Error:** ${err.message}. Please try again.` }]);
        } finally {
            setSending(false);
        }
    };

    const clearPreview = () => {
        setImage(null); setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleClearHistory = async () => {
        if (!confirm('Clear all homework history?')) return;
        try {
            await apiFetch(`/api/scan/history/${subject.id}`, { method: 'DELETE' });
            setMessages([]);
            setSessions([]);
            setActiveSessionIdx(0);
        } catch (err) {
        }
    };

    const handleSessionClick = (idx) => {
        setActiveSessionIdx(idx);
        // Show only messages from selected session
        const session = sessions[idx];
        if (session) setMessages(session.messages);
    };

    const handleNewChat = () => {
        setMessages([]);
        setActiveSessionIdx(-1);
        setImage(null);
        setPreview(null);
        setQuestion('');
    };

    const getInitials = () => {
        if (!user?.email) return 'U';
        return user.email.charAt(0).toUpperCase();
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (!mounted || !subject) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Sidebar Skeleton */}
                <div style={{ width: 280, borderRight: '1px solid var(--border-color)', padding: 16 }}>
                    <div className="skeleton skeleton-text" style={{ height: 18, width: '60%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 42, borderRadius: 10, marginBottom: 16 }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />
                    ))}
                </div>
                {/* Chat Area Skeleton */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-text" style={{ height: 16, width: 100, marginBottom: 4 }} />
                            <div className="skeleton skeleton-text" style={{ height: 10, width: 140, marginBottom: 0 }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="skeleton skeleton-circle" style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: 24 }} />
                            <div className="skeleton skeleton-text" style={{ height: 22, width: 220, margin: '0 auto 8px' }} />
                            <div className="skeleton skeleton-text" style={{ height: 14, width: 300, margin: '0 auto' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <Navbar />

            {/* Drag overlay */}
            {dragOver && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: `${colors[0]}10`,
                    border: `3px dashed ${colors[0]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(6px)',
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        textAlign: 'center', padding: '48px 64px', borderRadius: 24,
                        background: 'var(--bg-primary)', boxShadow: 'var(--shadow-xl)',
                        border: `2px solid ${colors[0]}40`,
                    }}>
                        <ImagePlus size={48} style={{ color: colors[0], marginBottom: 12 }} />
                        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Drop your image here
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            Release to upload your homework
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Left Sidebar: Chat History ─── */}
                <div className={`flex flex-col transition-all duration-300 z-40 ${isMobile && sidebarOpen ? 'absolute inset-y-0 left-0 bg-gray-900 shadow-xl' : ''}`} style={{
                    width: sidebarOpen ? 280 : 0,
                    minWidth: sidebarOpen ? 280 : 0,
                    background: 'var(--bg-secondary)',
                    borderRight: (!isMobile && sidebarOpen) ? '1px solid var(--border-color)' : 'none',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}>
                    {/* Sidebar Header */}

                    {/* New Chat Button */}
                    <div style={{ padding: '12px 12px 4px' }}>
                        <button onClick={handleNewChat} style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            border: `1px dashed ${colors[0]}40`,
                            background: `${colors[0]}06`,
                            color: colors[0],
                            fontSize: '0.8125rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = `${colors[0]}12`}
                            onMouseLeave={e => e.currentTarget.style.background = `${colors[0]}06`}
                        >
                            <Plus size={16} /> New Chat
                        </button>
                    </div>

                    {/* Session List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                        {sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                                <Clock size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                                <p style={{ fontSize: '0.75rem' }}>No chats yet</p>
                            </div>
                        ) : (
                            sessions.map((session, i) => (
                                <button key={i} onClick={() => { handleSessionClick(i); if (isMobile) setSidebarOpen(false); }} style={{
                                    width: '100%', textAlign: 'left', padding: '10px 12px',
                                    borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                                    border: 'none',
                                    background: activeSessionIdx === i ? `${colors[0]}12` : 'transparent',
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => { if (activeSessionIdx !== i) e.currentTarget.style.background = 'var(--bg-primary)'; }}
                                    onMouseLeave={e => { if (activeSessionIdx !== i) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <p style={{
                                        fontSize: '0.8rem', fontWeight: activeSessionIdx === i ? 600 : 400,
                                        color: activeSessionIdx === i ? colors[0] : 'var(--text-primary)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        marginBottom: 2,
                                    }}>
                                        {session.title || 'Homework scan'}
                                    </p>
                                    <p style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                                        {formatTime(session.time)}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Clear History */}
                    {sessions.length > 0 && (
                        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border-color)' }}>
                            <button onClick={handleClearHistory} style={{
                                width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                                background: 'transparent', color: '#ef4444', fontSize: '0.75rem',
                                fontWeight: 500, cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: 6, justifyContent: 'center',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#ef444410'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Trash2 size={13} /> Clear All History
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Main Chat Area ─── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                    {/* Top Header */}
                    <div style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        flexShrink: 0,
                        padding: isMobile ? '8px 12px' : '10px 20px',
                        display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10,
                    }}>
                        {!sidebarOpen && (
                            <button className="btn-ghost" onClick={() => setSidebarOpen(true)}
                                style={{ padding: 6, color: 'var(--text-muted)', marginRight: 2 }}>
                                <BookOpen size={16} />
                            </button>
                        )}
                        <button className="btn-ghost" onClick={() => router.push(`/subjects/${subject.id}`)}
                            style={{ padding: '4px 6px' }}>
                            <ArrowLeft size={16} />
                        </button>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <BookOpen size={14} style={{ color: '#fff' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Homework</h1>
                            <p style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{subject.name}</p>
                        </div>

                        {/* Language Selector */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                                style={{
                                    appearance: 'none', WebkitAppearance: 'none',
                                    padding: '5px 28px 5px 30px',
                                    borderRadius: 20,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.75rem', fontWeight: 600,
                                    cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value="en">English</option>
                                <option value="ta">Tamil</option>
                                <option value="hi">Hindi</option>
                                <option value="kn">Kannada</option>
                                <option value="te">Telugu</option>
                            </select>
                            <Languages size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', pointerEvents: 'none' }} />
                            <ChevronLeft size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 8px' : '24px 20px' }}>
                        <div style={{ maxWidth: 780, margin: '0 auto' }}>
                            {/* Empty State */}
                            {messages.length === 0 && !sending && (
                                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: 24,
                                        background: `linear-gradient(135deg, ${colors[0]}15, ${colors[1]}15)`,
                                        border: `2px solid ${colors[0]}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 24px',
                                    }}>
                                        <ImagePlus size={36} style={{ color: colors[0] }} />
                                    </div>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontSize: '1.375rem' }}>
                                        Upload Your Homework
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
                                        Drag & drop an image anywhere, or use the
                                        <ImagePlus size={14} style={{ verticalAlign: 'middle', margin: '0 4px', color: colors[0] }} />
                                        button below. Ask a question and get step-by-step solutions.
                                    </p>
                                </div>
                            )}

                            {/* Messages */}
                            {messages.map((msg, i) => (
                                <div key={i} className="animate-slide-up"
                                    style={{
                                        marginBottom: isMobile ? 16 : 24, display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'flex-start',
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    }}>

                                    {/* Avatar */}
                                    <div style={{
                                        width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: msg.role === 'user'
                                            ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
                                            : 'linear-gradient(135deg, #10b981, #14b8a6)',
                                        boxShadow: msg.role === 'user'
                                            ? `0 2px 8px ${colors[0]}30`
                                            : '0 2px 8px rgba(16,185,129,0.3)',
                                        marginTop: 2,
                                    }}>
                                        {msg.role === 'user'
                                            ? <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{getInitials()}</span>
                                            : <Bot size={18} style={{ color: '#fff' }} />
                                        }
                                    </div>

                                    {/* Message Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Name */}
                                        <div style={{
                                            fontSize: '0.75rem', fontWeight: 600, marginBottom: 6,
                                            color: msg.role === 'user' ? colors[0] : '#10b981',
                                            textAlign: msg.role === 'user' ? 'right' : 'left',
                                        }}>
                                            {msg.role === 'user' ? 'You' : 'AuraLab AI Tutor'}
                                        </div>

                                        {msg.role === 'user' ? (
                                            /* ── User Message ── */
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                {msg.imageUrl && (
                                                    <div style={{
                                                        borderRadius: 12, overflow: 'hidden',
                                                        border: `2px solid ${colors[0]}`,
                                                        marginBottom: msg.text ? 8 : 0,
                                                        maxWidth: 340,
                                                    }}>
                                                        <img src={msg.imageUrl} alt="Homework" style={{
                                                            width: '100%', display: 'block',
                                                            maxHeight: 280, objectFit: 'contain',
                                                            background: 'var(--bg-secondary)',
                                                        }} />
                                                    </div>
                                                )}
                                                {msg.text && (
                                                    <div style={{
                                                        padding: '10px 14px', borderRadius: 12,
                                                        borderBottomRightRadius: 4,
                                                        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                                                        fontSize: '0.875rem', color: '#fff',
                                                        lineHeight: 1.5, maxWidth: 400,
                                                    }}>
                                                        {msg.text}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* ── AI Response ── */
                                            <div style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 16,
                                                padding: isMobile ? '14px 12px' : '20px 24px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}>
                                                {/* Accent top border */}
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                                    background: 'linear-gradient(90deg, #10b981, #14b8a6, #06b6d4)',
                                                }} />
                                                <div
                                                    className="ai-response-content"
                                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Loading */}
                            {sending && (
                                <div className="animate-fade-in" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                                        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                    }}>
                                        <Bot size={18} style={{ color: '#fff' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginBottom: 6 }}>
                                            AuraLab AI Tutor
                                        </div>
                                        <div style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 16, padding: '16px 20px',
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }}>
                                            <Loader2 size={16} className="spin" style={{ color: '#10b981' }} />
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                Analyzing your homework...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* ── Bottom Input Bar ─── */}
                    <div style={{
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        padding: isMobile ? '8px 8px' : '12px 20px',
                        flexShrink: 0,
                    }}>
                        <div style={{ maxWidth: 780, margin: '0 auto' }}>
                            {/* Image Preview */}
                            {preview && (
                                <div className="animate-slide-up" style={{
                                    marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', background: 'var(--bg-primary)',
                                    borderRadius: 10, border: '1px solid var(--border-color)',
                                }}>
                                    <img src={preview} alt="Preview" style={{
                                        width: 56, height: 40, objectFit: 'cover',
                                        borderRadius: 6, border: '1px solid var(--border-color)',
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>{image?.name}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {(image?.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button className="btn-ghost" onClick={clearPreview}
                                        style={{ padding: 4, color: '#ef4444', flexShrink: 0 }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {/* Input Row: Image + Text + Send */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="file" accept="image/*" ref={fileRef}
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                    style={{ display: 'none' }} />
                                <button onClick={() => !sending && fileRef.current?.click()}
                                    disabled={sending} title="Attach image"
                                    style={{
                                        width: 42, height: 42, borderRadius: 10,
                                        border: preview ? `2px solid ${colors[0]}` : '1px solid var(--border-color)',
                                        background: preview ? `${colors[0]}10` : 'var(--bg-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: sending ? 'not-allowed' : 'pointer',
                                        flexShrink: 0, transition: 'all 0.2s',
                                        opacity: sending ? 0.5 : 1,
                                        color: preview ? colors[0] : 'var(--text-muted)',
                                    }}>
                                    <ImagePlus size={18} />
                                </button>
                                <input ref={inputRef} type="text" value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && image && !sending) handleSend(); }}
                                    placeholder={image ? "Ask about your homework..." : "Attach an image, then ask..."}
                                    disabled={sending}
                                    style={{
                                        flex: 1, padding: '10px 16px', borderRadius: 10,
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        fontSize: '0.875rem', outline: 'none',
                                        transition: 'border-color 0.2s', opacity: sending ? 0.5 : 1,
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = colors[0]}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                />
                                <button className="btn-primary" onClick={handleSend}
                                    disabled={!image || sending}
                                    style={{
                                        width: 42, height: 42, borderRadius: 10,
                                        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                                        opacity: (!image || sending) ? 0.5 : 1,
                                        flexShrink: 0, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', padding: 0,
                                    }}>
                                    {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* AI Response Styles */}
            < style > {`
                .ai-response-content {
                    font-size: 0.9rem;
                    line-height: 1.8;
                    color: var(--text-primary);
                }
                .ai-response-content h1 {
                    font-size: 1.2rem;
                    font-weight: 800;
                    margin: 20px 0 10px;
                    color: var(--text-primary);
                    letter-spacing: -0.01em;
                }
                .ai-response-content h2 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 18px 0 8px;
                    color: var(--text-primary);
                    padding-bottom: 6px;
                    border-bottom: 1px solid var(--border-color);
                }
                .ai-response-content h3 {
                    font-size: 1rem;
                    font-weight: 700;
                    margin: 16px 0 6px;
                    color: #10b981;
                }
                .ai-response-content h4 {
                    font-size: 0.9375rem;
                    font-weight: 600;
                    margin: 14px 0 6px;
                    color: var(--text-primary);
                }
                .ai-response-content p {
                    margin: 8px 0;
                }
                .ai-response-content strong {
                    color: var(--text-primary);
                    font-weight: 700;
                }
                .ai-response-content em {
                    color: var(--text-secondary);
                }
                .ai-response-content code {
                    background: var(--bg-primary);
                    padding: 2px 7px;
                    border-radius: 5px;
                    font-size: 0.8125rem;
                    font-family: 'Fira Code', 'JetBrains Mono', monospace;
                    border: 1px solid var(--border-color);
                }
                .ai-response-content pre {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 16px 18px;
                    overflow-x: auto;
                    margin: 14px 0;
                    position: relative;
                }
                .ai-response-content pre code {
                    background: none;
                    padding: 0;
                    border: none;
                    font-size: 0.8125rem;
                    line-height: 1.6;
                }
                .ai-response-content li {
                    margin-left: 20px;
                    margin-bottom: 6px;
                    padding-left: 4px;
                }
                .ai-response-content ul {
                    margin: 8px 0;
                    padding-left: 24px;
                    list-style-type: disc;
                }
                .ai-response-content ol {
                    margin: 8px 0;
                    padding-left: 24px;
                    list-style-type: decimal;
                }
                .ai-response-content li {
                    margin-bottom: 6px;
                    padding-left: 4px;
                    display: list-item;
                }
                .ai-response-content blockquote {
                    border-left: 3px solid #10b981;
                    padding: 8px 16px;
                    margin: 12px 0;
                    background: rgba(16,185,129,0.05);
                    border-radius: 0 8px 8px 0;
                    font-style: italic;
                    color: var(--text-secondary);
                }
                .ai-response-content hr {
                    border: none;
                    border-top: 1px solid var(--border-color);
                    margin: 16px 0;
                }
                .ai-response-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 12px 0;
                    font-size: 0.8125rem;
                }
                .ai-response-content th, .ai-response-content td {
                    border: 1px solid var(--border-color);
                    padding: 8px 12px;
                    text-align: left;
                }
                .ai-response-content th {
                    background: var(--bg-primary);
                    font-weight: 600;
                }
            `}</style >
        </div >
    );
}

/**
 * Enhanced markdown to HTML renderer.
 */
function renderMarkdown(text) {
    if (!text) return '';

    // Normalize line endings first (\r\n → \n, \r → \n)
    let html = text.replace(/\r\n?/g, '\n')
        // Code blocks (protect from other transforms)
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        // HR
        .replace(/^---+$/gm, '<hr/>')
        // Blockquotes
        .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
        // Lists — match * or - at start of line with space, capture rest
        .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li style="list-style-type:decimal;">$2</li>')
        // Bold/italic (inline only, list markers already consumed)
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<![*\w])\*([^*\n]+?)\*(?![*\w])/g, '<em>$1</em>')
        // Wrap consecutive <li> in <ul>
        .replace(/((?:<li[^>]*>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

    return `<p>${html}</p>`;
}

