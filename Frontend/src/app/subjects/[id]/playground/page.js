'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, PanelLeftClose, PanelRightClose, ChevronRight, BookOpen, Languages, Download, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const LANG_CODE_MAP = {
    'English': 'en', 'Tamil': 'ta', 'Hindi': 'hi', 'Kannada': 'kn', 'Telugu': 'te',
};
const LANG_NAME_MAP = {
    'en': 'English', 'ta': 'Tamil', 'hi': 'Hindi', 'kn': 'Kannada', 'te': 'Telugu',
};

import LeftPanel from '@/components/playground/LeftPanel';
import CenterPanel from '@/components/playground/CenterPanel';
import RightPanel from '@/components/playground/RightPanel';
import { useAuth } from '@/context/AuthContext';
import { useSubject } from '@/context/SubjectContext';
import { apiFetch } from '@/utils/api';

function VideoBg() {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background: '#0a0e1a',
        }}>
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.8,
                }}
            >
                <source src="/bg-video.mp4" type="video/mp4" />
            </video>
        </div>
    );
}

export default function PlaygroundPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { subject, language, setLanguage, loading: subjectLoading } = useSubject();
    const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
    const [activeMode, setActiveMode] = useState('explain');
    const [mounted, setMounted] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const centerPanelRef = useRef(null);

    // Panel widths (percentages)
    const [leftWidth, setLeftWidth] = useState(20);
    const [rightWidth, setRightWidth] = useState(28);
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);

    // Mobile state
    const [isMobile, setIsMobile] = useState(false);
    const [mobilePanel, setMobilePanel] = useState('center');

    const containerRef = useRef(null);
    const isDragging = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (subject && !subjectLoading) {
            // Find first non-passed topic
            const topics = subject.topics || [];
            const firstIncompleteIdx = topics.findIndex(t => !t.passed);
            setCurrentTopicIdx(firstIncompleteIdx === -1 ? Math.max(0, topics.length - 1) : firstIncompleteIdx);
            setMounted(true);
        }
    }, [user, authLoading, subject, subjectLoading, router]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleMouseDown = useCallback((side) => (e) => {
        e.preventDefault();
        isDragging.current = side;
        const handleMouseMove = (e) => {
            if (!containerRef.current || !isDragging.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const totalWidth = rect.width;
            const pct = (x / totalWidth) * 100;
            if (isDragging.current === 'left') setLeftWidth(Math.max(12, Math.min(35, pct)));
            else if (isDragging.current === 'right') setRightWidth(Math.max(15, Math.min(45, 100 - pct)));
        };
        const handleMouseUp = () => {
            isDragging.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const handleQuizPass = useCallback(async (topicIdx) => {
        if (!subject) return;
        const topics = subject.topics || [];
        const topic = topics[topicIdx];
        if (!topic) return;

        try {
            // Mark topic as passed on backend
            await apiFetch(`/api/topics/${topic.id}/pass`, { method: 'POST' });
            // Record streak activity
            await apiFetch('/api/user/streak', { method: 'POST' }).catch(() => { });
            // Update local state
            setSubject(prev => {
                if (!prev) return prev;
                const newTopics = prev.topics.map((t, i) =>
                    i === topicIdx ? { ...t, passed: true, passed_at: new Date().toISOString() } : t
                );
                return { ...prev, topics: newTopics };
            });
        } catch (err) {
            console.error('Failed to mark topic passed:', err);
            // Still update local state as fallback
            setSubject(prev => {
                if (!prev) return prev;
                const newTopics = prev.topics.map((t, i) =>
                    i === topicIdx ? { ...t, passed: true, passed_at: new Date().toISOString() } : t
                );
                return { ...prev, topics: newTopics };
            });
        }

        // Auto-advance to next topic after a short delay
        setTimeout(() => {
            if (topicIdx < topics.length - 1) {
                setCurrentTopicIdx(topicIdx + 1);
                setActiveMode('explain');
            }
        }, 2500);
    }, [subject]);

    const handleSelectTopic = useCallback((idx) => {
        setCurrentTopicIdx(idx);
        setActiveMode('explain');
    }, []);

    // Dynamic page title
    const currentTopic = subject?.topics?.[currentTopicIdx]?.title || 'Getting Started';
    useEffect(() => {
        if (subject?.name) {
            document.title = `${currentTopic} – ${subject.name} – AuraLab`;
        }
        return () => { document.title = 'AuraLab – AI-Powered Learning Assistant'; };
    }, [currentTopic, subject?.name]);

    if (!mounted) return null;

    if (subjectLoading || !subject) {
        return (
            <div style={{ minHeight: '100vh', background: 'transparent' }}>
                <VideoBg />
                <Navbar />
                <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
                    {/* Left Panel Skeleton */}
                    <div style={{ width: 280, borderRight: '1px solid var(--border-color)', padding: 20 }}>
                        <div className="skeleton skeleton-text" style={{ height: 24, width: '70%', marginBottom: 20 }} />
                        <div className="skeleton" style={{ height: 6, borderRadius: 4, marginBottom: 24 }} />
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div className="skeleton skeleton-circle" style={{ width: 28, height: 28, flexShrink: 0 }} />
                                <div className="skeleton skeleton-text" style={{ height: 14, width: `${50 + i * 8}%`, marginBottom: 0 }} />
                            </div>
                        ))}
                    </div>
                    {/* Center Panel Skeleton */}
                    <div style={{ flex: 1, padding: 24 }}>
                        <div className="skeleton skeleton-text" style={{ height: 28, width: '40%', marginBottom: 20 }} />
                        <div className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: 16 }} />
                        <div className="skeleton skeleton-text" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                        <div className="skeleton skeleton-text" style={{ height: 14, width: '75%', marginBottom: 8 }} />
                        <div className="skeleton skeleton-text" style={{ height: 14, width: '60%' }} />
                    </div>
                    {/* Right Panel Skeleton */}
                    <div style={{ width: 340, borderLeft: '1px solid var(--border-color)', padding: 16 }}>
                        <div className="skeleton skeleton-text" style={{ height: 20, width: '50%', marginBottom: 20 }} />
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ marginBottom: 16 }}>
                                <div className="skeleton" style={{ height: 50, borderRadius: 10, marginBottom: 8 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const progress = Math.round(((subject.topics || []).filter(t => t.passed).length / (subject.topics?.length || 1)) * 100);

    // ─── Mobile Layout ─────────────────
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: 'transparent' }}>
                <VideoBg />
                <Navbar />
                {/* Mobile Tab Switcher */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '0 4px',
                }}>
                    {[
                        { key: 'left', label: '📖 Syllabus' },
                        { key: 'center', label: '🎓 Learn' },
                        { key: 'right', label: '💬 Chat' },
                    ].map(p => (
                        <button key={p.key} onClick={() => setMobilePanel(p.key)}
                            style={{
                                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                                fontSize: '0.8125rem', fontWeight: 600,
                                background: 'transparent',
                                color: mobilePanel === p.key ? 'var(--accent)' : 'var(--text-muted)',
                                borderBottom: mobilePanel === p.key ? '2px solid var(--accent)' : '2px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >{p.label}</button>
                    ))}
                </div>
                <div style={{ height: 'calc(100vh - 64px - 48px)' }}>
                    {mobilePanel === 'left' && <LeftPanel subject={subject} currentTopicIdx={currentTopicIdx} onSelectTopic={handleSelectTopic} />}
                    {mobilePanel === 'center' && <CenterPanel ref={centerPanelRef} subject={subject} currentTopicIdx={currentTopicIdx} activeMode={activeMode} setActiveMode={setActiveMode} onQuizPass={handleQuizPass} language={language} languageName={LANG_NAME_MAP[language] || 'English'} onPdfLoadingChange={setPdfLoading} />}
                    {mobilePanel === 'right' && <RightPanel subject={subject} currentTopic={currentTopic} activeMode={activeMode} language={language} languageName={LANG_NAME_MAP[language] || 'English'} />}
                </div>
            </div>
        );
    }

    // ─── Desktop Layout ─────────────────
    const effectiveLeft = leftCollapsed ? 0 : leftWidth;
    const effectiveRight = rightCollapsed ? 0 : rightWidth;

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <VideoBg />
            <Navbar />

            {/* Topic Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 16px',
                height: 52,
                background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
            }}>
                {/* Back */}
                <button className="btn-ghost" onClick={() => router.push(`/subjects/${subject.id}`)}
                    style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                    <ArrowLeft size={16} />
                </button>

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <BookOpen size={11} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{
                        fontSize: '0.8125rem', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 120,
                    }}>{subject.name}</span>
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.4 }} />
                    <span style={{
                        fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{currentTopic}</span>
                </div>

                {/* Right side controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

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
                        <ChevronRight size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>

                    {/* PDF Download */}
                    <button
                        onClick={() => centerPanelRef.current?.handleDownloadPDF?.()}
                        disabled={pdfLoading}
                        title="Download topic content as PDF"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 20,
                            fontSize: '0.75rem', fontWeight: 600,
                            border: '1px solid var(--border-color)',
                            cursor: pdfLoading ? 'not-allowed' : 'pointer',
                            background: pdfLoading ? 'var(--bg-secondary)' : 'rgba(99,102,241,0.06)',
                            color: pdfLoading ? 'var(--text-muted)' : 'var(--accent)',
                            transition: 'all 0.2s', flexShrink: 0,
                        }}
                    >
                        {pdfLoading ? (
                            <div style={{ width: 13, height: 13, border: '2px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                            <Download size={13} />
                        )}
                        PDF
                    </button>

                    {/* Divider */}
                    <div style={{ width: 1, height: 22, background: 'var(--border-color)' }} />

                    {/* Progress pill */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 12px 5px 10px',
                        borderRadius: 20,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                    }}>
                        <div style={{ width: 64, height: 5, borderRadius: 4, background: 'rgba(99,102,241,0.12)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 4,
                                background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
                                width: `${progress}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                            }} />
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)', minWidth: 28, textAlign: 'right' }}>{progress}%</span>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, height: 22, background: 'var(--border-color)' }} />

                    {/* Panel toggles */}
                    <button className="btn-ghost" onClick={() => setLeftCollapsed(!leftCollapsed)}
                        style={{ padding: '6px 7px', color: leftCollapsed ? 'var(--text-muted)' : 'var(--accent)' }}
                        title={leftCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}>
                        <PanelLeftClose size={15} />
                    </button>
                    <button className="btn-ghost" onClick={() => setRightCollapsed(!rightCollapsed)}
                        style={{ padding: '6px 7px', color: rightCollapsed ? 'var(--text-muted)' : 'var(--accent)' }}
                        title={rightCollapsed ? 'Show Chat' : 'Hide Chat'}>
                        <PanelRightClose size={15} />
                    </button>
                </div>
            </div>

            {/* 3-Pane Layout */}
            <div ref={containerRef} style={{
                display: 'flex', height: 'calc(100vh - 64px - 52px)', overflow: 'hidden',
            }}>
                {/* Left */}
                {!leftCollapsed && (
                    <>
                        <div style={{
                            width: `${effectiveLeft}%`, flexShrink: 0,
                            overflow: 'hidden', borderRight: '1px solid var(--border-color)',
                        }}>
                            <LeftPanel subject={subject} currentTopicIdx={currentTopicIdx} onSelectTopic={handleSelectTopic} />
                        </div>
                        <div className="resize-handle" onMouseDown={handleMouseDown('left')} />
                    </>
                )}

                {/* Center */}
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <CenterPanel ref={centerPanelRef} subject={subject} currentTopicIdx={currentTopicIdx}
                        activeMode={activeMode} setActiveMode={setActiveMode} onQuizPass={handleQuizPass}
                        language={language} languageName={LANG_NAME_MAP[language] || 'English'} onPdfLoadingChange={setPdfLoading} />
                </div>

                {/* Right */}
                {!rightCollapsed && (
                    <>
                        <div className="resize-handle" onMouseDown={handleMouseDown('right')} />
                        <div style={{
                            width: `${effectiveRight}%`, flexShrink: 0,
                            overflow: 'hidden', borderLeft: '1px solid var(--border-color)',
                        }}>
                            <RightPanel subject={subject} currentTopic={currentTopic} activeMode={activeMode} language={language} languageName={LANG_NAME_MAP[language] || 'English'} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
