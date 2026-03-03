'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

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

function useRepeatingTypewriter(text, startCondition, typingSpeed = 150, deletingSpeed = 100, delay = 3000) {
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (startCondition && !hasStarted) {
      const t = setTimeout(() => setHasStarted(true), 100);
      return () => clearTimeout(t);
    }
  }, [startCondition, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let timeout;
    if (isDeleting) {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(prev => prev.slice(0, -1));
        }, deletingSpeed);
      } else {
        timeout = setTimeout(() => setIsDeleting(false), 500);
      }
    } else {
      if (displayed.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayed(text.slice(0, displayed.length + 1));
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, text, typingSpeed, deletingSpeed, delay, hasStarted]);

  return { displayed, isBlinking: displayed.length === text.length && !isDeleting };
}

function useInView(options) {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options?.triggerOnce) observer.disconnect();
      } else if (!options?.triggerOnce) {
        setInView(false);
      }
    }, { threshold: options?.threshold || 0.1 });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, inView];
}

function FadeInSection({ children, delay = 0 }) {
  const [setRef, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <div ref={setRef} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      // ensure it takes full height if in flex
      height: '100%'
    }}>
      {children}
    </div>
  );
}
import {
  Sparkles,
  Brain,
  BookOpen,
  FileText,
  ArrowRight,
  Zap,
  Target,
  BarChart
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // using true for startCondition to start immediately
  const { displayed: typedHeadline, isBlinking } = useRepeatingTypewriter('Unlock Your Potential with AuraLab', true, 100, 80, 3000);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between fixed z-50 px-3 md:px-6 py-3 w-[calc(100%-24px)] md:w-[calc(100%-48px)] max-w-[1200px]"
        style={{
          margin: '12px auto md:24px auto',
          top: 0,
          left: 0,
          right: 0,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="AuraLab" className="w-8 h-8 md:w-10 md:h-10 rounded-[8px] md:rounded-[10px] object-cover" />
          <span className="gradient-text text-xl md:text-[1.75rem]" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            AuraLab
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {loading ? (
            <div className="animate-pulse" style={{ width: 100, height: 36, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }} />
          ) : user ? (
            <Link href="/dashboard" className="btn-primary text-xs md:text-base px-3 py-2 md:px-5 md:py-2.5" style={{ textDecoration: 'none' }}>
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-xs md:text-base px-3 py-2 md:px-6 md:py-2.5" style={{ textDecoration: 'none' }}>
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-xs md:text-base px-3 py-2 md:px-6 md:py-2.5" style={{ textDecoration: 'none' }}>
                Get Started <span className="hidden sm:inline">Start</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>

        {/* Hero Section */}
        <section style={{
          position: 'relative',
          padding: '160px 24px 80px',
          textAlign: 'center',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '90vh',
        }}>
          {/* Background video rendering moved to root layout */}
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, position: 'relative', zIndex: 1, width: '100%' }}>
            {/* Left Column: Text */}
            <div className="animate-fade-in" style={{ flex: 1, textAlign: 'left' }}>
              <h1 style={{
                fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: 24,
                minHeight: '3.3em', // Ensure height stays consistent across line wraps
              }}>
                <span dangerouslySetInnerHTML={{
                  __html: typedHeadline.replace('AuraLab', '<span class="gradient-text">AuraLab</span>')
                }} />
                <span style={{
                  borderRight: '4px solid var(--accent)',
                  paddingRight: 4,
                  opacity: isBlinking ? 1 : 0.8,
                }} className={isBlinking ? "animate-pulse" : ""}></span>
              </h1>


              <p style={{
                fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                color: 'var(--text-secondary)',
                marginBottom: 48,
                lineHeight: 1.6,
                maxWidth: 480,
              }}>
                Experience a new way to learn. Get custom-tailored coursework, real-time feedback, and dynamic study materials instantly.
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link href="/signup" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.125rem', textDecoration: 'none', borderRadius: '100px' }}>
                  Start Learning For Free
                </Link>
                <Link href="/login" className="btn-secondary" style={{ padding: '16px 36px', fontSize: '1.125rem', textDecoration: 'none', borderRadius: '100px' }}>
                  Log In
                </Link>
              </div>
            </div>

            {/* Right Column: Graphic */}
            <div className="animate-fade-in hidden md:block" style={{ flex: 1, position: 'relative', minHeight: 400 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
                borderRadius: 24,
                border: '1px solid var(--border-color)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
                padding: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'perspective(1000px) rotateY(-5deg) translateY(-10px)',
                transition: 'transform 0.5s ease',
              }}
                onMouseOver={e => e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) translateY(0px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'perspective(1000px) rotateY(-5deg) translateY(-10px)'}
              >
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Mock UI Element 1 */}
                  <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '60%', height: 12, background: 'var(--text-primary)', borderRadius: 6, marginBottom: 8 }} />
                      <div style={{ width: '40%', height: 8, background: 'var(--text-muted)', borderRadius: 4 }} />
                    </div>
                  </div>
                  {/* Mock UI Element 2 */}
                  <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', gap: 16, alignItems: 'center', marginLeft: 32 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '80%', height: 12, background: 'var(--text-primary)', borderRadius: 6, marginBottom: 8 }} />
                      <div style={{ width: '30%', height: 8, background: 'var(--text-muted)', borderRadius: 4 }} />
                    </div>
                  </div>
                  {/* Mock UI Element 3 */}
                  <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '50%', height: 12, background: 'var(--text-primary)', borderRadius: 6, marginBottom: 8 }} />
                      <div style={{ width: '70%', height: 8, background: 'var(--text-muted)', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ position: 'relative', padding: '80px 24px', background: 'transparent' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 16 }}>Everything you need to excel</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Powerful AI tools designed to accelerate your understanding.</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {[
                { icon: Brain, title: 'Personalized Curriculums', desc: 'AI generates a structured, step-by-step learning path tailored specifically to your chosen topic and current expertise level.' },
                { icon: BookOpen, title: 'Interactive Lessons', desc: 'Engage with topics deeply through an AI tutor that explains complex concepts, answers questions, and adapts to your style.' },
                { icon: Target, title: 'Smart Quizzing', desc: 'Test your knowledge with auto-generated quizzes. Get instant feedback and identify areas where you need more practice.' },
                { icon: FileText, title: 'Document Analysis', desc: 'Upload PDFs or images and instantly extract key information, generate summaries, or create study guides.' },
                { icon: Zap, title: 'Instant Explanations', desc: 'Stuck on a concept? Get quick, clear explanations and examples on demand without losing your context.' },
                { icon: BarChart, title: 'Progress Tracking', desc: 'Visualize your learning journey. Keep your streak alive, track completed modules, and watch your expertise grow.' },
              ].map((feature, i) => (
                <FadeInSection key={i} delay={i * 0.1}>
                  <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(99,102,241,0.1)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <feature.icon size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{feature.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: 64 }}>
              How AuraLab Works
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
              {[
                { step: 1, title: 'Tell us your goals', desc: 'Sign up and share what you want to learn. Whether it\'s Python programming or Renaissance history, AuraLab is ready.' },
                { step: 2, title: 'Get your custom path', desc: 'Our AI instantly generates a comprehensive curriculum broken down into manageable, logical modules.' },
                { step: 3, title: 'Learn and interact', desc: 'Dive into interactive chat-based lessons, take quizzes, and master the material at your own pace.' },
              ].map((item, i) => (
                <FadeInSection key={i} delay={i * 0.2}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    <div style={{
                      minWidth: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', fontWeight: 700, boxShadow: '0 4px 16px var(--accent-glow)'
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>



      </main>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        background: 'transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="AuraLab" style={{ width: 24, height: 24, borderRadius: 6, opacity: 0.8 }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>AuraLab © {new Date().getFullYear()}</span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Login</Link>
          <Link href="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</Link>
          <Link href="mailto:support@auralab.com" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
        </div>
      </footer>
    </div >
  );
}
