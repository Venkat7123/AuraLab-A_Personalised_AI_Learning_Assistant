'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronRight, FileText, Image as ImageIcon, BookOpen, ExternalLink } from 'lucide-react';
import { apiFetch } from '@/utils/api';

export default function LeftPanel({ subject, currentTopicIdx, onSelectTopic }) {
    const [syllabusOpen, setSyllabusOpen] = useState(true);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [scanImages, setScanImages] = useState([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [lightboxImg, setLightboxImg] = useState(null);

    const topics = subject?.topics || [];
    const progress = useMemo(() => {
        if (!topics.length) return 0;
        const passed = topics.filter(t => t.passed).length;
        return Math.round((passed / topics.length) * 100);
    }, [topics]);

    const completedCount = useMemo(
        () => topics.filter(t => t.passed).length,
        [topics]
    );

    // Fetch library items when opened
    useEffect(() => {
        if (!libraryOpen || !subject?.id) return;
        const fetchLibrary = async () => {
            setLibraryLoading(true);
            try {
                const [scanData, imgData] = await Promise.all([
                    apiFetch(`/api/scan/history/${subject.id}`).catch(() => []),
                    apiFetch(`/api/images/${subject.id}`).catch(() => []),
                ]);
                setScanImages((scanData || []).filter(item => item.image_url));
                setGeneratedImages(imgData || []);
            } catch (err) {
                console.error('Failed to fetch library:', err);
            } finally {
                setLibraryLoading(false);
            }
        };
        fetchLibrary();
    }, [libraryOpen, subject?.id]);

    return (
        <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
            {/* Lightbox Overlay */}
            {lightboxImg && createPortal(
                <div onClick={() => setLightboxImg(null)} style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.85)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                }}>
                    <img src={lightboxImg} alt="" style={{
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
            {/* Subject Header with Progress */}
            <div style={{
                padding: '20px 18px 16px', borderBottom: '1px solid var(--border-color)',
                background: 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'rgba(99,102,241,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <h2 style={{
                        fontSize: '0.875rem', fontWeight: 700,
                        color: 'var(--text-primary)', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{subject?.name || 'Subject'}</h2>
                </div>

                {/* Mini Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 4,
                            background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
                            width: `${progress}%`, transition: 'width 0.6s ease',
                        }} />
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {completedCount}/{topics.length}
                    </span>
                </div>
            </div>

            {/* Syllabus */}
            <div style={{ flex: 1 }}>
                <button
                    onClick={() => setSyllabusOpen(!syllabusOpen)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '14px 18px', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 700,
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}
                >
                    {syllabusOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Topics
                    <span style={{
                        marginLeft: 'auto', fontSize: '0.625rem',
                        background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 10,
                    }}>{topics.length}</span>
                </button>

                {syllabusOpen && (
                    <div style={{ padding: '0 10px 16px' }}>
                        {topics.map((topic, idx) => {
                            const passed = topic.passed;
                            const isCurrent = idx === currentTopicIdx;
                            // A topic is locked if it's not the first AND the previous topic hasn't been passed
                            const isLocked = idx > 0 && !topics[idx - 1]?.passed && !passed;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !isLocked && onSelectTopic(idx)}
                                    disabled={isLocked}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                        padding: '10px 12px', textAlign: 'left',
                                        background: isCurrent ? 'rgba(99,102,241,0.08)' : 'transparent',
                                        border: isCurrent ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: isLocked ? 0.4 : 1,
                                        marginBottom: 2,
                                    }}
                                >
                                    {passed ? (
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: 'rgba(16,185,129,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                                        </div>
                                    ) : isLocked ? (
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: 'var(--bg-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Lock size={11} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: isCurrent ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{
                                                fontSize: '0.625rem', fontWeight: 700,
                                                color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                                            }}>{idx + 1}</span>
                                        </div>
                                    )}
                                    <span style={{
                                        fontSize: '0.8125rem',
                                        fontWeight: isCurrent ? 600 : 400,
                                        color: isCurrent ? 'var(--accent)' : passed ? '#10b981' : 'var(--text-primary)',
                                        lineHeight: 1.3,
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>{topic.title}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Library */}
                <button
                    onClick={() => setLibraryOpen(!libraryOpen)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '14px 18px', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 700,
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                        borderTop: '1px solid var(--border-color)',
                    }}
                >
                    {libraryOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Library
                    {(scanImages.length + generatedImages.length) > 0 && (
                        <span style={{
                            marginLeft: 'auto', fontSize: '0.625rem',
                            background: 'rgba(99,102,241,0.1)', color: 'var(--accent)',
                            padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                        }}>{scanImages.length + generatedImages.length}</span>
                    )}
                </button>

                {libraryOpen && (
                    <div style={{ padding: '4px 18px 16px' }}>
                        {libraryLoading ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '16px 0' }}>
                                Loading...
                            </p>
                        ) : (scanImages.length === 0 && generatedImages.length === 0) ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '16px 0' }}>
                                No files yet. Use infographic mode in chat to generate images!
                            </p>
                        ) : (
                            <>
                                {/* Generated Infographics */}
                                {generatedImages.length > 0 && (
                                    <>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 6px',
                                            color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            🎨 Infographics
                                            <span style={{ marginLeft: 'auto', fontSize: '0.625rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: 10 }}>
                                                {generatedImages.length}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
                                            {generatedImages.map((item, i) => (
                                                <div key={item.id || i} onClick={() => setLightboxImg(item.image_url)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                                                        background: 'rgba(245,158,11,0.05)',
                                                        border: '1px solid rgba(245,158,11,0.1)',
                                                        color: 'var(--text-primary)', cursor: 'pointer',
                                                        fontSize: '0.75rem', transition: 'background 0.15s',
                                                    }}
                                                >
                                                    <img src={item.image_url} alt="" style={{
                                                        width: 28, height: 28, borderRadius: 4, objectFit: 'cover',
                                                        border: '1px solid var(--border-color)',
                                                    }} />
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.prompt?.substring(0, 30) || `Image ${i + 1}`}
                                                    </span>
                                                    <ImageIcon size={10} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Scan Images */}
                                {scanImages.length > 0 && (
                                    <>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 6px',
                                            color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            <ImageIcon size={12} /> Scanned Images
                                            <span style={{ marginLeft: 'auto', fontSize: '0.625rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 10 }}>
                                                {scanImages.length}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                                            {scanImages.map((item, i) => (
                                                <div key={item.id || i} onClick={() => setLightboxImg(item.image_url)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                                                        background: 'var(--bg-secondary)',
                                                        color: 'var(--text-primary)', cursor: 'pointer',
                                                        fontSize: '0.75rem', transition: 'background 0.15s',
                                                    }}
                                                >
                                                    <img src={item.image_url} alt="" style={{
                                                        width: 28, height: 28, borderRadius: 4, objectFit: 'cover',
                                                        border: '1px solid var(--border-color)',
                                                    }} />
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.text?.substring(0, 30) || `Scan ${i + 1}`}
                                                    </span>
                                                    <ImageIcon size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
