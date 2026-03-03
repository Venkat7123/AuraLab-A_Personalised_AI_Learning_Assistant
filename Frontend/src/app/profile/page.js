'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, User, Save, Trash2,
    CheckCircle, AlertCircle
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
    });
    const [toast, setToast] = useState(null); // { type: 'success'|'error', text: '' }

    useEffect(() => {
        document.title = 'Profile – AuraLab';
        if (!user) { router.push('/login'); return; }
        setFormData(prev => ({
            ...prev,
            name: user.user_metadata?.name || '',
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

    const handleDeleteAccount = async () => {
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/api/profile', { method: 'DELETE' });
            await signOut();
            router.push('/login');
        } catch (err) {
            showToast('error', err.message || 'Failed to delete account');
            setLoading(false);
        }
    };



    if (!mounted) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <main style={{ maxWidth: 620, margin: '0 auto', padding: '24px 24px 80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <div className="skeleton skeleton-text" style={{ height: 28, width: 100 }} />
                </div>
                {/* Avatar skeleton */}
                <div className="skeleton skeleton-card" style={{ padding: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="skeleton skeleton-circle" style={{ width: 64, height: 64, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ height: 20, width: '40%', marginBottom: 8 }} />
                        <div className="skeleton skeleton-text" style={{ height: 14, width: '60%', marginBottom: 0 }} />
                    </div>
                </div>
                {/* Name card skeleton */}
                <div className="skeleton skeleton-card" style={{ padding: 24, marginBottom: 16 }}>
                    <div className="skeleton skeleton-text" style={{ height: 14, width: 120, marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 8 }} />
                        <div className="skeleton" style={{ height: 40, width: 80, borderRadius: 8 }} />
                    </div>
                </div>
            </main>
        </div>
    );

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
                    <button className="btn-danger" onClick={handleDeleteAccount} disabled={loading}
                        style={{ padding: '8px 18px', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' }}>
                        Delete Account
                    </button>
                </div>
            </main>
        </div>
    );
}