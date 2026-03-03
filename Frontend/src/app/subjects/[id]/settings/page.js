'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, BookOpen, Target, Clock, BarChart3, Zap,
    Languages, Sparkles, GripVertical, Pencil, Trash2, Plus,
    AlertTriangle, RotateCcw, Settings, RefreshCw, SlidersHorizontal
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const INTENSITIES = ['Casual', 'Regular', 'Intensive', 'Hardcore'];
const LANGUAGES = [
    { code: 'English', label: 'English', flag: '🇬🇧' },
    { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
    { code: 'Hindi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
];

const genId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export default function SettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');
    const [editingIdx, setEditingIdx] = useState(-1);
    const [editText, setEditText] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [dragIdx, setDragIdx] = useState(-1);

    // Two modes: null (choose), 'syllabus' (regenerate syllabus only), 'config' (edit settings → auto-regen)
    const [settingsMode, setSettingsMode] = useState(null);
    const [configStep, setConfigStep] = useState('edit'); // 'edit' or 'review'

    const [original, setOriginal] = useState(null); // original subject data
    const [form, setForm] = useState({
        name: '',
        need: '',
        language: 'English',
        duration: 4,
        level: 'Beginner',
        intensity: 'Regular',
        syllabus: [],
    });

    useEffect(() => {
        if (!authLoading && !user) { router.push('/login'); return; }
        const id = params?.id;
        if (!id || !user) return;
        const fetchSubject = async () => {
            try {
                const data = await apiFetch(`/api/subjects/${id}`);
                if (!data) { router.push('/dashboard'); return; }
                const formData = {
                    name: data.name || '',
                    need: data.need || '',
                    language: data.language || 'English',
                    duration: data.duration || 4,
                    level: data.level || 'Beginner',
                    intensity: data.intensity || 'Regular',
                    syllabus: (data.topics || [])
                        .sort((a, b) => a.topic_order - b.topic_order)
                        .map((t, i) => ({ id: t.id || genId(), title: t.title, order: i })),
                };
                setForm(formData);
                setOriginal(formData);
                setMounted(true);
                document.title = `Settings – ${data.name || 'Subject'} – AuraLab`;
            } catch (error) {
                console.error('Failed to fetch subject:', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [params?.id, user, authLoading, router]);

    const generateSyllabus = async (overrideForm) => {
        const f = overrideForm || form;
        setGenerating(true);
        setGenError('');
        try {
            const topics = await apiFetch('/api/ai/generate-syllabus', {
                method: 'POST',
                body: JSON.stringify({
                    name: f.name, goal: f.need,
                    duration: f.duration, level: f.level,
                    intensity: f.intensity, language: f.language,
                }),
            });
            if (!Array.isArray(topics) || topics.length === 0)
                throw new Error('AI returned an empty syllabus.');
            const newSyllabus = topics.map((t, i) => ({ id: genId(), title: t.title, order: i }));
            setForm(prev => ({ ...prev, syllabus: newSyllabus }));
            return newSyllabus;
        } catch (err) {
            console.error('AI syllabus generation failed:', err);
            setGenError(err.message || 'Failed to generate syllabus.');
            return null;
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!confirm('⚠️ This will reset ALL your progress. All topics restart from the beginning. Continue?')) return;
        setSaving(true);
        try {
            await apiFetch(`/api/subjects/${params.id}/reset`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: form.name, need: form.need,
                    language: form.language, duration: form.duration,
                    level: form.level, intensity: form.intensity,
                    syllabus: form.syllabus.map((t, i) => ({ title: t.title, order: i })),
                }),
            });
            router.push(`/subjects/${params.id}`);
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    // Config mode step 1: regenerate syllabus and show it
    const handleConfigRegenerate = async () => {
        const newSyllabus = await generateSyllabus(form);
        if (newSyllabus) setConfigStep('review');
    };

    // Config mode step 2: confirm and save
    const handleConfigConfirm = async () => {
        if (!confirm('⚠️ This will reset ALL your progress. Continue?')) return;
        setSaving(true);
        try {
            await apiFetch(`/api/subjects/${params.id}/reset`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: form.name, need: form.need,
                    language: form.language, duration: form.duration,
                    level: form.level, intensity: form.intensity,
                    syllabus: form.syllabus.map((t, i) => ({ title: t.title, order: i })),
                }),
            });
            router.push(`/subjects/${params.id}`);
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save. Please try again.');
        } finally { setSaving(false); }
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
    const deleteTopic = (idx) => { const s = [...form.syllabus]; s.splice(idx, 1); setForm({ ...form, syllabus: s }); };
    const addTopic = () => {
        if (!newTopic.trim()) return;
        setForm({ ...form, syllabus: [...form.syllabus, { id: genId(), title: newTopic.trim(), order: form.syllabus.length }] });
        setNewTopic('');
    };

    const hasConfigChanged = original && (
        form.language !== original.language ||
        form.duration !== original.duration ||
        form.level !== original.level ||
        form.intensity !== original.intensity
    );

    if (!mounted || authLoading || loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <div>
                        <div className="skeleton skeleton-text" style={{ height: 28, width: 180, marginBottom: 6 }} />
                        <div className="skeleton skeleton-text" style={{ height: 14, width: 220, marginBottom: 0 }} />
                    </div>
                </div>
                {[1, 2].map(i => (
                    <div key={i} className="skeleton skeleton-card" style={{ padding: '28px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-text" style={{ height: 18, width: '50%', marginBottom: 8 }} />
                            <div className="skeleton skeleton-text" style={{ height: 12, width: '80%', marginBottom: 0 }} />
                        </div>
                    </div>
                ))}
                <div className="skeleton skeleton-card" style={{ padding: 20, marginTop: 8 }}>
                    <div className="skeleton skeleton-text" style={{ height: 12, width: 160, marginBottom: 16 }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <div className="skeleton skeleton-text" style={{ height: 14, width: 80, marginBottom: 0 }} />
                            <div className="skeleton skeleton-text" style={{ height: 14, width: 100, marginBottom: 0 }} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );

    // ─── Choose Mode ─────────────────
    if (settingsMode === null) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar />
                <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <button className="btn-ghost" onClick={() => router.push(`/subjects/${params.id}`)} style={{ padding: '8px 12px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Project Settings</h1>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>What would you like to change?</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                        {/* Option 1: Regenerate Syllabus */}
                        <button
                            onClick={() => setSettingsMode('syllabus')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 20,
                                padding: '28px 24px', textAlign: 'left',
                                borderRadius: 'var(--radius-xl)',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#a855f7';
                                e.currentTarget.style.background = 'rgba(168,85,247,0.04)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                        >
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: 'rgba(168,85,247,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <RefreshCw size={24} style={{ color: '#a855f7' }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    Regenerate Syllabus
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    AI will create a new syllabus. You can also add, edit, delete, and reorder topics manually.
                                </p>
                            </div>
                        </button>

                        {/* Option 2: Edit Configuration */}
                        <button
                            onClick={() => setSettingsMode('config')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 20,
                                padding: '28px 24px', textAlign: 'left',
                                borderRadius: 'var(--radius-xl)',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.style.background = 'rgba(99,102,241,0.04)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                        >
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: 'rgba(99,102,241,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <SlidersHorizontal size={24} style={{ color: '#6366f1' }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    Edit Configuration
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Change language, difficulty, duration, or intensity. Syllabus will auto-regenerate with new settings.
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Current Info */}
                    <div className="card" style={{ padding: 20, marginTop: 24 }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                            Current Configuration
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px' }}>
                            {[
                                { label: 'Language', value: form.language },
                                { label: 'Level', value: form.level },
                                { label: 'Duration', value: `${form.duration} weeks` },
                                { label: 'Intensity', value: form.intensity },
                                { label: 'Topics', value: `${form.syllabus.length} topics` },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ─── Syllabus Mode ─────────────────
    if (settingsMode === 'syllabus') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar />
                <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                        <button className="btn-ghost" onClick={() => setSettingsMode(null)} style={{ padding: '8px 12px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Regenerate Syllabus</h1>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                Regenerate with AI or manually edit your topics
                            </p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', marginBottom: 24,
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                    }}>
                        <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            Saving will <strong>reset all progress</strong>. You&apos;ll start from the beginning.
                        </span>
                    </div>

                    {/* Syllabus Card */}
                    <div className="card" style={{ padding: 28, overflow: 'visible' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'rgba(168,85,247,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Sparkles size={20} style={{ color: '#a855f7' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Syllabus</h2>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 1 }}>{form.syllabus.length} topics • Drag to reorder</p>
                            </div>
                            <button
                                className="btn-ghost"
                                onClick={() => generateSyllabus()}
                                disabled={generating || !form.name.trim()}
                                style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6, opacity: generating ? 0.5 : 1 }}
                            >
                                <RotateCcw size={14} style={{ animation: generating ? 'spin 0.8s linear infinite' : 'none' }} />
                                {generating ? 'Generating...' : 'Regenerate with AI'}
                            </button>
                        </div>

                        {genError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16,
                                fontSize: '0.8125rem', color: '#ef4444',
                            }}>{genError}</div>
                        )}

                        {form.syllabus.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                <Sparkles size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No topics. Add manually or regenerate with AI.</p>
                            </div>
                        ) : (
                            <div>
                                {form.syllabus.map((topic, idx) => (
                                    <div key={topic.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                                        className="timeline-item" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: dragIdx === idx ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                                        <GripVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{idx + 1}</span>
                                        {editingIdx === idx ? (
                                            <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
                                                onBlur={() => { if (editText.trim()) { const s = [...form.syllabus]; s[idx] = { ...s[idx], title: editText.trim() }; setForm({ ...form, syllabus: s }); } setEditingIdx(-1); }}
                                                onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} autoFocus style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }} />
                                        ) : (
                                            <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{topic.title}</span>
                                        )}
                                        <button className="btn-ghost" onClick={() => { setEditingIdx(idx); setEditText(topic.title); }} style={{ padding: 6 }}><Pencil size={14} /></button>
                                        <button className="btn-ghost" onClick={() => deleteTopic(idx)} style={{ padding: 6, color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <input className="input" placeholder="Add a topic..." value={newTopic} onChange={e => setNewTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addTopic(); }} style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }} />
                            <button className="btn-secondary" onClick={addTopic} style={{ padding: '8px 16px' }}><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28 }}>
                        <button className="btn-secondary" onClick={() => setSettingsMode(null)} style={{ padding: '14px 28px' }}>
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button className="btn-primary" onClick={handleSave}
                            disabled={saving || form.syllabus.length === 0}
                            style={{ padding: '14px 36px', fontSize: '1rem', fontWeight: 700, opacity: saving || form.syllabus.length === 0 ? 0.5 : 1, background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                            {saving ? (<><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</>) : (<><Save size={18} /> Save &amp; Restart</>)}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // ─── Config Mode ─────────────────
    // Step 2: Review regenerated syllabus
    if (settingsMode === 'config' && configStep === 'review') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar />
                <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                        <button className="btn-ghost" onClick={() => setConfigStep('edit')} style={{ padding: '8px 12px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Review New Syllabus</h1>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                Review the regenerated syllabus. You can still edit before saving.
                            </p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', marginBottom: 24,
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                    }}>
                        <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            Confirming will <strong>reset all progress</strong> and apply the new configuration.
                        </span>
                    </div>

                    {/* Changes Summary */}
                    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Updated Configuration
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px' }}>
                            {[
                                { label: 'Language', value: form.language, changed: form.language !== original?.language },
                                { label: 'Level', value: form.level, changed: form.level !== original?.level },
                                { label: 'Duration', value: `${form.duration} weeks`, changed: form.duration !== original?.duration },
                                { label: 'Intensity', value: form.intensity, changed: form.intensity !== original?.intensity },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: item.changed ? 'var(--accent)' : 'var(--text-primary)' }}>
                                        {item.changed ? `✦ ${item.value}` : item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Syllabus */}
                    <div className="card" style={{ padding: 28, overflow: 'visible' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={20} style={{ color: '#a855f7' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Syllabus</h2>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 1 }}>{form.syllabus.length} topics • Drag to reorder</p>
                            </div>
                            <button className="btn-ghost" onClick={() => generateSyllabus()} disabled={generating}
                                style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6, opacity: generating ? 0.5 : 1 }}>
                                <RotateCcw size={14} style={{ animation: generating ? 'spin 0.8s linear infinite' : 'none' }} />
                                {generating ? 'Regenerating...' : 'Regenerate'}
                            </button>
                        </div>

                        {genError && (
                            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, fontSize: '0.8125rem', color: '#ef4444' }}>{genError}</div>
                        )}

                        <div>
                            {form.syllabus.map((topic, idx) => (
                                <div key={topic.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                                    className="timeline-item" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: dragIdx === idx ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                                    <GripVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{idx + 1}</span>
                                    {editingIdx === idx ? (
                                        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
                                            onBlur={() => { if (editText.trim()) { const s = [...form.syllabus]; s[idx] = { ...s[idx], title: editText.trim() }; setForm({ ...form, syllabus: s }); } setEditingIdx(-1); }}
                                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} autoFocus style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }} />
                                    ) : (
                                        <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{topic.title}</span>
                                    )}
                                    <button className="btn-ghost" onClick={() => { setEditingIdx(idx); setEditText(topic.title); }} style={{ padding: 6 }}><Pencil size={14} /></button>
                                    <button className="btn-ghost" onClick={() => deleteTopic(idx)} style={{ padding: 6, color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <input className="input" placeholder="Add a topic..." value={newTopic} onChange={e => setNewTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addTopic(); }} style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }} />
                            <button className="btn-secondary" onClick={addTopic} style={{ padding: '8px 16px' }}><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28 }}>
                        <button className="btn-secondary" onClick={() => setConfigStep('edit')} style={{ padding: '14px 28px' }}>
                            <ArrowLeft size={16} /> Back to Settings
                        </button>
                        <button className="btn-primary" onClick={handleConfigConfirm}
                            disabled={saving || form.syllabus.length === 0}
                            style={{ padding: '14px 36px', fontSize: '1rem', fontWeight: 700, opacity: saving || form.syllabus.length === 0 ? 0.5 : 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {saving ? (<><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</>) : (<><Save size={18} /> Confirm &amp; Save</>)}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Step 1: Edit configuration
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <button className="btn-ghost" onClick={() => { setSettingsMode(null); setConfigStep('edit'); }} style={{ padding: '8px 12px' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Edit Configuration</h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            Change settings — syllabus will auto-regenerate
                        </p>
                    </div>
                </div>

                {/* Warning */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', marginBottom: 24,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                }}>
                    <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Saving will <strong>regenerate your syllabus</strong> and <strong>reset all progress</strong>.
                    </span>
                </div>

                {/* Language */}
                <div className="card" style={{ padding: 28, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <Languages size={16} /> Study Language
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {LANGUAGES.map(lang => (
                            <button key={lang.code} onClick={() => setForm({ ...form, language: lang.code })}
                                style={{
                                    padding: '10px 4px', borderRadius: 'var(--radius-sm)',
                                    border: `2px solid ${form.language === lang.code ? 'var(--accent)' : 'var(--border-color)'}`,
                                    background: form.language === lang.code ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                    color: form.language === lang.code ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontWeight: form.language === lang.code ? 600 : 400, fontSize: '0.75rem',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                }}>
                                <span style={{ fontSize: '1.25rem' }}>{lang.flag}</span>
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div className="card" style={{ padding: 28, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <Clock size={16} /> Duration (weeks)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <input type="range" min={1} max={24} value={form.duration}
                            onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
                            style={{ flex: 1, accentColor: 'var(--accent)', height: 6 }} />
                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent)', minWidth: 60, textAlign: 'center' }}>{form.duration}w</span>
                    </div>
                </div>

                {/* Level */}
                <div className="card" style={{ padding: 28, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <BarChart3 size={16} /> Experience Level
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {LEVELS.map(l => (
                            <button key={l} onClick={() => setForm({ ...form, level: l })}
                                style={{
                                    padding: '10px 4px', borderRadius: 'var(--radius-sm)',
                                    border: `2px solid ${form.level === l ? 'var(--accent)' : 'var(--border-color)'}`,
                                    background: form.level === l ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                    color: form.level === l ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontWeight: form.level === l ? 600 : 400, fontSize: '0.8125rem',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* Intensity */}
                <div className="card" style={{ padding: 28, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <Zap size={16} /> Learning Intensity
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {INTENSITIES.map(i => (
                            <button key={i} onClick={() => setForm({ ...form, intensity: i })}
                                style={{
                                    padding: '10px 4px', borderRadius: 'var(--radius-sm)',
                                    border: `2px solid ${form.intensity === i ? 'var(--accent)' : 'var(--border-color)'}`,
                                    background: form.intensity === i ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                    color: form.intensity === i ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontWeight: form.intensity === i ? 600 : 400, fontSize: '0.8125rem',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}>{i}</button>
                        ))}
                    </div>
                </div>

                {/* What changed indicator */}
                {hasConfigChanged && (
                    <div style={{
                        padding: '14px 18px', marginBottom: 16,
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                        fontSize: '0.8125rem', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <Sparkles size={16} />
                        Settings changed — a new syllabus will be generated when you proceed.
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28 }}>
                    <button className="btn-secondary" onClick={() => { setSettingsMode(null); setConfigStep('edit'); }} style={{ padding: '14px 28px' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button className="btn-primary" onClick={handleConfigRegenerate}
                        disabled={generating || !hasConfigChanged}
                        style={{ padding: '14px 36px', fontSize: '1rem', fontWeight: 700, opacity: generating || !hasConfigChanged ? 0.5 : 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {generating ? (
                            <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                Regenerating...</>
                        ) : (<><RefreshCw size={18} /> Regenerate Syllabus</>)}
                    </button>
                </div>
            </main>
        </div>
    );
}
