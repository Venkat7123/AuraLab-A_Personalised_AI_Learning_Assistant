'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

export default function StreakGrid() {
    const [streakData, setStreakData] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const fetchStreak = async () => {
            try {
                setError(null);
                const data = await apiFetch('/api/user/streak');
                setStreakData(data || {});
            } catch (e) {
                console.error('Failed to fetch streak data:', e);
                setError(e.message);
                // If it's auth error, clear the streak data
                if (e.message.includes('Authentication failed')) {
                    setStreakData({});
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStreak();
    }, [user]);

    const { data, months } = useMemo(() => {
        const weeksCount = 52;
        const days = [];
        const today = new Date();
        const monthsList = [];
        let currentMonth = null;

        for (let i = weeksCount * 7 - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = streakData[key] || 0;
            const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;

            days.push({
                date: key,
                count,
                level,
                dayName: d.toLocaleDateString('en', { weekday: 'short' }),
                fullDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
            });

            // Track month changes (only track on the first day of the week to align with columns)
            if (i % 7 === 0) {
                const monthName = d.toLocaleDateString('en', { month: 'short' });
                if (monthName !== currentMonth) {
                    monthsList.push({ name: monthName, colIndex: Math.floor((weeksCount * 7 - 1 - i) / 7) });
                    currentMonth = monthName;
                }
            }
        }
        return { data: days, months: monthsList };
    }, [streakData]);

    const weeks = [];
    for (let i = 0; i < data.length; i += 7) {
        weeks.push(data.slice(i, i + 7));
    }

    if (loading) {
        return (
            <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {Array.from({ length: 7 }).map((_, j) => (
                                <div key={j} className="skeleton" style={{ width: 12, height: 12, borderRadius: 3 }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto w-full pb-2"><div style={{ padding: '4px 0', minWidth: 'max-content' }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                minWidth: 'max-content',
            }}>
                {/* Months Row */}
                <div style={{
                    display: 'flex',
                    marginLeft: 26, // Align past the day labels
                    position: 'relative',
                    height: 16,
                }}>
                    {months.map((m, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: m.colIndex * 15, // 12px box + 3px gap
                            fontSize: '0.625rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                        }}>
                            {m.name}
                        </div>
                    ))}
                </div>

                <div style={{
                    display: 'flex',
                    gap: 3,
                    alignItems: 'flex-start',
                }}>
                    {/* Day labels */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        marginRight: 6,
                        paddingTop: 0,
                    }}>
                        {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                            <div key={i} style={{
                                height: 12,
                                fontSize: '0.625rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                lineHeight: 1,
                            }}>{label}</div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div style={{ display: 'flex', gap: 3 }}>
                        {weeks.map((week, wi) => (
                            <div key={wi} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                            }}>
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        className={`streak-cell streak-${day.level}`}
                                        title={`${day.fullDate}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                justifyContent: 'flex-end',
            }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Less</span>
                {[0, 1, 2, 3, 4].map(l => (
                    <div key={l} className={`streak-cell streak-${l}`} style={{ width: 10, height: 10 }} />
                ))}
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>More</span>
            </div>
        </div>
    );
}
