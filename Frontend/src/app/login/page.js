'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
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
            <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900">
                <div className="auth-bg-pattern" />
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                    padding: '40px',
                    maxWidth: 500,
                }}>
                    <img
                        src="/logo.png"
                        alt="AuraLab Logo"
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: 24,
                            objectFit: 'cover',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                        }}
                    />
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: 12,
                        letterSpacing: '-0.025em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                <div className="animate-fade-in w-full max-w-[420px] px-2 md:px-0">
                    {/* Mobile logo */}
                    <div className="md:hidden text-center mb-6">
                        <img
                            src="/logo.png"
                            alt="AuraLab Logo"
                            className="w-10 h-10 mx-auto rounded-xl object-cover mb-3 block"
                        />
                        <h2 className="gradient-text text-2xl font-bold flex items-center justify-center">AuraLab</h2>
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
                            <a href="/forgot-password" style={{
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

                    <div style={{
                        marginTop: 24,
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16
                    }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-color, rgba(255,255,255,0.1))' }}></div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-color, rgba(255,255,255,0.1))' }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await signInWithGoogle();
                            } catch (err) {
                                setError(err.message || 'Failed to sign in with Google');
                                setLoading(false);
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '0.9375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            background: 'transparent',
                            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                            borderRadius: 'var(--radius-md, 12px)',
                            color: 'var(--text-primary, white)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

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
