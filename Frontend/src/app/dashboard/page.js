'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, TrendingUp, BookOpen, Search, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StreakGrid from '@/components/StreakGrid';
import SubjectCard from '@/components/SubjectCard';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

const calcStreak = (data) => {
    let count = 0;
    let d = new Date();
    while (true) {
        const k = d.toISOString().split('T')[0];
        if (data[k]) {
            count++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return count;
};



export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [streak, setStreak] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);


    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await apiFetch(`/api/subjects/${id}`, { method: 'DELETE' });
            setSubjects(prev => prev.filter(s => s.id !== id));
        } catch (e) {
            alert('Failed to delete subject.');
        } finally {
            setDeleting(null);
        }
    };

    useEffect(() => {
        document.title = 'Dashboard – AuraLab';
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const loadDashboard = async () => {
                try {
                    const [subjects, streakData] = await Promise.all([
                        apiFetch('/api/subjects'),
                        apiFetch('/api/user/streak'),
                    ]);
                    setSubjects(subjects || []);
                    setStreak(calcStreak(streakData || {}));
                } catch (e) {
                } finally {
                    setSubjectsLoading(false);
                }
            };
            loadDashboard();
            setMounted(true);

        }
    }, [user, authLoading, router]);

    if (authLoading || !mounted) return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <Navbar />
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ marginBottom: 40 }}>
                    <div className="skeleton skeleton-text" style={{ height: 36, width: 280, marginBottom: 12 }} />
                    <div className="skeleton skeleton-text" style={{ height: 16, width: 240 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton skeleton-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="skeleton skeleton-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton skeleton-text" style={{ height: 22, width: '50%', marginBottom: 6 }} />
                                <div className="skeleton skeleton-text" style={{ height: 12, width: '70%', marginBottom: 0 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );

    if (subjectsLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'transparent' }}>
                <Navbar />
                <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
                    {/* Hero Skeleton */}
                    <div style={{ marginBottom: 40 }}>
                        <div className="skeleton skeleton-text" style={{ height: 36, width: 280, marginBottom: 12 }} />
                        <div className="skeleton skeleton-text" style={{ height: 16, width: 240 }} />
                    </div>

                    {/* Stats Skeleton */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div className="skeleton skeleton-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text" style={{ height: 22, width: '50%', marginBottom: 6 }} />
                                    <div className="skeleton skeleton-text" style={{ height: 12, width: '70%', marginBottom: 0 }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Streak Grid Skeleton */}
                    <div className="skeleton skeleton-card" style={{ padding: 24, marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div className="skeleton skeleton-text" style={{ height: 16, width: 140 }} />
                            <div className="skeleton skeleton-text" style={{ height: 14, width: 100 }} />
                        </div>
                        <div className="skeleton" style={{ height: 110, borderRadius: 8 }} />
                    </div>

                    {/* Subject Cards Skeleton */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div className="skeleton skeleton-text" style={{ height: 22, width: 140 }} />
                        <div className="skeleton" style={{ height: 38, width: 140, borderRadius: 8 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="skeleton" style={{ height: 140, borderRadius: 0 }} />
                                <div style={{ padding: 20 }}>
                                    <div className="skeleton skeleton-text" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                                    <div className="skeleton skeleton-text" style={{ height: 12, width: '50%', marginBottom: 16 }} />
                                    <div className="skeleton" style={{ height: 8, borderRadius: 4, marginBottom: 8 }} />
                                    <div className="skeleton skeleton-text" style={{ height: 12, width: '35%', marginBottom: 0 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Learner';

    const totalTopics = subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0);
    const passedTopics = subjects.reduce((sum, s) => {
        return sum + (s.topics || []).filter(t => t.passed).length;
    }, 0);

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <Navbar />

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
                {/* Hero */}
                <div className="animate-fade-in" style={{ marginBottom: 40 }}>
                    <h1 style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.2,
                        marginBottom: 8,
                    }}>
                        Hello, <span className="gradient-text">{displayName}</span>
                    </h1>
                    <p style={{
                        fontSize: '1.0625rem',
                        color: 'var(--text-secondary)',
                    }}>Ready to continue your learning journey?</p>


                </div>

                {/* Stats Row */}
                <div className="animate-slide-up stagger-children" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 32,
                }}>
                    {[
                        { icon: BookOpen, label: 'Subjects', value: subjects.length, color: '#6366f1' },
                        { icon: TrendingUp, label: 'Topics Completed', value: `${passedTopics}/${totalTopics}`, color: '#10b981' },
                        { icon: Sparkles, label: 'Day Streak', value: streak, color: '#f59e0b' },
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                        }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: `${stat.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <stat.icon size={22} style={{ color: stat.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Streak Section */}
                <div className="card animate-slide-up" style={{
                    padding: '24px',
                    marginBottom: 32,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                    }}>
                        <h2 style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}>Learning Activity</h2>
                        <span style={{
                            fontSize: '0.8125rem',
                            color: 'var(--text-muted)',
                        }}>Last 12 months</span>
                    </div>
                    <StreakGrid />
                </div>

                {/* Subjects Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                    }}>Your Subjects</h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flex: 1,
                        justifyContent: 'flex-end',
                    }}>
                        <div style={{
                            position: 'relative',
                            maxWidth: 280,
                            flex: 1,
                        }}>
                            <Search size={16} style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none',
                            }} />
                            <input
                                className="input"
                                placeholder="Search subjects..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    paddingLeft: 36,
                                    padding: '8px 14px 8px 36px',
                                    fontSize: '0.8125rem',
                                    height: 38,
                                }}
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={() => router.push('/add')}
                            style={{ padding: '8px 20px', fontSize: '0.8125rem', height: 38, flexShrink: 0 }}
                        >
                            <Plus size={16} />
                            Add Subject
                        </button>
                    </div>
                </div>

                {/* Subject Grid */}
                {subjects.length === 0 ? (
                    <div className="card animate-fade-in" style={{
                        padding: '60px 24px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: 72,
                            height: 72,
                            borderRadius: 20,
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 8,
                        }}>No subjects yet</h3>
                        <p style={{
                            color: 'var(--text-muted)',
                            marginBottom: 24,
                            fontSize: '0.875rem',
                        }}>Add your first subject to start your AI-powered learning journey</p>
                        <button
                            className="btn-primary"
                            onClick={() => router.push('/add')}
                        >
                            <Plus size={16} />
                            Create Your First Subject
                        </button>
                    </div>
                ) : (
                    <div className="stagger-children" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 20,
                    }}>
                        {subjects
                            .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(s => (
                                <SubjectCard key={s.id} subject={s} onDelete={handleDelete} />
                            ))}
                        {/* Add Subject Card */}
                        <div
                            className="card"
                            onClick={() => router.push('/add')}
                            style={{
                                padding: 0,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: '2px dashed var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 220,
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.style.background = 'rgba(99,102,241,0.04)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = '';
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: 16,
                                    background: 'rgba(99,102,241,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 14px',
                                }}>
                                    <Plus size={26} style={{ color: '#6366f1' }} />
                                </div>
                                <p style={{
                                    fontWeight: 700, fontSize: '0.9375rem',
                                    color: 'var(--text-primary)', marginBottom: 4,
                                }}>Add Subject</p>
                                <p style={{
                                    fontSize: '0.75rem', color: 'var(--text-muted)',
                                }}>Start a new learning journey</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
