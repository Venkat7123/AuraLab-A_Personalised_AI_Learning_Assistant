'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

const ONBOARDING_STEPS = [
    {
        id: 'role',
        question: "What best describes you?",
        options: [
            "School Student",
            "College Student",
            "Competitive Exam Aspirant",
            "Working Professional",
            "Career Switcher"
        ]
    },
    {
        id: 'goal',
        question: "What is your primary goal?",
        options: [
            "Score better in exams",
            "Understand concepts deeply",
            "Learn a new skill",
            "Career growth",
            "Build projects"
        ]
    },
    {
        id: 'level',
        question: "What is your current level in this subject?",
        options: [
            "Beginner",
            "Intermediate",
            "Advanced",
            "Not sure"
        ]
    },
    {
        id: 'time',
        question: "How many hours can you dedicate daily?",
        options: [
            "30 mins",
            "1 hour",
            "2 hours",
            "3+ hours"
        ]
    },
    {
        id: 'style',
        question: "How do you prefer to learn?",
        options: [
            "Step-by-step explanations",
            "Examples & real-life applications",
            "Practice-focused learning",
            "Visual diagrams & infographics",
            "Mixed approach"
        ]
    }
];

function useTypewriter(text, speed = 60) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return { displayed, done };
}

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        role: '',
        goal: '',
        level: '',
        time: '',
        style: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
    const greeting = `Hello ${userName}, let's personalize your experience`;
    const { displayed, done: typingDone } = useTypewriter(greeting, 50);

    useEffect(() => {
        document.title = 'Welcome – AuraLab';
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }

        // Check if user already finished onboarding
        if (!authLoading && user) {
            supabase
                .from('user_preferences')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        router.replace('/dashboard');
                    } else {
                        setIsChecking(false);
                    }
                });
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (typingDone) {
            const timeout = setTimeout(() => setShowForm(true), 400);
            return () => clearTimeout(timeout);
        }
    }, [typingDone]);

    const handleOptionSelect = async (optionValue) => {
        const step = ONBOARDING_STEPS[currentStep];
        const newFormData = { ...formData, [step.id]: optionValue };
        setFormData(newFormData);

        if (currentStep < ONBOARDING_STEPS.length - 1) {
            // Move to next step smoothly
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        } else {
            // Final step complete, submit data
            await submitPreferences(newFormData);
        }
    };

    const submitPreferences = async (finalData) => {
        setError('');
        setSaving(true);
        try {
            // Save as a JSONB object in 'preferences' or similar if your schema requires,
            // or just dump it into a JSON column. We'll map it directly to the table
            // relying on Supabase to handle jsonb or new columns. 
            // If the table doesn't have these specific columns, putting them in an 'onboarding_data' JSON column is safer.
            const { error: saveErr } = await supabase.from('user_preferences').upsert({
                user_id: user.id,
                // Fallbacks for the previous schema fields if they are required:
                interests: [finalData.goal],
                experience_level: finalData.level.toLowerCase()
            });

            if (saveErr) throw saveErr;
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to save preferences');
            setSaving(false);
        }
    };

    if (authLoading || isChecking) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-glow)' }}></div>
        </div>
    );

    const currentStepData = ONBOARDING_STEPS[currentStep];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decorations */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    animation: 'float 8s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-5%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
                    animation: 'float 10s ease-in-out infinite reverse',
                }} />
            </div>

            <div style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: 640,
                padding: '48px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>

                {/* Greeting Phase */}
                {!showForm && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                            boxShadow: '0 8px 32px var(--accent-glow)',
                            marginBottom: 32,
                        }}>
                            <Sparkles size={32} color="white" />
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                            minHeight: '3.5rem',
                        }}>
                            {displayed}
                            {!typingDone && (
                                <span style={{
                                    display: 'inline-block', width: 3, height: '1em',
                                    background: 'var(--accent)', marginLeft: 2,
                                    animation: 'blink 0.8s step-end infinite',
                                    verticalAlign: 'text-bottom',
                                }} />
                            )}
                        </h1>
                    </div>
                )}

                {/* Questionnaire Phase */}
                {showForm && (
                    <div className="animate-slide-up" style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>

                        {/* Progress Bar & Back Button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                            {currentStep > 0 ? (
                                <button
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    style={{
                                        background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                        fontSize: '0.9375rem', padding: 0
                                    }}>
                                    <ArrowLeft size={16} /> Back
                                </button>
                            ) : <div />}

                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                            </span>
                        </div>

                        {/* Question */}
                        <h2 key={`q-${currentStep}`} className="animate-fade-in" style={{
                            fontSize: '1.5rem', fontWeight: 700,
                            color: 'var(--text-primary)', marginBottom: 24,
                            textAlign: 'center'
                        }}>
                            {currentStepData.question}
                        </h2>

                        {/* Options */}
                        <div key={`opt-${currentStep}`} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {currentStepData.options.map((option, idx) => {
                                const isSelected = formData[currentStepData.id] === option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(option)}
                                        disabled={saving}
                                        style={{
                                            padding: '16px 20px',
                                            borderRadius: 'var(--radius-md)',
                                            background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                                            border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                                            fontSize: '1rem', fontWeight: 500,
                                            textAlign: 'left', cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 0 12px var(--accent-glow)' : 'none',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = 'var(--text-muted)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                            }
                                        }}
                                    >
                                        {option}
                                        {isSelected && <ArrowRight size={18} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Loading State Overlay */}
                        {saving && (
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    border: '2px solid var(--accent)', borderTopColor: 'transparent',
                                    display: 'inline-block',
                                    animation: 'spin 0.6s linear infinite',
                                }} />
                            </div>
                        )}

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 'var(--radius-md)',
                                padding: '12px 16px', marginTop: 20,
                                color: 'var(--danger)', fontSize: '0.875rem',
                                textAlign: 'center'
                            }}>{error}</div>
                        )}

                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
