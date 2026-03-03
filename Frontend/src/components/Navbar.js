'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Flame, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [streak, setStreak] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const fetchStreak = async () => {
            try {
                const streakData = await apiFetch('/api/user/streak');
                let currentStreak = 0;
                const d = new Date();
                while (true) {
                    const key = d.toISOString().split('T')[0];
                    if (streakData?.[key]) {
                        currentStreak++;
                        d.setDate(d.getDate() - 1);
                    } else {
                        break;
                    }
                }
                setStreak(currentStreak);
            } catch (e) {
                console.error('Failed to fetch streak:', e);
                // If it's auth error, reset streak to 0
                if (e.message.includes('Authentication failed')) {
                    setStreak(0);
                }
            }
        };
        fetchStreak();
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
        }}>
            {/* Logo */}
            <a
                href="/dashboard"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    flexShrink: 0,
                }}
            >
                <img
                    src="/logo.png"
                    alt="AuraLab Logo"
                    className="w-8 h-8 md:w-[38px] md:h-[38px]"
                    style={{
                        borderRadius: 9,
                        objectFit: 'cover',
                        flexShrink: 0,
                    }}
                />
                <span className="text-xl md:text-2xl" style={{
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                    marginTop: '2px',
                }}>AuraLab</span>
            </a>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                {/* Streak Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    background: streak > 0 ? 'rgba(245,158,11,0.08)' : 'var(--bg-secondary)',
                    borderRadius: 20,
                    border: streak > 0 ? '1px solid rgba(245,158,11,0.25)' : '1px solid var(--border-color)',
                    transition: 'all 0.3s',
                }}>
                    <Flame size={15} style={{ color: streak > 0 ? '#f59e0b' : 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: streak > 0 ? '#f59e0b' : 'var(--text-muted)',
                        minWidth: 12,
                        textAlign: 'center',
                    }}>{streak}</span>
                </div>

                {/* Profile Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '5px 10px 5px 5px',
                            background: dropdownOpen ? 'var(--bg-secondary)' : 'transparent',
                            border: '1px solid ' + (dropdownOpen ? 'var(--border-color)' : 'transparent'),
                            cursor: 'pointer',
                            borderRadius: 24,
                            transition: 'all 0.2s',
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                        }}>
                            {avatarLetter}
                        </div>

                        {/* Name */}
                        <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            maxWidth: 90,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {displayName}
                        </span>

                        <ChevronDown size={13} style={{
                            color: 'var(--text-muted)',
                            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                        }} />
                    </button>

                    {dropdownOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div
                                className="animate-fade-in"
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    minWidth: 210,
                                    overflow: 'hidden',
                                    zIndex: 50,
                                }}
                            >
                                {/* User info */}
                                <div style={{
                                    padding: '14px 16px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.9375rem',
                                        flexShrink: 0,
                                    }}>
                                        {avatarLetter}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {displayName}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user?.email || ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div style={{ padding: '6px 0' }}>
                                    {[
                                        {
                                            icon: User, label: 'Profile', onClick: () => {
                                                setDropdownOpen(false);
                                                router.push('/profile');
                                            }
                                        },
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={item.onClick}
                                            className="btn-ghost"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                width: '100%',
                                                padding: '9px 16px',
                                                borderRadius: 0,
                                                fontSize: '0.8125rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500,
                                            }}
                                        >
                                            <item.icon size={15} style={{ color: 'var(--text-muted)' }} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Logout */}
                                <div style={{ borderTop: '1px solid var(--border-color)', padding: '6px 0' }}>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-ghost"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            width: '100%',
                                            padding: '9px 16px',
                                            borderRadius: 0,
                                            fontSize: '0.8125rem',
                                            color: 'var(--danger)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        <LogOut size={15} style={{ color: 'var(--danger)' }} />
                                        Log out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
