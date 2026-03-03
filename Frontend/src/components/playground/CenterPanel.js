'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    BookOpen, Eye, Hand, ClipboardCheck, Globe2,
    ChevronRight, CheckCircle2, XCircle, Award,
    RotateCcw, Languages, Loader2, RefreshCw, Sparkles
} from 'lucide-react';
import { apiFetch } from '@/utils/api';
import { generateTopicPdf } from '@/utils/generatePdf';

const MODES_BASE = [
    { key: 'explain', icon: BookOpen, color: '#6366f1' },
    { key: 'demonstrate', icon: Eye, color: '#8b5cf6' },
    { key: 'try', icon: Hand, color: '#10b981' },
    { key: 'test', icon: ClipboardCheck, color: '#f59e0b' },
    { key: 'apply', icon: Globe2, color: '#ec4899' },
];

const LANG_NAME_FROM_CODE = {
    'en': 'English', 'ta': 'Tamil', 'hi': 'Hindi', 'kn': 'Kannada', 'te': 'Telugu',
};

const UI_TRANSLATIONS = {
    en: {
        explain: 'Explain', demonstrate: 'Demonstrate', try: 'Let me try', test: 'Test me', apply: 'Apply',
        quizTime: 'Quiz Time! 🧠', testKnowledge: 'Test your knowledge on',
        questions: 'Questions', passScore: 'Pass Score', focusMode: 'Focus Mode',
        startQuiz: 'Start Quiz', submitAnswer: 'Submit Answer', nextQuestion: 'Next Question',
        seeResults: 'See Results', tryAgain: 'Try Again', backToLearning: 'Back to Learning',
        brilliant: '🎉 Brilliant!', keepGoing: '💪 Keep Going!',
        passedMsg: "You've mastered this topic! The next topic is now unlocked.",
        failedMsg: 'You need 7/{total} to pass. Review the material and try again.',
        outOf: 'out of', correct: 'Correct', wrong: 'Wrong', answerReview: 'Answer Review',
        question: 'Question', score: 'Score',
        focusWarningTitle: 'Focus Mode Active', focusWarningMsg: 'Stay on this tab during the quiz!',
        contentGenerating: 'Content is being generated...',
        contentGeneratingDesc: 'AI is preparing your learning materials in',
        contentGeneratingNote: 'This usually takes a minute. You can also generate it now.',
        generateNow: 'Generate Now', generating: 'Generating...', loadingContent: 'Loading content...',
        contentIn: 'Content in',
        attempts: 'Attempts',
    },
    ta: {
        explain: 'விளக்கு', demonstrate: 'செய்து காட்டு', try: 'நான் முயற்சிக்கிறேன்', test: 'என்னை சோதி', apply: 'பயன்படுத்து',
        quizTime: 'குவிஸ் நேரம்! 🧠', testKnowledge: 'உங்கள் அறிவை சோதிக்கவும்',
        questions: 'கேள்விகள்', passScore: 'தேர்ச்சி மதிப்பெண்', focusMode: 'கவன முறை',
        startQuiz: 'தொடங்கு', submitAnswer: 'பதிலை சமர்ப்பி', nextQuestion: 'அடுத்த கேள்வி',
        seeResults: 'முடிவுகளைப் பார்', tryAgain: 'மீண்டும் முயற்சி', backToLearning: 'கற்றலுக்கு திரும்பு',
        brilliant: '🎉 அருமை!', keepGoing: '💪 தொடர்ந்து முயற்சி!',
        passedMsg: 'இந்த தலைப்பில் நீங்கள் தேர்ச்சி பெற்றீர்கள்! அடுத்த தலைப்பு திறக்கப்பட்டது.',
        failedMsg: 'தேர்ச்சிக்கு 7/{total} தேவை. மீண்டும் படித்து முயற்சிக்கவும்.',
        outOf: 'இல்', correct: 'சரி', wrong: 'தவறு', answerReview: 'பதில் மதிப்பாய்வு',
        question: 'கேள்வி', score: 'மதிப்பெண்',
        focusWarningTitle: 'கவன முறை செயலில்', focusWarningMsg: 'குவிஸ் நேரத்தில் இந்த டேபில் இருங்கள்!',
        contentGenerating: 'உள்ளடக்கம் தயாராகிறது...',
        contentGeneratingDesc: 'AI உங்கள் கற்றல் உள்ளடக்கத்தை தயார் செய்கிறது',
        contentGeneratingNote: 'இது ஒரு நிமிடம் எடுக்கும். இப்போதே உருவாக்கலாம்.',
        generateNow: 'இப்போது உருவாக்கு', generating: 'உருவாக்குகிறது...', loadingContent: 'உள்ளடக்கம் ஏற்றுகிறது...',
        contentIn: 'உள்ளடக்கம்',
        attempts: 'முயற்சிகள்',
    },
    hi: {
        explain: 'समझाओ', demonstrate: 'दिखाओ', try: 'मैं करूँ', test: 'मेरी परीक्षा लो', apply: 'लागू करो',
        quizTime: 'क्विज़ टाइम! 🧠', testKnowledge: 'अपना ज्ञान परखो',
        questions: 'सवाल', passScore: 'पास स्कोर', focusMode: 'फोकस मोड',
        startQuiz: 'शुरू करो', submitAnswer: 'जवाब दो', nextQuestion: 'अगला सवाल',
        seeResults: 'नतीजे देखो', tryAgain: 'फिर से कोशिश', backToLearning: 'वापस पढ़ाई पर',
        brilliant: '🎉 शानदार!', keepGoing: '💪 कोशिश जारी रखो!',
        passedMsg: 'इस टॉपिक में आपने महारत हासिल कर ली! अगला टॉपिक अनलॉक हो गया।',
        failedMsg: 'पास के लिए 7/{total} चाहिए। दोबारा पढ़ो और कोशिश करो।',
        outOf: 'में से', correct: 'सही', wrong: 'गलत', answerReview: 'जवाब समीक्षा',
        question: 'सवाल', score: 'स्कोर',
        focusWarningTitle: 'फोकस मोड चालू', focusWarningMsg: 'क्विज़ के दौरान इसी टैब पर रहो!',
        contentGenerating: 'सामग्री तैयार हो रही है...',
        contentGeneratingDesc: 'AI आपकी पढ़ाई का सामग्री तैयार कर रहा है',
        contentGeneratingNote: 'इसमें एक मिनट लगेगा। अभी भी बना सकते हो।',
        generateNow: 'अभी बनाओ', generating: 'बना रहे हैं...', loadingContent: 'सामग्री लोड हो रही है...',
        contentIn: 'सामग्री',
        attempts: 'प्रयास',
    },
    kn: {
        explain: 'ವಿವರಿಸಿ', demonstrate: 'ತೋರಿಸಿ', try: 'ನಾನು ಪ್ರಯತ್ನಿಸುತ್ತೇನೆ', test: 'ನನ್ನ ಪರೀಕ್ಷೆ', apply: 'ಅನ್ವಯಿಸಿ',
        quizTime: 'ಕ್ವಿಜ್ ಸಮಯ! 🧠', testKnowledge: 'ನಿಮ್ಮ ಜ್ಞಾನ ಪರೀಕ್ಷಿಸಿ',
        questions: 'ಪ್ರಶ್ನೆಗಳು', passScore: 'ಪಾಸ್ ಸ್ಕೋರ್', focusMode: 'ಫೋಕಸ್ ಮೋಡ್',
        startQuiz: 'ಪ್ರಾರಂಭಿಸಿ', submitAnswer: 'ಉತ್ತರ ಕೊಡಿ', nextQuestion: 'ಮುಂದಿನ ಪ್ರಶ್ನೆ',
        seeResults: 'ಫಲಿತಾಂಶ ನೋಡಿ', tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', backToLearning: 'ಕಲಿಕೆಗೆ ಹಿಂತಿರುಗಿ',
        brilliant: '🎉 ಅದ್ಭುತ!', keepGoing: '💪 ಮುಂದುವರಿಸಿ!',
        passedMsg: 'ಈ ವಿಷಯದಲ್ಲಿ ನೀವು ತೇರ್ಗಡೆ ಆಗಿದ್ದೀರಿ! ಮುಂದಿನ ವಿಷಯ ತೆರೆಯಲಾಗಿದೆ.',
        failedMsg: 'ಪಾಸ್ ಆಗಲು 7/{total} ಬೇಕು. ಮತ್ತೆ ಓದಿ ಪ್ರಯತ್ನಿಸಿ.',
        outOf: 'ರಲ್ಲಿ', correct: 'ಸರಿ', wrong: 'ತಪ್ಪು', answerReview: 'ಉತ್ತರ ಪರಿಶೀಲನೆ',
        question: 'ಪ್ರಶ್ನೆ', score: 'ಸ್ಕೋರ್',
        focusWarningTitle: 'ಫೋಕಸ್ ಮೋಡ್ ಸಕ್ರಿಯ', focusWarningMsg: 'ಕ್ವಿಜ್ ಸಮಯದಲ್ಲಿ ಈ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಇರಿ!',
        contentGenerating: 'ವಿಷಯ ತಯಾರಾಗುತ್ತಿದೆ...',
        contentGeneratingDesc: 'AI ನಿಮ್ಮ ಕಲಿಕೆ ವಿಷಯ ತಯಾರಿಸುತ್ತಿದೆ',
        contentGeneratingNote: 'ಇದು ಒಂದು ನಿಮಿಷ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ. ಈಗಲೇ ಮಾಡಬಹುದು.',
        generateNow: 'ಈಗಲೇ ಮಾಡಿ', generating: 'ತಯಾರಿಸುತ್ತಿದೆ...', loadingContent: 'ವಿಷಯ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
        contentIn: 'ವಿಷಯ',
        attempts: 'ಪ್ರಯತ್ನಗಳು',
    },
    te: {
        explain: 'వివరించు', demonstrate: 'చూపించు', try: 'నేను ట్రై చేస్తా', test: 'నన్ను టెస్ట్ చెయ్', apply: 'అప్లై చెయ్',
        quizTime: 'క్విజ్ టైం! 🧠', testKnowledge: 'మీ నాలెడ్జ్ టెస్ట్ చేసుకోండి',
        questions: 'ప్రశ్నలు', passScore: 'పాస్ స్కోర్', focusMode: 'ఫోకస్ మోడ్',
        startQuiz: 'మొదలుపెట్టు', submitAnswer: 'జవాబు ఇవ్వు', nextQuestion: 'తదుపరి ప్రశ్న',
        seeResults: 'ఫలితాలు చూడు', tryAgain: 'మళ్ళీ ట్రై చెయ్', backToLearning: 'నేర్చుకోవడానికి తిరిగి',
        brilliant: '🎉 అద్భుతం!', keepGoing: '💪 ప్రయత్నం కొనసాగించు!',
        passedMsg: 'ఈ టాపిక్‌లో మీరు నేర్చుకున్నారు! తదుపరి టాపిక్ అన్‌లాక్ అయింది.',
        failedMsg: 'పాస్ కావాలంటే 7/{total} కావాలి. మళ్ళీ చదివి ట్రై చేయండి.',
        outOf: 'లో', correct: 'కరెక్ట్', wrong: 'తప్పు', answerReview: 'జవాబుల రివ్యూ',
        question: 'ప్రశ్న', score: 'స్కోర్',
        focusWarningTitle: 'ఫోకస్ మోడ్ ఆన్', focusWarningMsg: 'క్విజ్ లో ఈ ట్యాబ్ లోనే ఉండండి!',
        contentGenerating: 'కంటెంట్ తయారవుతోంది...',
        contentGeneratingDesc: 'AI మీ లెర్నింగ్ కంటెంట్ తయారు చేస్తోంది',
        contentGeneratingNote: 'ఒక నిమిషం పడుతుంది. ఇప్పుడే కూడా చేయవచ్చు.',
        generateNow: 'ఇప్పుడే చెయ్', generating: 'తయారవుతోంది...', loadingContent: 'కంటెంట్ లోడ్ అవుతోంది...',
        contentIn: 'కంటెంట్',
        attempts: 'ప్రయత్నాలు',
    },
};

