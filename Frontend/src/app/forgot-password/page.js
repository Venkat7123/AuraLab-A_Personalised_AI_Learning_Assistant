'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { user, loading: authLoading, resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        document.title = 'Forgot Password – AuraLab';
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to send reset email');
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
                        fontSize: '3rem', fontWeight: 800, color: 'white',
                        marginBottom: 12, letterSpacing: '-0.025em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>AuraLab</h1>
                    <p style={{
                        fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
                    }}>
                        Get back to your AI-powered learning journey. We'll help you securely reset your password.
                    </p>

                    <div className="animate-float" style={{
                        position: 'absolute', top: '15%', left: '10%',
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.2)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                    }} />
                    <div className="animate-float" style={{
                        position: 'absolute', bottom: '20%', right: '15%',
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.25)', animationDelay: '1s',
                    }} />
                </div>
            </div>

            {/* Right — Form */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px 24px', background: 'var(--bg-primary)',
            }}>
                <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                            marginBottom: 24, padding: 0,
                        }}
                    >
                        <ArrowLeft size={16} /> Back to login
                    </button>

                    <h2 style={{
                        fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)',
                        marginBottom: 8,
                    }}>Reset your password</h2>
                    <p style={{
                        color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.9375rem',
                    }}>Enter your email address to receive a secure password reset link.</p>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 'var(--radius-md)', padding: '12px 16px',
                            marginBottom: 20, color: 'var(--danger)', fontSize: '0.875rem',
                        }}>{error}</div>
                    )}
                    {success && (
                        <div style={{
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 'var(--radius-md)', padding: '12px 16px',
                            marginBottom: 20, color: '#10b981', fontSize: '0.875rem',
                        }}>Check your inbox! We've sent a secure reset link to your email address.</div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 24 }}>
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
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        style={{ paddingLeft: 44 }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || !email}
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
                                    <>Send Reset Link <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
