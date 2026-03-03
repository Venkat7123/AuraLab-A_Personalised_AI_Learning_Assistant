'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

export default function StreakGrid() {
    const [streakData, setStreakData] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const check = () => setIsMobile(window.innerWidth <= 768);
            check();
            window.addEventListener('resize', check);
            return () => window.removeEventListener('resize', check);
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchStreak = async () => {
            try {
                setError(null);
                const data = await apiFetch('/api/user/streak');
                setStreakData(data || {});
            } catch (e) {
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

    // Mobile: smaller cells, fewer weeks
    const cellSize = isMobile ? 10 : 12;
    const cellGap = isMobile ? 2 : 3;
    const colWidth = cellSize + cellGap;

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

    // On mobile show only the last ~20 weeks so the grid fits
    const mobileWeeksCount = 20;
    const allWeeks = [];
    for (let i = 0; i < data.length; i += 7) {
        allWeeks.push(data.slice(i, i + 7));
    }
    const weeks = isMobile ? allWeeks.slice(-mobileWeeksCount) : allWeeks;

    // Recalculate months for the visible weeks
    const visibleMonths = useMemo(() => {
        if (!isMobile) return months;
        const offset = allWeeks.length - mobileWeeksCount;
        return months
            .filter(m => m.colIndex >= offset)
            .map(m => ({ ...m, colIndex: m.colIndex - offset }));
    }, [isMobile, months, allWeeks.length]);

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
        <div style={{ padding: '4px 0' }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 3 : 5,
            }}>
                {/* Months Row */}
                <div style={{
                    display: 'flex',
                    marginLeft: isMobile ? 0 : 26, // No day labels on mobile
                    height: 16,
                    overflow: 'hidden',
                    width: weeks.length * colWidth - cellGap,
                }}>
                    {visibleMonths.map((m, i) => {
                        const nextCol = i < visibleMonths.length - 1 ? visibleMonths[i + 1].colIndex : weeks.length;
                        const span = nextCol - m.colIndex;
                        return (
                            <div key={i} style={{
                                width: span * colWidth,
                                flexShrink: 0,
                                fontSize: '0.625rem',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                            }}>
                                {m.name}
                            </div>
                        );
                    })}
                </div>

                <div style={{
                    display: 'flex',
                    gap: cellGap,
                    alignItems: 'flex-start',
                }}>
                    {/* Day labels — hide on mobile */}
                    {!isMobile && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: cellGap,
                            marginRight: 6,
                            paddingTop: 0,
                        }}>
                            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                                <div key={i} style={{
                                    height: cellSize,
                                    fontSize: '0.625rem',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    lineHeight: 1,
                                }}>{label}</div>
                            ))}
                        </div>
                    )}

                    {/* Grid */}
                    <div style={{ display: 'flex', gap: cellGap }}>
                        {weeks.map((week, wi) => (
                            <div key={wi} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: cellGap,
                            }}>
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        className={`streak-cell streak-${day.level}`}
                                        style={{ width: cellSize, height: cellSize }}
                                        title={`${day.fullDate}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: isMobile ? 8 : 12,
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
