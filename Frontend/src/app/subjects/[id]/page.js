'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Play, BookOpen, Clock, CheckCircle2, Circle, Lock,
    BarChart3, Flame, Calendar, Target, Sparkles, Trophy, Trash2,
    Settings, Download, Loader2, Award, X, ChevronRight, RotateCcw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import { generateTopicPdf } from '@/utils/generatePdf';

export default function SubjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [subject, setSubject] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(null); // null or topic ID

    // Exam Prep state
    const [examOpen, setExamOpen] = useState(false);
    const [examLoading, setExamLoading] = useState(false);
    const [examQuestions, setExamQuestions] = useState([]);
    const [examIdx, setExamIdx] = useState(0);
    const [examSelected, setExamSelected] = useState(null);
    const [examAnswered, setExamAnswered] = useState(false);
    const [examResults, setExamResults] = useState([]); // { selected, correct, isCorrect }
    const [examFinished, setExamFinished] = useState(false);



    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const id = params?.id;
        if (!id || !user) return;

        const fetchSubject = async () => {
            try {
                const data = await apiFetch(`/api/subjects/${id}`);
                setSubject(data);
                setMounted(true);
            } catch (error) {
                console.error('Failed to fetch subject:', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [params?.id, user, authLoading, router]);

    const topics = subject?.topics || [];

    const progress = useMemo(() => {
        if (!topics.length) return 0;
        const passed = topics.filter(t => t.passed).length;
        return Math.round((passed / topics.length) * 100);
    }, [topics]);

    const currentIdx = useMemo(() => {
        if (!topics.length) return 0;
        const idx = topics.findIndex(t => !t.passed);
        return idx === -1 ? topics.length - 1 : idx;
    }, [topics]);

    const completedCount = useMemo(
        () => topics.filter(t => t.passed).length,
        [topics]
    );
    const allTopicsComplete = topics.length > 0 && completedCount === topics.length;
    const remainingCount = topics.length - completedCount;

    // Calculate days left based on created_at + duration
    const daysLeft = useMemo(() => {
        if (!subject?.created_at || !subject?.duration) return null;
        const createdAtTime = new Date(subject.created_at).getTime();
        const endDate = new Date(createdAtTime + subject.duration * 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diff = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
        return diff;
    }, [subject]);



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

    // Page title
    useEffect(() => {
        if (subject?.name) document.title = `${subject.name} – AuraLab`;
        return () => { document.title = 'AuraLab – AI-Powered Learning Assistant'; };
    }, [subject?.name]);

    // PDF Download for any topic (browser print – supports all languages)
    const handleDownloadPDF = useCallback(async (topic) => {
        if (pdfLoading) return;
        if (!topic) return;
        setPdfLoading(topic.id);
        try {
            await generateTopicPdf({
                topicId: topic.id,
                topicTitle: topic.title,
                subjectName: subject?.name || 'Subject',
                langName: subject?.language || 'English',
            });
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setPdfLoading(null);
        }
    }, [pdfLoading, subject]);

    // Exam Prep handlers
    const startExam = useCallback(async () => {
        if (!allTopicsComplete || examLoading) return;
        setExamLoading(true);
        setExamOpen(true);
        setExamIdx(0);
        setExamSelected(null);
        setExamAnswered(false);
        setExamResults([]);
        setExamFinished(false);
        try {
            const langName = subject?.language || 'English';
            const data = await apiFetch(`/api/content/exam/${subject.id}?lang=${langName}`);
            setExamQuestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Exam prep failed:', err);
            setExamQuestions([]);
        } finally {
            setExamLoading(false);
        }
    }, [allTopicsComplete, examLoading, subject]);

    const handleExamAnswer = () => {
        if (examSelected === null || examAnswered) return;
        const q = examQuestions[examIdx];
        setExamAnswered(true);
        setExamResults(prev => [...prev, {
            selected: examSelected,
            correct: q.correct_index,
            isCorrect: examSelected === q.correct_index,
        }]);
    };

    const handleExamNext = () => {
        if (examIdx + 1 >= examQuestions.length) {
            setExamFinished(true);
        } else {
            setExamIdx(prev => prev + 1);
            setExamSelected(null);
            setExamAnswered(false);
        }
    };

    const examScore = examResults.filter(r => r.isCorrect).length;
    const examTotal = examQuestions.length;
    const examPassed = examTotal > 0 && (examScore / examTotal) >= 0.6;

    if (!mounted) return null;

    if (loading || !subject) {
        return (
            <div style={{ minHeight: '100vh', background: 'transparent' }}>
                <Navbar />
                <main style={{ maxWidth: 880, margin: '0 auto', padding: '24px 24px 80px' }}>
                    {/* Back button skeleton */}
                    <div className="skeleton" style={{ height: 36, width: 180, borderRadius: 8, marginBottom: 24 }} />

                    {/* Hero Skeleton */}
                    <div className="skeleton skeleton-card" style={{ padding: '40px 36px', marginBottom: 28 }}>
                        <div className="skeleton skeleton-text" style={{ height: 22, width: 100, marginBottom: 16, borderRadius: 20 }} />
                        <div className="skeleton skeleton-text" style={{ height: 32, width: '60%', marginBottom: 12 }} />
                        <div className="skeleton skeleton-text" style={{ height: 14, width: '45%', marginBottom: 28 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                            <div className="skeleton skeleton-circle" style={{ width: 72, height: 72, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton skeleton-text" style={{ height: 14, width: '50%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 8, borderRadius: 6 }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div className="skeleton" style={{ height: 48, width: 180, borderRadius: 10 }} />
                            <div className="skeleton" style={{ height: 48, width: 140, borderRadius: 10 }} />
                        </div>
                    </div>

                    {/* Stats Skeleton */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton skeleton-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div className="skeleton skeleton-circle" style={{ width: 42, height: 42, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text" style={{ height: 12, width: '60%', marginBottom: 6 }} />
                                    <div className="skeleton skeleton-text" style={{ height: 18, width: '45%', marginBottom: 0 }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Topics Skeleton */}
                    <div className="skeleton skeleton-card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <div className="skeleton skeleton-text" style={{ height: 20, width: 100 }} />
                            <div className="skeleton skeleton-text" style={{ height: 20, width: 70, borderRadius: 20 }} />
                        </div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none' }}>
                                <div className="skeleton skeleton-circle" style={{ width: 32, height: 32, flexShrink: 0 }} />
                                <div className="skeleton skeleton-text" style={{ height: 14, width: `${55 + i * 5}%`, marginBottom: 0 }} />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <Navbar />

            <main style={{ maxWidth: 880, margin: '0 auto', padding: '24px 24px 80px' }}>
                {/* Back Button */}
                <button
                    className="btn-ghost"
                    onClick={() => router.push('/dashboard')}
                    style={{ marginBottom: 24, padding: '8px 12px' }}
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                {/* Hero Header */}
                <div className="animate-fade-in" style={{
                    background: `linear-gradient(135deg, ${colors[0]}18, ${colors[1]}10)`,
                    borderRadius: 'var(--radius-xl)',
                    border: `1px solid ${colors[0]}25`,
                    padding: '40px 36px',
                    marginBottom: 28,
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Background decoration */}
                    <div style={{
                        position: 'absolute',
                        top: -60,
                        right: -40,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors[0]}12 0%, transparent 70%)`,
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -30,
                        left: -20,
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors[1]}10 0%, transparent 70%)`,
                    }} />

                    {/* Settings + Delete */}
                    <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8, zIndex: 20 }}>
                        <button
                            onClick={() => router.push(`/subjects/${subject.id}/settings`)}
                            title="Project Settings"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12,
                                width: 36, height: 36,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.color = 'var(--accent)';
                                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }}
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm('Are you certain you want to delete this subject? This cannot be undone.')) {
                                    try {
                                        await apiFetch(`/api/subjects/${subject.id}`, { method: 'DELETE' });
                                        router.push('/dashboard');
                                    } catch (e) {
                                        console.error(e);
                                        alert('Failed to delete subject');
                                    }
                                }
                            }}
                            title="Delete Subject"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12,
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#ef4444';
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.background = '#ef444410';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Level Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 14px',
                            borderRadius: 20,
                            background: `${colors[0]}18`,
                            border: `1px solid ${colors[0]}30`,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: colors[0],
                            marginBottom: 16,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}>
                            <Target size={12} />
                            {subject.level || 'Beginner'}
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: 8,
                            lineHeight: 1.2,
                        }}>{subject.name}</h1>

                        {subject.need && (
                            <p style={{
                                fontSize: '0.9375rem',
                                color: 'var(--text-secondary)',
                                marginBottom: 20,
                                maxWidth: 560,
                                lineHeight: 1.5,
                            }}>{subject.need}</p>
                        )}

                        {/* Progress Ring + Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 20,
                            marginBottom: 24,
                        }}>
                            {/* Circular Progress */}
                            <div style={{ position: 'relative', width: 72, height: 72 }}>
                                <svg width={72} height={72} viewBox="0 0 72 72">
                                    <circle cx={36} cy={36} r={30} fill="none" stroke="var(--border-color)" strokeWidth={5} />
                                    <circle
                                        cx={36} cy={36} r={30}
                                        fill="none"
                                        stroke={colors[0]}
                                        strokeWidth={5}
                                        strokeLinecap="round"
                                        strokeDasharray={`${(progress / 100) * 188.5} 188.5`}
                                        transform="rotate(-90 36 36)"
                                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                    />
                                </svg>
                                <span style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    color: colors[0],
                                }}>{progress}%</span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '0.8125rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: 4,
                                }}>
                                    {completedCount} of {topics.length} topics completed
                                </div>
                                <div className="progress-bar" style={{ height: 8, borderRadius: 6 }}>
                                    <div className="progress-fill" style={{
                                        width: `${progress}%`,
                                        background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
                                        borderRadius: 6,
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button
                                className="btn-primary"
                                onClick={() => router.push(`/subjects/${subject.id}/playground`)}
                                style={{
                                    padding: '14px 36px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <Play size={20} />
                                {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                            </button>
                            <button
                                onClick={() => router.push(`/subjects/${subject.id}/homework`)}
                                style={{
                                    padding: '14px 28px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${colors[0]}35`,
                                    background: `${colors[0]}08`,
                                    color: colors[0],
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = `${colors[0]}15`;
                                    e.currentTarget.style.borderColor = `${colors[0]}50`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = `${colors[0]}08`;
                                    e.currentTarget.style.borderColor = `${colors[0]}35`;
                                }}
                            >
                                <BookOpen size={20} />
                                Homework
                            </button>
                            <button
                                onClick={startExam}
                                disabled={!allTopicsComplete || examLoading}
                                title={allTopicsComplete ? 'Take the final exam' : 'Complete all topics to unlock Exam Prep'}
                                style={{
                                    padding: '14px 28px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-md)',
                                    border: allTopicsComplete ? 'none' : `2px solid var(--border-color)`,
                                    background: allTopicsComplete
                                        ? `linear-gradient(135deg, #f59e0b, #f97316)`
                                        : 'var(--bg-secondary)',
                                    color: allTopicsComplete ? '#fff' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    cursor: allTopicsComplete ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                    opacity: allTopicsComplete ? 1 : 0.6,
                                    boxShadow: allTopicsComplete ? '0 4px 20px rgba(245,158,11,0.3)' : 'none',
                                }}
                            >
                                {examLoading ? <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Award size={20} />}
                                {allTopicsComplete ? 'Exam Prep' : <><Lock size={14} /> Exam Prep</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="animate-slide-up" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 16,
                    marginBottom: 28,
                }}>
                    {[
                        {
                            icon: CheckCircle2, color: '#10b981',
                            label: 'Completed',
                            value: `${completedCount} topics`,
                        },
                        {
                            icon: BookOpen, color: '#6366f1',
                            label: 'Remaining',
                            value: `${remainingCount} topics`,
                        },
                        {
                            icon: Clock, color: '#f59e0b',
                            label: 'Duration',
                            value: `${subject.duration || 4} weeks`,
                        },
                        {
                            icon: Calendar, color: '#ec4899',
                            label: 'Days Left',
                            value: daysLeft !== null ? `${daysLeft} days` : '—',
                        },
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                        }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: `${stat.color}12`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <stat.icon size={20} style={{ color: stat.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                                    {stat.label}
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {stat.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Topics Breakdown */}
                <div className="card animate-slide-up" style={{ padding: '28px', overflow: 'visible' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 24,
                    }}>
                        <h2 className="text-lg md:text-[1.125rem]" style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <Sparkles size={20} style={{ color: colors[0] }} />
                            Syllabus
                        </h2>
                        <span className="text-[10px] md:text-xs" style={{
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-secondary)',
                            padding: '4px 12px',
                            borderRadius: 20,
                        }}>
                            {topics.length} topics
                        </span>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                        {topics.map((topic, idx) => {
                            const passed = topic.passed;
                            const isCurrent = idx === currentIdx;
                            const isLocked = idx > currentIdx && !passed;

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '14px 18px',
                                        borderRadius: 'var(--radius-md)',
                                        background: isCurrent
                                            ? `${colors[0]}08`
                                            : passed
                                                ? 'rgba(16,185,129,0.04)'
                                                : 'transparent',
                                        border: isCurrent
                                            ? `1px solid ${colors[0]}25`
                                            : '1px solid transparent',
                                        opacity: isLocked ? 0.45 : 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {/* Status Icon */}
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: passed
                                            ? 'rgba(16,185,129,0.12)'
                                            : isCurrent
                                                ? `${colors[0]}15`
                                                : 'var(--bg-secondary)',
                                        flexShrink: 0,
                                    }}>
                                        {passed ? (
                                            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                                        ) : isLocked ? (
                                            <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                                        ) : (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: isCurrent ? colors[0] : 'var(--text-muted)',
                                            }}>{idx + 1}</span>
                                        )}
                                    </div>

                                    {/* Topic Title */}
                                    <div style={{ flex: 1 }}>
                                        <span style={{
                                            fontSize: '0.9375rem',
                                            fontWeight: isCurrent ? 600 : 400,
                                            color: passed
                                                ? '#10b981'
                                                : isCurrent
                                                    ? colors[0]
                                                    : 'var(--text-primary)',
                                        }}>{topic.title}</span>
                                    </div>

                                    {/* PDF Download Button (for passed or current topics) */}
                                    {(passed || isCurrent) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownloadPDF(topic); }}
                                            disabled={!!pdfLoading}
                                            title={`Download ${topic.title} as PDF`}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: 30, height: 30, borderRadius: 8,
                                                border: '1px solid var(--border-color)',
                                                background: pdfLoading === topic.id ? 'var(--bg-secondary)' : 'transparent',
                                                color: pdfLoading === topic.id ? 'var(--text-muted)' : 'var(--text-secondary)',
                                                cursor: pdfLoading ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s', flexShrink: 0, padding: 0,
                                            }}
                                        >
                                            {pdfLoading === topic.id
                                                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                                : <Download size={14} />}
                                        </button>
                                    )}

                                    {/* Status Badge */}
                                    {passed && (
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            color: '#10b981',
                                            background: 'rgba(16,185,129,0.08)',
                                            padding: '3px 10px',
                                            borderRadius: 12,
                                        }}>Completed</span>
                                    )}
                                    {isCurrent && !passed && (
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            color: colors[0],
                                            background: `${colors[0]}10`,
                                            padding: '3px 10px',
                                            borderRadius: 12,
                                        }}>Current</span>
                                    )}
                                    {isLocked && (
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            color: 'var(--text-muted)',
                                        }}>Locked</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Completion Banner */}
                {progress === 100 && (
                    <div className="animate-fade-in" style={{
                        textAlign: 'center',
                        padding: '32px',
                        marginTop: 28,
                        borderRadius: 'var(--radius-xl)',
                        background: `linear-gradient(135deg, ${colors[0]}10, ${colors[1]}10)`,
                        border: `1px solid ${colors[0]}25`,
                    }}>
                        <Trophy size={40} style={{ color: '#f59e0b', margin: '0 auto 12px' }} />
                        <h3 style={{
                            fontSize: '1.25rem', fontWeight: 700, marginBottom: 4,
                            color: 'var(--text-primary)',
                        }}>Subject Complete! 🎉</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            You&apos;ve mastered all {topics.length} topics. Great job!
                        </p>
                    </div>
                )}
            </main>

            {/* ── Exam Prep Overlay ── */}
            {examOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'var(--bg-primary)',
                    overflowY: 'auto',
                }}>
                    {/* Top Bar */}
                    <div style={{
                        position: 'sticky', top: 0, zIndex: 10,
                        background: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-color)',
                        padding: '16px 24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Award size={22} style={{ color: '#f59e0b' }} />
                            <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                                Exam Prep — {subject.name}
                            </span>
                        </div>
                        <button
                            onClick={() => setExamOpen(false)}
                            style={{
                                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                borderRadius: 8, width: 36, height: 36, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

                        {/* Loading State */}
                        {examLoading && (
                            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                                <Loader2 size={40} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                                    Generating Exam...
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Creating {topics.length}-topic comprehensive MCQs with explanations
                                </p>
                            </div>
                        )}

                        {/* No Questions */}
                        {!examLoading && examQuestions.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Failed to load exam questions. Please try again.</p>
                                <button onClick={startExam} style={{
                                    marginTop: 16, padding: '10px 24px', borderRadius: 8,
                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff',
                                    fontWeight: 600, border: 'none', cursor: 'pointer',
                                }}>Retry</button>
                            </div>
                        )}

                        {/* Exam Finished — Results */}
                        {!examLoading && examFinished && examQuestions.length > 0 && (
                            <div>
                                {/* Score Card */}
                                <div style={{
                                    textAlign: 'center', padding: '40px 32px',
                                    borderRadius: 16, marginBottom: 32,
                                    background: examPassed
                                        ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))'
                                        : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
                                    border: `1px solid ${examPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>{examPassed ? '🎉' : '📚'}</div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                                        {examPassed ? 'Congratulations! You Passed!' : 'Keep Studying!'}
                                    </h2>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                                        {examPassed
                                            ? `You scored ${examScore}/${examTotal} — great mastery of ${subject.name}!`
                                            : `You scored ${examScore}/${examTotal}. Review the explanations below and try again.`}
                                    </p>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        background: 'var(--bg-primary)', padding: '10px 24px', borderRadius: 12,
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <span style={{ fontSize: '2rem', fontWeight: 800, color: examPassed ? '#10b981' : '#ef4444' }}>
                                            {Math.round((examScore / examTotal) * 100)}%
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Score</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
                                    <button onClick={startExam} style={{
                                        padding: '12px 24px', borderRadius: 10,
                                        background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff',
                                        fontWeight: 700, border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}><RotateCcw size={16} /> Retake Exam</button>
                                    <button onClick={() => setExamOpen(false)} style={{
                                        padding: '12px 24px', borderRadius: 10,
                                        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                        fontWeight: 600, border: '1px solid var(--border-color)', cursor: 'pointer',
                                    }}>Close</button>
                                </div>

                                {/* Review all questions */}
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                                    Review Answers
                                </h3>
                                {examQuestions.map((q, qi) => {
                                    const r = examResults[qi];
                                    return (
                                        <div key={qi} style={{
                                            marginBottom: 20, padding: '20px',
                                            borderRadius: 12,
                                            border: `1px solid ${r?.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                            background: r?.isCorrect ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                                        }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                                                <span style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: r?.isCorrect ? '#10b981' : '#ef4444',
                                                    color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>{qi + 1}</span>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>{q.question}</span>
                                            </div>
                                            {q.topic && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 32 }}>Topic: {q.topic}</div>
                                            )}
                                            <div style={{ display: 'grid', gap: 6, paddingLeft: 32 }}>
                                                {q.options.map((opt, oi) => {
                                                    const isCorrect = oi === q.correct_index;
                                                    const isUserPick = oi === r?.selected;
                                                    return (
                                                        <div key={oi} style={{
                                                            padding: '8px 12px', borderRadius: 8, fontSize: '0.875rem',
                                                            border: `1px solid ${isCorrect ? '#10b981' : isUserPick ? '#ef4444' : 'var(--border-color)'}`,
                                                            background: isCorrect ? 'rgba(16,185,129,0.08)' : isUserPick ? 'rgba(239,68,68,0.08)' : 'transparent',
                                                            color: isCorrect ? '#10b981' : isUserPick ? '#ef4444' : 'var(--text-secondary)',
                                                            fontWeight: isCorrect || isUserPick ? 600 : 400,
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                        }}>
                                                            {isCorrect ? <CheckCircle2 size={14} /> : isUserPick ? <X size={14} /> : <Circle size={12} />}
                                                            {opt}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {q.explanation && (
                                                <div style={{
                                                    marginTop: 10, paddingLeft: 32, fontSize: '0.8125rem',
                                                    color: 'var(--text-secondary)', lineHeight: 1.6,
                                                    borderLeft: '3px solid #f59e0b40', paddingLeft: 14,
                                                    marginLeft: 32, fontStyle: 'italic',
                                                }}>
                                                    💡 {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Active Question */}
                        {!examLoading && !examFinished && examQuestions.length > 0 && (() => {
                            const q = examQuestions[examIdx];
                            const progressPct = ((examIdx + 1) / examTotal) * 100;
                            return (
                                <div>
                                    {/* Progress */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                Question {examIdx + 1} of {examTotal}
                                            </span>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f59e0b' }}>
                                                {Math.round(progressPct)}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 6, borderRadius: 3,
                                            background: 'var(--bg-secondary)',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 3,
                                                background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                                                width: `${progressPct}%`,
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>

                                    {/* Topic Tag */}
                                    {q.topic && (
                                        <div style={{
                                            display: 'inline-block', fontSize: '0.75rem', fontWeight: 600,
                                            color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                                            padding: '3px 10px', borderRadius: 8, marginBottom: 14,
                                        }}>{q.topic}</div>
                                    )}

                                    {/* Question */}
                                    <h2 style={{
                                        fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.6,
                                        color: 'var(--text-primary)', marginBottom: 20,
                                    }}>{q.question}</h2>

                                    {/* Options */}
                                    <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                                        {q.options.map((opt, oi) => {
                                            const isSelected = examSelected === oi;
                                            const isCorrect = oi === q.correct_index;
                                            let bg = 'var(--bg-primary)';
                                            let border = isSelected ? `${colors[0]}` : 'var(--border-color)';
                                            let color = 'var(--text-primary)';

                                            if (examAnswered) {
                                                if (isCorrect) {
                                                    bg = 'rgba(16,185,129,0.08)';
                                                    border = '#10b981';
                                                    color = '#10b981';
                                                } else if (isSelected) {
                                                    bg = 'rgba(239,68,68,0.08)';
                                                    border = '#ef4444';
                                                    color = '#ef4444';
                                                }
                                            }

                                            return (
                                                <button
                                                    key={oi}
                                                    onClick={() => !examAnswered && setExamSelected(oi)}
                                                    disabled={examAnswered}
                                                    style={{
                                                        padding: '14px 16px', borderRadius: 10,
                                                        border: `2px solid ${border}`,
                                                        background: bg, color,
                                                        textAlign: 'left', cursor: examAnswered ? 'default' : 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        fontSize: '0.9375rem', fontWeight: isSelected || (examAnswered && isCorrect) ? 600 : 400,
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    <span style={{
                                                        width: 28, height: 28, borderRadius: '50%',
                                                        border: `2px solid ${border}`, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                                                        background: (isSelected && !examAnswered) ? `${colors[0]}15` : 'transparent',
                                                    }}>
                                                        {examAnswered && isCorrect ? <CheckCircle2 size={16} /> :
                                                            examAnswered && isSelected ? <X size={16} /> :
                                                                String.fromCharCode(65 + oi)}
                                                    </span>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Explanation (shows after answering) */}
                                    {examAnswered && q.explanation && (
                                        <div style={{
                                            padding: '16px 18px', borderRadius: 12, marginBottom: 20,
                                            background: 'rgba(245,158,11,0.06)',
                                            border: '1px solid rgba(245,158,11,0.15)',
                                        }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#f59e0b', marginBottom: 6 }}>💡 Explanation</div>
                                            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{q.explanation}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                        {!examAnswered ? (
                                            <button
                                                onClick={handleExamAnswer}
                                                disabled={examSelected === null}
                                                style={{
                                                    padding: '12px 32px', borderRadius: 10,
                                                    background: examSelected !== null
                                                        ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                                        : 'var(--bg-secondary)',
                                                    color: examSelected !== null ? '#fff' : 'var(--text-muted)',
                                                    fontWeight: 700, border: 'none',
                                                    cursor: examSelected !== null ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.9375rem',
                                                }}
                                            >Check Answer</button>
                                        ) : (
                                            <button
                                                onClick={handleExamNext}
                                                style={{
                                                    padding: '12px 32px', borderRadius: 10,
                                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                                    color: '#fff', fontWeight: 700, border: 'none',
                                                    cursor: 'pointer', fontSize: '0.9375rem',
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                }}
                                            >
                                                {examIdx + 1 >= examTotal ? 'See Results' : 'Next'}
                                                <ChevronRight size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
