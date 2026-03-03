'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ArrowRight, Check, BookOpen, Target, Clock,
    BarChart3, Zap, Upload, Sparkles, GripVertical, Pencil, Trash2,
    Plus, Languages, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, apiUpload } from '@/utils/api';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const INTENSITIES = ['Casual', 'Regular', 'Intensive', 'Hardcore'];
const LANGUAGES = [
    { code: 'English', label: 'English', flag: '🇬🇧' },
    { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
    { code: 'Hindi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
];

// simple client-side id generator for local topic items (UI only)
const genId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);



export default function AddSubjectPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        name: '',
        need: '',
        language: 'English',
        duration: 4,
        level: 'Beginner',
        intensity: 'Regular',
        syllabusMode: 'ai',
        syllabus: [],
    });
    const [editingIdx, setEditingIdx] = useState(-1);
    const [editText, setEditText] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [dragIdx, setDragIdx] = useState(-1);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        document.title = 'Add Subject – AuraLab';
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) setMounted(true);
    }, [user, authLoading, router]);

    if (!mounted || authLoading) return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <Navbar />
            <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
                {/* Step indicator skeleton */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
                            {i < 4 && <div className="skeleton" style={{ width: 40, height: 3, borderRadius: 2 }} />}
                        </div>
                    ))}
                </div>
                {/* Form card skeleton */}
                <div className="skeleton skeleton-card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
                        <div>
                            <div className="skeleton skeleton-text" style={{ height: 22, width: 200, marginBottom: 6 }} />
                            <div className="skeleton skeleton-text" style={{ height: 12, width: 160, marginBottom: 0 }} />
                        </div>
                    </div>
                    <div className="skeleton skeleton-text" style={{ height: 14, width: 100, marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 24 }} />
                    <div className="skeleton skeleton-text" style={{ height: 14, width: 120, marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
                </div>
            </main>
        </div>
    );

    const generateSyllabus = async () => {
        setGenerating(true);
        setGenError('');
        try {
            const topics = await apiFetch('/api/ai/generate-syllabus', {
                method: 'POST',
                body: JSON.stringify({
                    name: form.name,
                    goal: form.need,
                    duration: form.duration,
                    level: form.level,
                    intensity: form.intensity,
                    language: form.language,
                }),
            });
            if (!Array.isArray(topics) || topics.length === 0) {
                throw new Error('Backend returned an empty or invalid syllabus.');
            }
            setForm({
                ...form,
                syllabus: topics.map((t, i) => ({
                    id: genId(),
                    title: t.title,
                    order: i,
                })),
            });
        } catch (err) {
            setGenError(err.message || 'Failed to generate syllabus. Please check your backend / API key and try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handlePDFUpload = async () => {
        if (!pdfFile) return;
        setUploading(true);
        setUploadError('');
        try {
            const data = await apiUpload('/api/pdf/upload-pdf', pdfFile);
            if (!Array.isArray(data.syllabus) || data.syllabus.length === 0) {
                throw new Error('No topics extracted from PDF.');
            }
            setForm({
                ...form,
                syllabus: data.syllabus.map((t, i) => ({
                    id: genId(),
                    title: t.title,
                    order: i,
                })),
            });
        } catch (err) {
            setUploadError(err.message || 'Failed to process PDF. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        const subject = {
            name: form.name,
            need: form.need,
            language: form.language,
            duration: form.duration,
            level: form.level,
            intensity: form.intensity,
            syllabus: form.syllabus.map((t, i) => ({ ...t, order: i })),
        };

        try {
            await apiFetch('/api/subjects', {
                method: 'POST',
                body: JSON.stringify(subject),
            });
            router.push('/dashboard');
        } catch (error) {
            alert('Failed to save subject. Please try again.');
            setSaving(false);
        }
    };

    const canNext = () => {
        if (step === 0) return form.name.trim().length > 0;
        if (step === 1) return true;
        if (step === 2) return form.syllabus.length > 0;
        return true;
    };

    const handleDragStart = (idx) => setDragIdx(idx);
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === idx) return;
        const items = [...form.syllabus];
        const dragged = items[dragIdx];
        items.splice(dragIdx, 1);
        items.splice(idx, 0, dragged);
        setDragIdx(idx);
        setForm({ ...form, syllabus: items });
    };
    const handleDragEnd = () => setDragIdx(-1);

    const deleteTopic = (idx) => {
        const s = [...form.syllabus];
        s.splice(idx, 1);
        setForm({ ...form, syllabus: s });
    };

    const addTopic = () => {
        if (!newTopic.trim()) return;
        setForm({
            ...form,
            syllabus: [...form.syllabus, { id: genId(), title: newTopic.trim(), order: form.syllabus.length }],
        });
        setNewTopic('');
    };

    const steps = ['Subject Info', 'Learning Preferences', 'Build Syllabus', 'Review & Create'];

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <Navbar />
            <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
                {/* Step Indicator */}
                <div className="step-indicator animate-fade-in" style={{ marginBottom: 40, justifyContent: 'center' }}>
                    {steps.map((label, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div className={`step-dot ${i < step ? 'completed' : i === step ? 'active' : ''}`}>
                                    {i < step ? <Check size={16} /> : i + 1}
                                </div>
                                <span style={{
                                    fontSize: '0.6875rem',
                                    color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)',
                                    fontWeight: i === step ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                }}>{label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`step-line ${i < step ? 'completed' : ''}`} style={{ margin: '0 8px', marginBottom: 20 }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="card animate-slide-up" style={{ padding: '32px', overflow: 'visible' }}>
                    {/* Step 0: Subject Info */}
                    {step === 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'rgba(99,102,241,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <BookOpen size={22} style={{ color: 'var(--accent)' }} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        What do you want to learn?
                                    </h2>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        Tell us about your subject
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{
                                    display: 'block', fontSize: '0.8125rem', fontWeight: 600,
                                    color: 'var(--text-secondary)', marginBottom: 8,
                                }}>Subject Name *</label>
                                <input
                                    className="input"
                                    placeholder="e.g., JavaScript, Machine Learning, Piano..."
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block', fontSize: '0.8125rem', fontWeight: 600,
                                    color: 'var(--text-secondary)', marginBottom: 8,
                                }}>Your Goal (optional)</label>
                                <textarea
                                    className="input"
                                    placeholder="e.g., I want to build full-stack web applications..."
                                    value={form.need}
                                    onChange={e => setForm({ ...form, need: e.target.value })}
                                    rows={3}
                                    style={{ resize: 'vertical', minHeight: 80 }}
                                />
                            </div>

                            {/* Language Selector */}
                            <div style={{ marginTop: 20 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem',
                                    fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10,
                                }}>
                                    <Languages size={16} /> Study Language
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setForm({ ...form, language: lang.code })}
                                            style={{
                                                padding: '10px 4px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `2px solid ${form.language === lang.code ? 'var(--accent)' : 'var(--border-color)'}`,
                                                background: form.language === lang.code ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                                color: form.language === lang.code ? 'var(--accent)' : 'var(--text-secondary)',
                                                fontWeight: form.language === lang.code ? 600 : 400,
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <span style={{ fontSize: '1.25rem' }}>{lang.flag}</span>
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                                <p style={{
                                    fontSize: '0.6875rem',
                                    color: 'var(--text-muted)',
                                    marginTop: 8,
                                    fontStyle: 'italic',
                                }}>
                                    💡 You can change this later from the subject dashboard
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Preferences */}
                    {step === 1 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'rgba(16,185,129,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Target size={22} style={{ color: '#10b981' }} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Learning Preferences</h2>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        Customize your learning experience
                                    </p>
                                </div>
                            </div>

                            {/* Duration */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem',
                                    fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10,
                                }}>
                                    <Clock size={16} /> Duration (weeks)
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <input
                                        type="range"
                                        min={1}
                                        max={24}
                                        value={form.duration}
                                        onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
                                        style={{
                                            flex: 1,
                                            accentColor: 'var(--accent)',
                                            height: 6,
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent)',
                                        minWidth: 60, textAlign: 'center',
                                    }}>{form.duration}w</span>
                                </div>
                            </div>

                            {/* Level */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem',
                                    fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10,
                                }}>
                                    <BarChart3 size={16} /> Experience Level
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                    {LEVELS.map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setForm({ ...form, level: l })}
                                            style={{
                                                padding: '10px 4px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `2px solid ${form.level === l ? 'var(--accent)' : 'var(--border-color)'}`,
                                                background: form.level === l ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                                color: form.level === l ? 'var(--accent)' : 'var(--text-secondary)',
                                                fontWeight: form.level === l ? 600 : 400,
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >{l}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Intensity */}
                            <div>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem',
                                    fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10,
                                }}>
                                    <Zap size={16} /> Learning Intensity
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                    {INTENSITIES.map(i => (
                                        <button
                                            key={i}
                                            onClick={() => setForm({ ...form, intensity: i })}
                                            style={{
                                                padding: '10px 4px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `2px solid ${form.intensity === i ? 'var(--accent)' : 'var(--border-color)'}`,
                                                background: form.intensity === i ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                                color: form.intensity === i ? 'var(--accent)' : 'var(--text-secondary)',
                                                fontWeight: form.intensity === i ? 600 : 400,
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >{i}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Syllabus */}
                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'rgba(168,85,247,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Sparkles size={22} style={{ color: '#a855f7' }} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Build Your Syllabus</h2>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        Generate or upload your learning path
                                    </p>
                                </div>
                            </div>

                            {/* Toggle */}
                            <div style={{
                                display: 'flex',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                padding: 4,
                                marginBottom: 24,
                            }}>
                                {[
                                    { key: 'ai', icon: Sparkles, label: 'AI Generate' },
                                    { key: 'upload', icon: Upload, label: 'Upload PDF' },
                                ].map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setForm({ ...form, syllabusMode: opt.key })}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            padding: '10px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s',
                                            background: form.syllabusMode === opt.key
                                                ? 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))'
                                                : 'transparent',
                                            color: form.syllabusMode === opt.key ? 'white' : 'var(--text-secondary)',
                                            boxShadow: form.syllabusMode === opt.key ? '0 2px 8px var(--accent-glow)' : 'none',
                                        }}
                                    >
                                        <opt.icon size={16} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {form.syllabusMode === 'ai' && (
                                <>
                                    {form.syllabus.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                            {generating ? (
                                                <>
                                                    <div style={{
                                                        width: 40, height: 40, margin: '0 auto 16px',
                                                        border: '3px solid var(--border-color)',
                                                        borderTopColor: 'var(--accent)',
                                                        borderRadius: '50%',
                                                        animation: 'spin 0.8s linear infinite',
                                                    }} />
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        Generating syllabus with AI...
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={40} style={{ color: 'var(--accent)', margin: '0 auto 16px', opacity: 0.5 }} />
                                                    <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.875rem' }}>
                                                        Click below to generate a curriculum for &quot;{form.name}&quot;
                                                    </p>
                                                    {genError && (
                                                        <div style={{
                                                            background: 'rgba(239,68,68,0.08)',
                                                            border: '1px solid rgba(239,68,68,0.25)',
                                                            borderRadius: 'var(--radius-md)',
                                                            padding: '12px 16px',
                                                            marginBottom: 16,
                                                            fontSize: '0.8125rem',
                                                            color: '#ef4444',
                                                            textAlign: 'left',
                                                        }}>
                                                            {genError}
                                                        </div>
                                                    )}
                                                    <button className="btn-primary" onClick={generateSyllabus}>
                                                        <Sparkles size={16} />
                                                        Generate Syllabus
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {form.syllabus.map((topic, idx) => (
                                                <div
                                                    key={topic.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(idx)}
                                                    onDragOver={(e) => handleDragOver(e, idx)}
                                                    onDragEnd={handleDragEnd}
                                                    className="timeline-item"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        opacity: dragIdx === idx ? 0.5 : 1,
                                                        transition: 'opacity 0.2s',
                                                    }}
                                                >
                                                    <GripVertical size={16} style={{
                                                        color: 'var(--text-muted)',
                                                        cursor: 'grab',
                                                        flexShrink: 0,
                                                    }} />
                                                    {editingIdx === idx ? (
                                                        <input
                                                            className="input"
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            onBlur={() => {
                                                                if (editText.trim()) {
                                                                    const s = [...form.syllabus];
                                                                    s[idx] = { ...s[idx], title: editText.trim() };
                                                                    setForm({ ...form, syllabus: s });
                                                                }
                                                                setEditingIdx(-1);
                                                            }}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') e.target.blur();
                                                            }}
                                                            autoFocus
                                                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }}
                                                        />
                                                    ) : (
                                                        <span style={{
                                                            flex: 1,
                                                            fontSize: '0.875rem',
                                                            color: 'var(--text-primary)',
                                                        }}>{topic.title}</span>
                                                    )}
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={() => {
                                                            setEditingIdx(idx);
                                                            setEditText(topic.title);
                                                        }}
                                                        style={{ padding: 6 }}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={() => deleteTopic(idx)}
                                                        style={{ padding: 6, color: 'var(--danger)' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add topic */}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                                <input
                                                    className="input"
                                                    placeholder="Add a topic..."
                                                    value={newTopic}
                                                    onChange={e => setNewTopic(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') addTopic(); }}
                                                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                                />
                                                <button className="btn-secondary" onClick={addTopic} style={{ padding: '8px 16px' }}>
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button
                                                className="btn-ghost"
                                                onClick={generateSyllabus}
                                                disabled={generating}
                                                style={{ marginTop: 12, fontSize: '0.8125rem', opacity: generating ? 0.5 : 1 }}
                                            >
                                                <Sparkles size={14} />
                                                {generating ? 'Regenerating...' : 'Regenerate'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {form.syllabusMode === 'upload' && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) { setPdfFile(file); setUploadError(''); }
                                        }}
                                    />
                                    <div style={{
                                        border: `2px dashed ${pdfFile ? 'var(--accent)' : 'var(--border-color)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '48px 24px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                        background: pdfFile ? 'rgba(99,102,241,0.04)' : 'transparent',
                                    }}
                                        onClick={() => !uploading && fileInputRef.current?.click()}
                                        onDragOver={e => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'var(--accent)';
                                        }}
                                        onDragLeave={e => {
                                            e.currentTarget.style.borderColor = pdfFile ? 'var(--accent)' : 'var(--border-color)';
                                        }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'var(--accent)';
                                            const file = e.dataTransfer.files?.[0];
                                            if (file && file.type === 'application/pdf') {
                                                setPdfFile(file);
                                                setUploadError('');
                                            } else {
                                                setUploadError('Please drop a valid PDF file.');
                                            }
                                        }}
                                    >
                                        {uploading ? (
                                            <>
                                                <div style={{
                                                    width: 40, height: 40, margin: '0 auto 16px',
                                                    border: '3px solid var(--border-color)',
                                                    borderTopColor: 'var(--accent)',
                                                    borderRadius: '50%',
                                                    animation: 'spin 0.8s linear infinite',
                                                }} />
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    Uploading & extracting syllabus...
                                                </p>
                                            </>
                                        ) : pdfFile ? (
                                            <>
                                                <div style={{
                                                    width: 48, height: 48, borderRadius: 12,
                                                    background: 'rgba(99,102,241,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 12px',
                                                }}>
                                                    <Upload size={24} style={{ color: 'var(--accent)' }} />
                                                </div>
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                    {pdfFile.name}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                                    {(pdfFile.size / 1024).toFixed(1)} KB · Click to change
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                    Drop your PDF here
                                                </p>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                                    or click to browse
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {uploadError && (
                                        <div style={{
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1px solid rgba(239,68,68,0.25)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '12px 16px',
                                            marginTop: 12,
                                            fontSize: '0.8125rem',
                                            color: '#ef4444',
                                        }}>
                                            {uploadError}
                                        </div>
                                    )}

                                    {pdfFile && !uploading && form.syllabus.length === 0 && (
                                        <button
                                            className="btn-primary"
                                            onClick={(e) => { e.stopPropagation(); handlePDFUpload(); }}
                                            style={{ marginTop: 16, width: '100%', padding: '12px 24px' }}
                                        >
                                            <Sparkles size={16} />
                                            Upload & Generate Syllabus
                                        </button>
                                    )}

                                    {/* Show generated topics from PDF */}
                                    {form.syllabus.length > 0 && (
                                        <div style={{ marginTop: 20 }}>
                                            {form.syllabus.map((topic, idx) => (
                                                <div
                                                    key={topic.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(idx)}
                                                    onDragOver={(e) => handleDragOver(e, idx)}
                                                    onDragEnd={handleDragEnd}
                                                    className="timeline-item"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        opacity: dragIdx === idx ? 0.5 : 1,
                                                        transition: 'opacity 0.2s',
                                                    }}
                                                >
                                                    <GripVertical size={16} style={{
                                                        color: 'var(--text-muted)',
                                                        cursor: 'grab',
                                                        flexShrink: 0,
                                                    }} />
                                                    {editingIdx === idx ? (
                                                        <input
                                                            className="input"
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            onBlur={() => {
                                                                if (editText.trim()) {
                                                                    const s = [...form.syllabus];
                                                                    s[idx] = { ...s[idx], title: editText.trim() };
                                                                    setForm({ ...form, syllabus: s });
                                                                }
                                                                setEditingIdx(-1);
                                                            }}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') e.target.blur();
                                                            }}
                                                            autoFocus
                                                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }}
                                                        />
                                                    ) : (
                                                        <span style={{
                                                            flex: 1,
                                                            fontSize: '0.875rem',
                                                            color: 'var(--text-primary)',
                                                        }}>{topic.title}</span>
                                                    )}
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={() => {
                                                            setEditingIdx(idx);
                                                            setEditText(topic.title);
                                                        }}
                                                        style={{ padding: 6 }}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={() => deleteTopic(idx)}
                                                        style={{ padding: 6, color: 'var(--danger)' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add topic */}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                                <input
                                                    className="input"
                                                    placeholder="Add a topic..."
                                                    value={newTopic}
                                                    onChange={e => setNewTopic(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') addTopic(); }}
                                                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                                />
                                                <button className="btn-secondary" onClick={addTopic} style={{ padding: '8px 16px' }}>
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button
                                                className="btn-ghost"
                                                onClick={() => {
                                                    setForm({ ...form, syllabus: [] });
                                                    setPdfFile(null);
                                                    setUploadError('');
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                style={{ marginTop: 12, fontSize: '0.8125rem' }}
                                            >
                                                <Upload size={14} />
                                                Upload Different PDF
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'rgba(16,185,129,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Check size={22} style={{ color: '#10b981' }} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Review & Create</h2>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        Everything looks good? Let&apos;s go!
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 16 }}>
                                {[
                                    { label: 'Subject', value: form.name },
                                    { label: 'Goal', value: form.need || 'Not specified' },
                                    { label: 'Language', value: `${LANGUAGES.find(l => l.code === form.language)?.flag || ''} ${form.language}` },
                                    { label: 'Duration', value: `${form.duration} weeks` },
                                    { label: 'Level', value: form.level },
                                    { label: 'Intensity', value: form.intensity },
                                    { label: 'Topics', value: `${form.syllabus.length} topics` },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.label}</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {form.syllabus.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                    <h3 style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 12,
                                    }}>Syllabus Preview</h3>
                                    <div style={{
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        {form.syllabus.map((t, i) => (
                                            <div key={t.id} style={{
                                                padding: '10px 16px',
                                                borderBottom: i < form.syllabus.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                fontSize: '0.8125rem',
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                            }}>
                                                <span style={{
                                                    width: 22, height: 22, borderRadius: '50%',
                                                    background: 'var(--bg-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
                                                    flexShrink: 0,
                                                }}>{i + 1}</span>
                                                {t.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 24,
                    gap: 12,
                }}>
                    <button
                        className="btn-secondary"
                        onClick={() => step === 0 ? router.push('/dashboard') : setStep(step - 1)}
                        style={{ padding: '12px 24px' }}
                    >
                        <ArrowLeft size={16} />
                        {step === 0 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            className="btn-primary"
                            disabled={!canNext()}
                            onClick={() => setStep(step + 1)}
                            style={{
                                padding: '12px 24px',
                                opacity: canNext() ? 1 : 0.5,
                            }}
                        >
                            Next
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '12px 32px',
                                opacity: saving ? 0.6 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {saving ? (
                                <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Creating...</>
                            ) : (
                                <><Sparkles size={16} /> Create Subject</>
                            )}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
