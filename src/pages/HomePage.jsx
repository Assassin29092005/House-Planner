import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import TemplatePreview from '../components/TemplatePreview';
import { RevealOnScroll } from '../hooks/useScrollReveal.jsx';

const TMETA = {
  studio:  { area: '500 sq ft',  desc: 'Open-plan living with kitchenette and bath' },
  '1bhk':  { area: '750 sq ft',  desc: 'Bedroom, living, kitchen, and bathroom' },
  '2bhk':  { area: '1,200 sq ft', desc: 'Two bedrooms, two baths, living and dining' },
  '3bhk':  { area: '1,750 sq ft', desc: 'Two-floor villa with 3 bedrooms and guest bath', tag: '2 FLOOR' },
  '4bhk':  { area: '2,400 sq ft', desc: 'Study, ensuite master, 4 beds, open kitchen', tag: 'PREMIUM' },
};

const HouseMark = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 10L12 4L20 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <rect x="4" y="10" width="16" height="11" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
    <rect x="9.5" y="15" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

/* Small feature icons */
const FeatureIcon = ({ type }) => {
  const icons = {
    editor: <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" /><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.3" /><line x1="9" y1="9" x2="9" y2="21" stroke="currentColor" strokeWidth="1.3" /></>,
    cube: <><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M12 12L3 7" stroke="currentColor" strokeWidth="1.3" /><path d="M12 12V22" stroke="currentColor" strokeWidth="1.3" /><path d="M12 12L21 7" stroke="currentColor" strokeWidth="1.3" /></>,
    layers: <><rect x="4" y="12" width="16" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="6" y="8" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8" y="4" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /></>,
    cloud: <><path d="M18 15C20.2 15 22 13.2 22 11C22 9.1 20.7 7.5 18.9 7.1C18.4 4.2 15.9 2 13 2C10.5 2 8.4 3.6 7.5 5.8C4.9 6.2 3 8.3 3 11C3 13.2 4.8 15 7 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M12 12V21M12 21L9 18M12 21L15 18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></>,
    export: <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M8 12L12 16L16 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>,
    template: <><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{icons[type]}</svg>;
};

const HomePage = ({ user }) => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) root.style.overflow = 'auto';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) root.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const goEditor = (key) => navigate(`/editor?template=${key}`);
  const goStart  = () => navigate(user ? '/editor' : '/signup');

  return (
    <div className="min-h-screen hp-page hp-grain">

      {/* ───── NAV ───── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'backdrop-blur-xl' : ''
        }`}
        style={{
          background: scrolled ? 'rgba(9,9,11,0.88)' : 'transparent',
          borderBottom: `1px solid ${scrolled ? 'var(--hp-border)' : 'transparent'}`,
        }}
      >
        <div className="max-w-[1100px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" style={{ color: 'var(--hp-text)' }}>
            <HouseMark className="transition-transform duration-300 group-hover:rotate-6" />
            <span className="text-[15px] font-medium tracking-[-0.02em]">House Planner</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px]">
            <a href="#templates" className="hover:text-[var(--hp-text)] transition-colors duration-300">Templates</a>
            <a href="#features" className="hover:text-[var(--hp-text)] transition-colors duration-300">Features</a>
            <a href="#how" className="hover:text-[var(--hp-text)] transition-colors duration-300">How it works</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="hp-btn hp-btn-outline h-9 px-5 text-[13px]">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-[13px] font-medium px-3 hover:text-[var(--hp-text)] transition-colors duration-300">
                  Log in
                </Link>
                <Link to="/signup" className="hp-btn hp-btn-accent h-9 px-5 text-[13px]">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="pt-36 pb-20 sm:pt-44 sm:pb-28 px-6">
        <div className="max-w-[1100px] mx-auto grid lg:grid-cols-[1fr_360px] gap-20 items-center">
          <div>
            <div className="hp-s1 text-[11px] font-semibold uppercase tracking-[0.22em] mb-7" style={{ color: 'var(--hp-accent)' }}>
              Floor plan editor
            </div>
            <h1 className="hp-s2 hp-serif leading-[1.06] tracking-[-0.02em] mb-7" style={{ color: 'var(--hp-text)', fontSize: 'clamp(2.6rem, 5.8vw, 4.2rem)' }}>
              Draw plans.{' '}
              <span style={{ color: 'var(--hp-muted)' }}>See them built.</span>
            </h1>
            <p className="hp-s3 text-[16px] leading-[1.75] max-w-[440px] mb-10">
              Sketch 2D floor plans with snapping and room detection.
              Watch your layout render in textured 3D&nbsp;&mdash; then walk through it.
            </p>
            <div className="hp-s4 flex flex-wrap items-center gap-3">
              <button onClick={goStart} className="hp-btn hp-btn-white h-[46px] px-8">
                Start a project
              </button>
              <a href="#templates" className="hp-btn hp-btn-outline h-[46px] px-6">
                See templates <span className="text-[10px] opacity-50">&#8595;</span>
              </a>
            </div>
          </div>

          {/* Architectural wireframe */}
          <div className="hidden lg:block hp-s3 select-none" aria-hidden="true">
            <svg viewBox="0 0 380 340" fill="none" style={{ width: '100%', opacity: 0.13 }}>
              <g stroke="var(--hp-text)" strokeWidth="0.7">
                <path d="M190 260 L40 185 L40 110 L190 35 L340 110 L340 185 Z" />
                <path d="M190 35 L40 110 L190 75 L340 110 Z" />
                <path d="M190 35 L190 75" />
                <path d="M40 148 L190 228 L340 148" strokeDasharray="4 4" />
                <rect x="165" y="225" width="26" height="35" rx="1" />
                <rect x="78" y="132" width="22" height="18" rx="1" />
                <rect x="268" y="132" width="22" height="18" rx="1" />
                <rect x="78" y="178" width="22" height="18" rx="1" />
                <rect x="268" y="178" width="22" height="18" rx="1" />
                <line x1="130" y1="72" x2="130" y2="94" strokeDasharray="2 3" />
                <line x1="160" y1="60" x2="160" y2="84" strokeDasharray="2 3" />
                <line x1="220" y1="60" x2="220" y2="84" strokeDasharray="2 3" />
                <line x1="250" y1="72" x2="250" y2="94" strokeDasharray="2 3" />
              </g>
              <g stroke="var(--hp-accent)" strokeWidth="0.5" opacity="0.4">
                <line x1="28" y1="110" x2="28" y2="185" />
                <line x1="23" y1="110" x2="33" y2="110" />
                <line x1="23" y1="185" x2="33" y2="185" />
                <line x1="40" y1="272" x2="190" y2="272" />
                <line x1="40" y1="267" x2="40" y2="277" />
                <line x1="190" y1="267" x2="190" y2="277" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-6"><div className="hp-rule" /></div>

      {/* ───── TEMPLATES ───── */}
      <section id="templates" className="py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <RevealOnScroll>
            <div className="flex items-end justify-between mb-14">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--hp-accent)' }}>
                  Templates
                </div>
                <h2 className="hp-serif tracking-[-0.02em]" style={{ color: 'var(--hp-text)', fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)' }}>
                  Start from a proven layout
                </h2>
              </div>
              <button onClick={goStart} className="hidden sm:flex items-center gap-1.5 text-[13px] hover:text-[var(--hp-text)] transition-colors duration-300">
                Or start blank <span className="text-[11px]">&rarr;</span>
              </button>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(TEMPLATES).map(([key, tmpl], i) => {
              const m = TMETA[key];
              const floors = tmpl.floors || [{ walls: tmpl.walls }];
              const wc = floors.reduce((s, f) => s + (f.walls || []).length, 0);
              return (
                <RevealOnScroll key={key} delay={i * 70} direction="tilt">
                  <div onClick={() => goEditor(key)} className="group hp-card rounded-lg cursor-pointer">
                    <div className="h-[168px] flex items-center justify-center p-6" style={{ background: 'var(--hp-surface)' }}>
                      <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.05]">
                        <TemplatePreview template={tmpl} />
                      </div>
                      {m.tag && (
                        <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded"
                          style={{ color: 'var(--hp-accent)', background: 'var(--hp-accent-soft)', border: '1px solid rgba(129,140,248,0.12)' }}>
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-[15px] font-medium mb-1.5 transition-colors duration-300" style={{ color: 'var(--hp-text)' }}>
                        {tmpl.name}
                      </h3>
                      <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: 'var(--hp-muted)' }}>{m.desc}</p>
                      <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: 'var(--hp-muted)' }}>
                        <span>{m.area}</span>
                        <span className="inline-block w-px h-[10px]" style={{ background: 'var(--hp-border)' }} />
                        <span>{wc} walls</span>
                        <span className="inline-block w-px h-[10px]" style={{ background: 'var(--hp-border)' }} />
                        <span>{tmpl.floors ? `${tmpl.floors.length} floors` : '1 floor'}</span>
                        <span className="ml-auto text-[11px] opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                          style={{ color: 'var(--hp-accent)' }}>
                          Open &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          <div className="sm:hidden mt-8">
            <button onClick={goStart} className="text-[13px] hover:text-[var(--hp-text)] transition-colors">
              Or start blank &rarr;
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-6"><div className="hp-rule" /></div>

      {/* ───── FEATURES ───── */}
      <section id="features" className="py-24 sm:py-32 px-6" style={{ background: 'var(--hp-surface)' }}>
        <div className="max-w-[1100px] mx-auto">
          <RevealOnScroll>
            <div className="mb-14">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--hp-accent)' }}>
                Capabilities
              </div>
              <h2 className="hp-serif tracking-[-0.02em]" style={{ color: 'var(--hp-text)', fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)' }}>
                Everything you need to design
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: 'editor',   title: '2D Editor',   text: 'Draw walls with angle snapping, place doors and windows, drag in furniture. Rooms auto-detected with area measurement.' },
              { icon: 'cube',     title: '3D Preview',  text: 'Textured walls, real furniture, day & night lighting. Walk through your design in first person.' },
              { icon: 'layers',   title: 'Multi-floor', text: 'Stack floors with structural checks. Stairs connect levels in the 3D view automatically.' },
              { icon: 'cloud',    title: 'Cloud Save',  text: 'Projects saved to your account. Access from anywhere and pick up where you left off.' },
              { icon: 'export',   title: 'Export',      text: 'Download PNG renders, a PDF wall schedule, or raw JSON data for custom integrations.' },
              { icon: 'template', title: 'Templates',   text: 'Studio to 4-BHK villa. Every template is fully editable after loading.' },
            ].map((f, i) => (
              <RevealOnScroll key={i} delay={i * 60} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="hp-card rounded-lg p-7 h-full" style={{ background: 'var(--hp-card)' }}>
                  <div className="mb-4" style={{ color: 'var(--hp-accent)' }}>
                    <FeatureIcon type={f.icon} />
                  </div>
                  <div className="text-[14px] font-semibold mb-2" style={{ color: 'var(--hp-text)' }}>{f.title}</div>
                  <p className="text-[13px] leading-[1.65]">{f.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-6"><div className="hp-rule" /></div>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how" className="py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <RevealOnScroll>
            <div className="mb-16">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--hp-accent)' }}>
                Process
              </div>
              <h2 className="hp-serif tracking-[-0.02em]" style={{ color: 'var(--hp-text)', fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)' }}>
                Three steps to your floor plan
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-3 gap-14 sm:gap-8 relative">
            <div className="hidden sm:block absolute top-[32px] left-[16.67%] right-[16.67%] h-px" style={{ background: 'var(--hp-border)' }} />

            {[
              { n: '01', title: 'Pick a starting point', desc: 'Choose a template or set custom site dimensions. Select feet or meters.' },
              { n: '02', title: 'Design the layout',     desc: 'Draw walls, place furniture, add openings. Rooms are detected and labeled automatically.' },
              { n: '03', title: 'Review and export',      desc: 'Switch to 3D, walk through it, estimate costs. Save to cloud or download files.' },
            ].map((s, i) => (
              <RevealOnScroll key={i} delay={i * 120} direction="scale">
                <div className="relative">
                  <div className="hp-step-num mb-5">{s.n}</div>
                  <div className="text-[15px] font-semibold mb-2" style={{ color: 'var(--hp-text)' }}>{s.title}</div>
                  <p className="text-[13px] leading-[1.65]">{s.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-24 sm:py-32 px-6" style={{ background: 'var(--hp-surface)' }}>
        <RevealOnScroll direction="scale">
          <div className="max-w-[560px] mx-auto text-center">
            <h2 className="hp-serif tracking-[-0.02em] mb-5" style={{ color: 'var(--hp-text)', fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)' }}>
              Start planning today
            </h2>
            <p className="text-[15px] leading-[1.7] mb-10 max-w-[400px] mx-auto">
              No download, no paywall. Open the editor and start drawing your floor plan.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={goStart} className="hp-btn hp-btn-white h-[46px] px-8">
                Open editor
              </button>
              {!user && (
                <Link to="/login" className="text-[13px] font-medium transition-colors duration-300" style={{ color: 'var(--hp-accent)' }}>
                  or sign in
                </Link>
              )}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid var(--hp-border)' }}>
        <div className="max-w-[1100px] mx-auto flex items-center justify-between" style={{ color: 'var(--hp-muted)' }}>
          <div className="flex items-center gap-2">
            <HouseMark size={14} />
            <span className="text-[12px]">House Planner</span>
          </div>
          <span className="text-[11px]">&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
