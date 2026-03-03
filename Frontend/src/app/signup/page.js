'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
    const router = useRouter();
    const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        document.title = 'Sign Up – AuraLab';
        // Only redirect to dashboard if they are already logged in and didn't just sign up.
        if (!authLoading && user && !success) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router, success]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.password || !form.confirm) {
            setError('Please fill in all fields');
            return;
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await signUp({ email: form.email, password: form.password, name: form.name });
            setSuccess(true);
            router.replace('/onboarding');
        } catch (err) {
            setError(err.message || 'Failed to sign up');
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
                        Start your AI-powered learning journey today. Build custom curriculums, track progress, and master any subject.
                    </p>

                    <div className="animate-float" style={{
                        position: 'absolute',
                        top: '15%', left: '10%',
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                    }} />
                    <div className="animate-float" style={{
                        position: 'absolute',
                        bottom: '20%', right: '15%',
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.25)',
                        animationDelay: '1s',
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
                    <div className="md:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
                        <img
                            src="/logo.png"
                            alt="AuraLab Logo"
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                objectFit: 'cover',
                                marginBottom: 12,
                                display: 'block',
                                margin: '0 auto 12px',
                            }}
                        />
                        <h2 className="gradient-text" style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>AuraLab</h2>
                    </div>

                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                    }}>Create your account</h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: 32,
                        fontSize: '0.9375rem',
                    }}>Get started with your personalized learning experience</p>

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
                        <div style={{ marginBottom: 18 }}>
                            <label style={{
                                display: 'block', fontSize: '0.8125rem',
                                fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8,
                            }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={{
                                display: 'block', fontSize: '0.8125rem',
                                fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8,
                            }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={{
                                display: 'block', fontSize: '0.8125rem',
                                fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8,
                            }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
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
                                        position: 'absolute', right: 14, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                                    }}
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: 'block', fontSize: '0.8125rem',
                                fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8,
                            }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="input"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={form.confirm}
                                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px', fontSize: '0.9375rem' }}
                        >
                            {loading ? (
                                <span style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    border: '2px solid white', borderTopColor: 'transparent',
                                    display: 'inline-block',
                                    animation: 'spin 0.6s linear infinite',
                                }} />
                            ) : (
                                <>Create Account <ArrowRight size={18} /></>
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
                        Already have an account?{' '}
                        <a href="/login" style={{
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}>Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
