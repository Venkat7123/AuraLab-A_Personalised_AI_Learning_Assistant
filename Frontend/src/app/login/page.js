'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading, signIn } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = 'Login – AuraLab';
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.email || !form.password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await signIn({ email: form.email, password: form.password });
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left — Illustration */}
            <div style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
            }}
                className="hidden md:flex"
            >
                <div className="auth-bg-pattern" />
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                    padding: '40px',
                    maxWidth: 500,
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                    }}>
                        <span style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>A</span>
                    </div>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: 12,
                        letterSpacing: '-0.025em',
                    }}>AuraLab</h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.6,
                    }}>
                        AI-powered learning that adapts to you. Master any subject with personalized curriculums, interactive quizzes, and intelligent guidance.
                    </p>

                    {/* Floating decorative orbs */}
                    <div className="animate-float" style={{
                        position: 'absolute',
                        top: '15%',
                        left: '10%',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                    }} />
                    <div className="animate-float" style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '15%',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.25)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        animationDelay: '1s',
                    }} />
                    <div className="animate-float" style={{
                        position: 'absolute',
                        top: '60%',
                        left: '20%',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(168, 85, 247, 0.3)',
                        animationDelay: '2s',
                    }} />
                </div>
            </div>

            {/* Right — Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                background: 'var(--bg-primary)',
            }}>
                <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
                    {/* Mobile logo */}
                    <div className="md:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                        }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>A</span>
                        </div>
                        <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700 }}>AuraLab</h2>
                    </div>

                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                    }}>Welcome back</h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: 32,
                        fontSize: '0.9375rem',
                    }}>Sign in to continue your learning journey</p>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                            marginBottom: 20,
                            color: 'var(--danger)',
                            fontSize: '0.875rem',
                        }}>{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 8,
                            }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 8,
                            }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="input"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    style={{ paddingLeft: 44, paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute',
                                        right: 14,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: 0,
                                    }}
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 24,
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.8125rem',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}>
                                <input type="checkbox" style={{
                                    accentColor: 'var(--accent)',
                                    width: 16,
                                    height: 16,
                                }} />
                                Remember me
                            </label>
                            <a href="#" style={{
                                fontSize: '0.8125rem',
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                fontWeight: 500,
                            }}>Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px', fontSize: '0.9375rem' }}
                        >
                            {loading ? (
                                <span className="animate-pulse-glow" style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    border: '2px solid white', borderTopColor: 'transparent',
                                    display: 'inline-block',
                                    animation: 'spin 0.6s linear infinite',
                                }} />
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <p style={{
                        textAlign: 'center',
                        marginTop: 32,
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                    }}>
                        Don&apos;t have an account?{' '}
                        <a href="/signup" style={{
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}>Create account</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