const CenterPanel = forwardRef(function CenterPanel({ subject, currentTopicIdx, activeMode, setActiveMode, onQuizPass, language = 'en', languageName = 'English', onPdfLoadingChange }, ref) {
    const [content, setContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [contentError, setContentError] = useState('');
    const [generating, setGenerating] = useState(false);
    const [quizAttempt, setQuizAttempt] = useState(0);
    const [attemptHistory, setAttemptHistory] = useState([]);

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizState, setQuizState] = useState(null);
    const [focusWarning, setFocusWarning] = useState(false);

    // Translation helper
    const t = (key) => (UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en)[key] || UI_TRANSLATIONS.en[key] || key;
    const MODES = MODES_BASE.map(m => ({ ...m, label: t(m.key) }));

    const topic = subject?.topics?.[currentTopicIdx];
    const topicTitle = topic?.title || 'Getting Started';
    const topicId = topic?.id;
    const langName = languageName || LANG_NAME_FROM_CODE[language] || 'English';
    const [pdfLoading, setPdfLoading] = useState(false);

    // ── PDF Download (browser print – supports all languages) ──
    const handleDownloadPDF = useCallback(async () => {
        if (!topicId || pdfLoading) return;
        setPdfLoading(true);
        try {
            await generateTopicPdf({
                topicId,
                topicTitle,
                subjectName: subject?.name || 'Subject',
                langName,
            });
        } catch (err) {
        } finally {
            setPdfLoading(false);
        }
    }, [topicId, topicTitle, subject, langName, pdfLoading]);

    // Expose handleDownloadPDF to parent via ref
    useImperativeHandle(ref, () => ({
        handleDownloadPDF: () => handleDownloadPDF(),
    }), [handleDownloadPDF]);

    // Notify parent of pdfLoading state changes
    useEffect(() => {
        onPdfLoadingChange?.(pdfLoading);
    }, [pdfLoading, onPdfLoadingChange]);

    // ── Fetch content when topic/mode/language changes ──
    useEffect(() => {
        if (!topicId || activeMode === 'test') return;
        setQuizAttempt(0);
        setAttemptHistory([]);

        const fetchContent = async () => {
            setContentLoading(true);
            setContentError('');
            setContent(null);
            try {
                // Try selected language first
                let data = await apiFetch(`/api/content/${topicId}/${activeMode}?lang=${langName}`);
                // Fallback to English if not found in selected language
                if (!data?.content && langName !== 'English') {
                    data = await apiFetch(`/api/content/${topicId}/${activeMode}?lang=English`);
                }
                setContent(data?.content || null);
            } catch (err) {
                setContentError('Failed to load content.');
            } finally {
                setContentLoading(false);
            }
        };
        fetchContent();
    }, [topicId, activeMode, langName]);

    // ── Fetch quiz questions when entering test mode ──
    useEffect(() => {
        if (!topicId || activeMode !== 'test') return;

        const fetchQuiz = async () => {
            setQuizLoading(true);
            setQuizQuestions([]);
            try {
                // Try selected language first
                let data = await apiFetch(`/api/content/${topicId}/quiz?lang=${langName}`);
                // Fallback to English if no questions found
                if ((!data || data.length === 0) && langName !== 'English') {
                    data = await apiFetch(`/api/content/${topicId}/quiz?lang=English`);
                }
                setQuizQuestions(data || []);
            } catch (err) {
            } finally {
                setQuizLoading(false);
            }
        };
        fetchQuiz();
    }, [topicId, activeMode, langName]);

    // ── On-demand content generation ──
    const handleGenerate = useCallback(async () => {
        if (!topicId) return;
        setGenerating(true);
        setContentError('');
        try {
            await apiFetch(`/api/content/${topicId}/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    topicTitle,
                    subjectName: subject?.name || 'Subject',
                    language: langName
                })
            });
            // Refetch content after generation
            const data = await apiFetch(`/api/content/${topicId}/${activeMode}?lang=${langName}`);
            if (data?.content) setContent(data.content);

            // Also refetch quiz if we're on test mode
            if (activeMode === 'test') {
                const quiz = await apiFetch(`/api/content/${topicId}/quiz?lang=${langName}`);
                setQuizQuestions(quiz || []);
            }
        } catch (err) {
            setContentError('Content generation failed. Please try again.');
        } finally {
            setGenerating(false);
        }
    }, [topicId, topicTitle, subject, langName, activeMode]);

    // ── Focus mode — detect tab switch during quiz ──
    useEffect(() => {
        if (activeMode !== 'test' || !quizState || quizState.finished) return;
        const handleVisibility = () => {
            if (document.hidden) {
                setFocusWarning(true);
                setTimeout(() => setFocusWarning(false), 4000);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [activeMode, quizState]);

    // ── Quiz functions ──
    const startQuiz = useCallback(() => {
        if (!quizQuestions.length) return;
        const limited = quizQuestions.slice(0, 10);
        setQuizAttempt(prev => prev + 1);
        setQuizState({
            questions: limited,
            currentQ: 0,
            answers: [],
            selectedAnswer: null,
            showResult: false,
            finished: false,
            score: 0
        });
    }, [quizQuestions]);

    const selectAnswer = (idx) => {
        if (quizState?.showResult) return;
        setQuizState(prev => ({ ...prev, selectedAnswer: idx }));
    };

    const submitAnswer = () => {
        const q = quizState.questions[quizState.currentQ];
        const isCorrect = quizState.selectedAnswer === q.correct_index;
        const newAnswers = [...quizState.answers, { questionIdx: quizState.currentQ, selected: quizState.selectedAnswer, correct: q.correct_index, isCorrect }];
        setQuizState(prev => ({ ...prev, answers: newAnswers, showResult: true, score: prev.score + (isCorrect ? 1 : 0) }));
    };

    const nextQuestion = async () => {
        if (quizState.currentQ >= quizState.questions.length - 1) {
            const finalScore = quizState.score + (quizState.selectedAnswer === quizState.questions[quizState.currentQ].correct_index ? 0 : 0); // score already updated in submitAnswer
            const passed = quizState.score >= 7;
            setQuizState(prev => ({ ...prev, finished: true }));
            setAttemptHistory(prev => [...prev, { attempt: quizAttempt, score: quizState.score, total: quizState.questions.length, passed }]);

            // Save quiz result to backend
            if (topicId) {
                try {
                    await apiFetch(`/api/content/${topicId}/quiz-result`, {
                        method: 'POST',
                        body: JSON.stringify({ passed, score: quizState.score })
                    });
                } catch (err) {
                }
            }

            if (passed) onQuizPass(currentTopicIdx);
        } else {
            setQuizState(prev => ({ ...prev, currentQ: prev.currentQ + 1, selectedAnswer: null, showResult: false }));
        }
    };

    // ── Markdown renderer ──
    const renderMarkdown = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16, marginTop: i > 0 ? 32 : 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>{line.slice(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 10, marginTop: 28, color: 'var(--text-primary)', paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>{line.slice(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, marginTop: 20, color: 'var(--accent)' }}>{line.slice(4)}</h3>;
            if (line.startsWith('> ')) return (
                <div key={i} style={{ borderLeft: '4px solid var(--accent)', padding: '14px 20px', background: 'rgba(99,102,241,0.04)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', margin: '16px 0', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{renderInline(line.slice(2))}</div>
            );
            if (line.startsWith('```')) return null;
            if (line.startsWith('- ')) return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.3 }}>•</span>
                    <span>{renderInline(line.slice(2))}</span>
                </div>
            );
            if (line.match(/^\d+\.\s/)) {
                const num = line.match(/^(\d+)\./)[1];
                return (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', fontSize: '0.75rem', flexShrink: 0 }}>{num}</span>
                        <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
                    </div>
                );
            }
            if (line.trim() === '') return <div key={i} style={{ height: 12 }} />;
            return <p key={i} style={{ fontSize: '0.9375rem', lineHeight: 1.8, color: 'var(--text-primary)', margin: '4px 0' }}>{renderInline(line)}</p>;
        });
    };

    const renderInline = (text) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`|💡|🎯|🏢|🚀|📱|✅|❌|⚡|🔥|📝|🎓|💪|🌟|⭐|📌|🔑|💻|📊|🧠|🎯)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>{part.slice(1, -1)}</code>;
            return part;
        });
    };

    // ── "Not generated yet" UI ──
    const renderNotGenerated = () => (
        <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{
                width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Sparkles size={36} style={{ color: 'var(--accent)', opacity: 0.7 }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {t('contentGenerating')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
                {t('contentGeneratingDesc')} <strong>{langName}</strong>. {t('contentGeneratingNote')}
            </p>
            <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                    padding: '12px 32px', borderRadius: 30, fontWeight: 600, fontSize: '0.875rem',
                    background: generating ? 'var(--bg-secondary)' : 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                    color: generating ? 'var(--text-muted)' : 'white',
                    border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: generating ? 'none' : '0 4px 16px var(--accent-glow)',
                    transition: 'all 0.3s',
                }}
            >
                {generating ? (
                    <>
                        <div style={{ width: 16, height: 16, border: '2px solid var(--border-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        {t('generating')}
                    </>
                ) : (
                    <>
                        <Sparkles size={16} />
                        {t('generateNow')}
                    </>
                )}
            </button>
        </div>
    );

    // ── Loading spinner ──
    const renderLoading = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 }}>
            <div style={{
                width: 40, height: 40,
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('loadingContent')}</p>
        </div>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'relative' }}>
            {/* Focus Warning Toast */}
            {focusWarning && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
                    padding: '14px 28px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(249,115,22,0.95))',
                    color: 'white', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                    animation: 'slideUp 0.3s ease-out',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t('focusWarningTitle')}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{t('focusWarningMsg')}</div>
                    </div>
                </div>
            )}

            {/* Mode Tabs */}
            <div style={{
                display: 'flex', alignItems: 'center',
                padding: '6px 12px',
                borderBottom: '1px solid var(--border-color)', flexShrink: 0,
                background: 'transparent',
                gap: 2,
                overflowX: 'auto',
                scrollbarWidth: 'none',
            }}>
                {MODES.map(mode => {
                    const isActive = activeMode === mode.key;
                    return (
                        <button
                            key={mode.key}
                            onClick={() => { setActiveMode(mode.key); if (mode.key !== 'test') setQuizState(null); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 14px', borderRadius: 8,
                                fontSize: '0.8125rem', fontWeight: isActive ? 700 : 500,
                                border: 'none',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease', flexShrink: 0,
                                background: isActive ? `${mode.color}15` : 'transparent',
                                color: isActive ? mode.color : 'var(--text-muted)',
                                position: 'relative',
                            }}
                        >
                            <mode.icon size={14} />
                            {mode.label}
                            {isActive && (
                                <span style={{
                                    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                                    width: 20, height: 2.5, borderRadius: 2,
                                    background: mode.color,
                                }} />
                            )}
                        </button>
                    );
                })}


            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                {activeMode === 'test' ? (
                    /* ========== QUIZ INTERFACE ========== */
                    quizLoading ? renderLoading() :
                        !quizQuestions.length ? (
                            /* No quiz questions yet */
                            renderNotGenerated()
                        ) :
                            !quizState ? (
                                /* Quiz Start Screen */
                                <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 48 }}>
                                    <div style={{
                                        width: 100, height: 100, borderRadius: 28, margin: '0 auto 24px',
                                        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.08))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 8px 32px rgba(245,158,11,0.15)',
                                    }}>
                                        <ClipboardCheck size={44} style={{ color: '#f59e0b' }} />
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
                                        {t('quizTime')}
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 6, maxWidth: 440, margin: '0 auto 6px' }}>
                                        {t('testKnowledge')} <strong style={{ color: 'var(--accent)' }}>{topicTitle}</strong>
                                    </p>

                                    {/* Quiz Info Cards */}
                                    <div style={{
                                        display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0 32px',
                                        flexWrap: 'wrap',
                                    }}>
                                        {[
                                            { label: t('questions'), value: `${Math.min(quizQuestions.length, 10)}`, icon: '📝' },
                                            { label: t('passScore'), value: '7/10', icon: '🎯' },
                                            { label: t('focusMode'), value: 'ON', icon: '🔒' },
                                            ...(quizAttempt > 0 ? [{ label: t('attempts') || 'Attempts', value: `${quizAttempt}`, icon: '🔄' }] : []),
                                        ].map((info, i) => (
                                            <div key={i} style={{
                                                padding: '16px 24px', borderRadius: 'var(--radius-md)',
                                                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                                textAlign: 'center', minWidth: 110,
                                            }}>
                                                <div style={{ fontSize: '1.25rem', marginBottom: 6 }}>{info.icon}</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{info.value}</div>
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>{info.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={startQuiz}
                                        style={{
                                            padding: '14px 40px', fontSize: '1rem', fontWeight: 700, borderRadius: 30,
                                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                            color: 'white', border: 'none', cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
                                            transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 10,
                                        }}
                                    >
                                        <ClipboardCheck size={20} />
                                        {t('startQuiz')}
                                    </button>
                                </div>
                            ) : quizState.finished ? (
                                /* Quiz Results */
                                <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 32 }}>
                                    {/* Attempt Badge */}
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '4px 14px', borderRadius: 20, marginBottom: 16,
                                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
                                    }}>
                                        🔄 {t('attempts') || 'Attempt'}: {quizAttempt}
                                    </div>
                                    {/* Score Circle */}
                                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 24px' }}>
                                        <svg width={120} height={120} viewBox="0 0 120 120">
                                            <circle cx={60} cy={60} r={50} fill="none" stroke="var(--border-color)" strokeWidth={8} />
                                            <circle cx={60} cy={60} r={50} fill="none"
                                                stroke={quizState.score >= 7 ? '#10b981' : '#ef4444'}
                                                strokeWidth={8} strokeLinecap="round"
                                                strokeDasharray={`${(quizState.score / 10) * 314} 314`}
                                                transform="rotate(-90 60 60)"
                                                style={{ transition: 'stroke-dasharray 1s ease' }}
                                            />
                                        </svg>
                                        <div style={{
                                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{ fontSize: '2rem', fontWeight: 800, color: quizState.score >= 7 ? '#10b981' : '#ef4444' }}>
                                                {quizState.score}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('outOf')} {quizState.questions.length}</span>
                                        </div>
                                    </div>

                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6, color: quizState.score >= 7 ? '#10b981' : '#ef4444' }}>
                                        {quizState.score >= 7 ? t('brilliant') : t('keepGoing')}
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                                        {quizState.score >= 7
                                            ? t('passedMsg')
                                            : t('failedMsg').replace('{total}', quizState.questions.length)}
                                    </p>

                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                                        <button onClick={startQuiz} style={{
                                            padding: '12px 28px', borderRadius: 30, fontWeight: 600, fontSize: '0.875rem',
                                            background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white',
                                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                                        }}>
                                            <RotateCcw size={16} /> {t('tryAgain')}
                                        </button>
                                        <button onClick={() => { setActiveMode('explain'); setQuizState(null); }} className="btn-secondary"
                                            style={{ borderRadius: 30, padding: '12px 28px' }}>
                                            {t('backToLearning')}
                                        </button>
                                    </div>

                                    {/* Previous Attempts */}
                                    {attemptHistory.length > 0 && (
                                        <div style={{ maxWidth: 560, margin: '0 auto 24px', textAlign: 'left' }}>
                                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {t('attempts') || 'Attempts'}
                                            </h3>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {attemptHistory.map((a, i) => (
                                                    <div key={i} style={{
                                                        padding: '8px 16px', borderRadius: 'var(--radius-md)',
                                                        background: a.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                                                        border: `1px solid ${a.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
                                                        fontSize: '0.75rem', fontWeight: 600,
                                                        color: a.passed ? '#10b981' : '#ef4444',
                                                    }}>
                                                        #{a.attempt}: {a.score}/{a.total} {a.passed ? '✅' : '❌'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Answer Review Grid */}
                                    <div style={{ textAlign: 'left', maxWidth: 560, margin: '0 auto' }}>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {t('answerReview')}
                                        </h3>
                                        <div style={{ display: 'grid', gap: 6 }}>
                                            {quizState.answers.map((a, i) => (
                                                <div key={i} style={{
                                                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                                    background: a.isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                                    border: `1px solid ${a.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        {a.isCorrect ? <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} /> : <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', flex: 1 }}>Q{i + 1}: {quizState.questions[i].question}</span>
                                                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: a.isCorrect ? '#10b981' : '#ef4444' }}>{a.isCorrect ? t('correct') : t('wrong')}</span>
                                                    </div>
                                                    {!a.isCorrect && (
                                                        <div style={{
                                                            marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.1)',
                                                            display: 'flex', gap: 8, fontSize: '0.75rem',
                                                        }}>
                                                            <span style={{ color: '#ef4444' }}>✗ {quizState.questions[i].options[a.selected]}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                            <span style={{ color: '#10b981', fontWeight: 600 }}>✓ {quizState.questions[i].options[a.correct]}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Active Quiz Question */
                                <div className="animate-fade-in" key={quizState.currentQ}>
                                    {/* Top Bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{
                                            padding: '6px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.1)',
                                            fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b',
                                        }}>
                                            {t('question')} {quizState.currentQ + 1} / {quizState.questions.length}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.08)',
                                            fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
                                        }}>
                                            {t('score')}: {quizState.score}/{quizState.currentQ + (quizState.showResult ? 1 : 0)}
                                        </div>
                                    </div>

                                    {/* Progress Dots */}
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
                                        {quizState.questions.map((_, i) => (
                                            <div key={i} style={{
                                                flex: 1, height: 4, borderRadius: 2,
                                                background: i < quizState.currentQ
                                                    ? (quizState.answers[i]?.isCorrect ? '#10b981' : '#ef4444')
                                                    : i === quizState.currentQ ? 'var(--accent)' : 'var(--bg-secondary)',
                                                transition: 'all 0.3s',
                                            }} />
                                        ))}
                                    </div>

                                    {/* Question */}
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.5 }}>
                                        {quizState.questions[quizState.currentQ].question}
                                    </h3>

                                    {/* Options */}
                                    <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
                                        {quizState.questions[quizState.currentQ].options.map((opt, idx) => {
                                            const isSelected = quizState.selectedAnswer === idx;
                                            const isCorrectAnswer = quizState.questions[quizState.currentQ].correct_index === idx;
                                            const showingResult = quizState.showResult;

                                            let bg = 'var(--bg-card)';
                                            let border = 'var(--border-color)';

                                            if (showingResult && isCorrectAnswer) { bg = 'rgba(16,185,129,0.08)'; border = '#10b981'; }
                                            else if (showingResult && isSelected && !isCorrectAnswer) { bg = 'rgba(239,68,68,0.08)'; border = '#ef4444'; }
                                            else if (isSelected) { bg = 'rgba(99,102,241,0.08)'; border = 'var(--accent)'; }

                                            return (
                                                <button key={idx} onClick={() => selectAnswer(idx)} disabled={showingResult}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        padding: '16px 20px', borderRadius: 'var(--radius-md)',
                                                        background: bg, border: `2px solid ${border}`,
                                                        cursor: showingResult ? 'default' : 'pointer',
                                                        transition: 'all 0.2s', textAlign: 'left',
                                                        fontSize: '0.9375rem', color: 'var(--text-primary)', width: '100%',
                                                    }}
                                                >
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                        fontWeight: 700, fontSize: '0.8125rem',
                                                        background: isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                                                        color: isSelected ? 'white' : 'var(--text-muted)',
                                                        transition: 'all 0.2s',
                                                    }}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                    <span style={{ flex: 1 }}>{opt}</span>
                                                    {showingResult && isCorrectAnswer && <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />}
                                                    {showingResult && isSelected && !isCorrectAnswer && <XCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Action Button */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        {!quizState.showResult ? (
                                            <button disabled={quizState.selectedAnswer === null} onClick={submitAnswer}
                                                style={{
                                                    padding: '12px 32px', borderRadius: 30, fontWeight: 600, fontSize: '0.875rem',
                                                    background: quizState.selectedAnswer !== null ? 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' : 'var(--bg-secondary)',
                                                    color: quizState.selectedAnswer !== null ? 'white' : 'var(--text-muted)',
                                                    border: 'none', cursor: quizState.selectedAnswer !== null ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 8,
                                                    boxShadow: quizState.selectedAnswer !== null ? '0 4px 16px var(--accent-glow)' : 'none',
                                                }}>
                                                {t('submitAnswer')} <ChevronRight size={16} />
                                            </button>
                                        ) : (
                                            <button onClick={nextQuestion}
                                                style={{
                                                    padding: '12px 32px', borderRadius: 30, fontWeight: 600, fontSize: '0.875rem',
                                                    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                                                    color: 'white', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    boxShadow: '0 4px 16px var(--accent-glow)',
                                                }}>
                                                {quizState.currentQ >= quizState.questions.length - 1 ? t('seeResults') : t('nextQuestion')}
                                                <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                ) : (
                    /* ========== LEARNING CONTENT ========== */
                    contentLoading ? renderLoading() :
                        !content ? renderNotGenerated() :
                            <div className="animate-fade-in" key={`${activeMode}-${language}`}>
                                {/* Language indicator */}
                                {language !== 'en' && (
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '6px 14px', borderRadius: 20, marginBottom: 20,
                                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                                        fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500,
                                    }}>
                                        <Languages size={12} />
                                        {t('contentIn')} {langName}
                                    </div>
                                )}
                                {renderMarkdown(content)}
                            </div>
                )}
            </div>
        </div>
    );
});

export default CenterPanel;
