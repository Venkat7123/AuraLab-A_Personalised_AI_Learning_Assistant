'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiFetch } from '@/utils/api';

const SubjectContext = createContext();

const LANG_CODE_MAP = {
    'English': 'en', 'Tamil': 'ta', 'Hindi': 'hi', 'Kannada': 'kn', 'Telugu': 'te',
};

export function SubjectProvider({ children, subjectId }) {
    const [subject, setSubject] = useState(null);
    const [language, setLanguageState] = useState('en');
    const [loading, setLoading] = useState(true);
    const [translating, setTranslating] = useState(false);

    // Initial fetch
    useEffect(() => {
        if (!subjectId) return;

        const fetchSubject = async () => {
            try {
                const data = await apiFetch(`/api/subjects/${subjectId}`);
                setSubject(data);
                setLanguageState(LANG_CODE_MAP[data.language] || 'en');
            } catch (error) {
                console.error('Failed to fetch subject:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubject();
    }, [subjectId]);

    // Handle language changes with translation
    const setLanguage = useCallback(async (newLang) => {
        setLanguageState(newLang);

        if (!subject || newLang === 'en') {
            // English is the base language, no translation needed
            return;
        }

        // Fetch translated topics
        setTranslating(true);
        try {
            const data = await apiFetch(`/api/subjects/${subjectId}/translate?lang=${newLang}`);
            setSubject(prev => ({
                ...prev,
                topics: data.topics || prev?.topics
            }));
        } catch (error) {
            console.error('Translation failed:', error);
            // Fallback: keep original topics
        } finally {
            setTranslating(false);
        }
    }, [subject, subjectId]);

    return (
        <SubjectContext.Provider value={{ subject, language, setLanguage, loading, translating }}>
            {children}
        </SubjectContext.Provider>
    );
}

export function useSubject() {
    const context = useContext(SubjectContext);
    if (!context) {
        throw new Error('useSubject must be used within SubjectProvider');
    }
    return context;
}
