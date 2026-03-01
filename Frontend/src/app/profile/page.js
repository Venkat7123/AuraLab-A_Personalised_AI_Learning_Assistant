'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, User, Lock, Mail, Save, Shield, Trash2,
    CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

export default function ProfilePage() {
    const router = useRouter();
    const { user, signOut, refreshSession } = useAuth();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', text: '' }

    useEffect(() => {
        document.title = 'Profile – AuraLab';
        if (!user) { router.push('/login'); return; }
        setFormData(prev => ({
            ...prev,
            name: user.user_metadata?.name || '',
            email: user.email || '',
        }));
        setMounted(true);
    }, [user, router]);

    const showToast = (type, text) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

    const handleUpdateName = async () => {
        if (!formData.name.trim()) return showToast('error', 'Name cannot be empty');
        setLoading(true);
        try {
            await apiFetch('/api/profile/name', {
                method: 'PUT',
                body: JSON.stringify({ name: formData.name }),
            });
            await refreshSession();
            showToast('success', 'Name updated!');
        } catch (err) {
            showToast('error', err.message || 'Failed to update name');
        }
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!formData.newPassword || !formData.confirmPassword)
            return showToast('error', 'Fill in both password fields');
        if (formData.newPassword !== formData.confirmPassword)
            return showToast('error', 'Passwords do not match');
        if (formData.newPassword.length < 6)
            return showToast('error', 'Password must be at least 6 characters');

        setLoading(true);
        try {
            await apiFetch('/api/profile/password', {
                method: 'PUT',
                body: JSON.stringify({ password: formData.newPassword }),
            });
            showToast('success', 'Password updated!');
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (err) {
            showToast('error', err.message || 'Failed to update password');
        }
        setLoading(false);
    };

    const handleUpdateEmail = async () => {
        if (!formData.email.trim()) return showToast('error', 'Email cannot be empty');
        const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!rx.test(formData.email)) return showToast('error', 'Invalid email address');

        setLoading(true);
        try {
            await apiFetch('/api/profile/email', {
                method: 'PUT',
                body: JSON.stringify({ email: formData.email }),
            });
            showToast('success', 'Check your inbox to confirm the new email.');
        } catch (err) {
            showToast('error', err.message || 'Failed to update email');
        }
        setLoading(false);
    };

    if (!mounted) return null;

    const initials = (formData.name || user?.email || '?').slice(0, 2).toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <main style={{ maxWidth: 620, margin: '0 auto', padding: '24px 24px 80px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <button className="btn-ghost" onClick={() => router.back()} style={{ padding: '8px 12px' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profile</h1>
                </div>

                {/* Toast */}
                {toast && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 18px', marginBottom: 20,
                        borderRadius: 'var(--radius-lg)',
                        background: toast.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        animation: 'fadeIn 0.2s ease-out',
                    }}>
                        {toast.type === 'success'
                            ? <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                            : <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
                        <span style={{ fontSize: '0.8125rem', color: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
                            {toast.text}
                        </span>
                    </div>
                )}

                {/* Avatar + Info */}
                <div className="card" style={{ padding: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.25rem', fontWeight: 800, color: 'white',
                        flexShrink: 0,
                    }}>
                        {initials}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {formData.name || 'User'}
                        </h2>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                </div>

                {/* Display Name */}
                <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <User size={16} /> Display Name
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input className="input" value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                            placeholder="Your name"
                            style={{ flex: 1, padding: '10px 14px', fontSize: '0.875rem' }} />
                        <button className="btn-primary" onClick={handleUpdateName} disabled={loading}
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
                            <Save size={14} /> Save
                        </button>
                    </div>
                </div>

                {/* Email */}
                <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <Mail size={16} /> Email Address
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input className="input" type="email" value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            placeholder="you@example.com"
                            style={{ flex: 1, padding: '10px 14px', fontSize: '0.875rem' }} />
                        <button className="btn-primary" onClick={handleUpdateEmail} disabled={loading}
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
                            <Mail size={14} /> Update
                        </button>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        You&apos;ll need to verify your new email address.
                    </p>
                </div>

                {/* Password */}
                <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <Shield size={16} /> Change Password
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                            <input className="input" type={showPassword ? 'text' : 'password'} value={formData.newPassword}
                                onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                                placeholder="New password (min 6 chars)"
                                style={{ width: '100%', padding: '10px 42px 10px 14px', fontSize: '0.875rem' }} />
                            <button onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input className="input" type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword}
                                onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                                placeholder="Confirm new password"
                                style={{ width: '100%', padding: '10px 42px 10px 14px', fontSize: '0.875rem' }} />
                            <button onClick={() => setShowConfirm(!showConfirm)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button className="btn-primary" onClick={handleUpdatePassword} disabled={loading}
                            style={{ alignSelf: 'flex-start', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
                            <Lock size={14} /> Update Password
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div style={{
                    padding: 24, marginTop: 8,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.04)',
                }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
                        <Trash2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        Danger Zone
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="btn-danger"
                        style={{ padding: '8px 18px', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' }}>
                        Delete Account
                    </button>
                </div>
            </main>
        </div>
    );
}