const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Preloader ────────────────────────────────────────────────
(function initPreloader() {
  let progress = 0;
  const fill = document.getElementById("loader-fill");
  const step = () => {
    progress += (100 - progress) * 0.08;
    if (fill) fill.style.width = Math.min(progress, 95) + "%";
    if (progress < 95) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  window.__finishPreloader = () => {
    if (fill) fill.style.width = "100%";
    setTimeout(() => {
      const el = document.getElementById("preloader");
      if (el) el.classList.add("done");
    }, 300);
  };
})();

// ─── Cursor Follower (desktop only) ──────────────────────────
(function initCursor() {
  const glow = document.getElementById("cursor-glow");
  const dot = document.getElementById("cursor-dot");
  if (!glow || !dot) return;
  if (window.matchMedia("(hover: none)").matches) return;

  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
    if (!dot.classList.contains("visible")) {
      dot.classList.add("visible");
      glow.classList.add("visible");
    }
  }, { passive: true });

  const lerp = (a, b, t) => a + (b - a) * t;
  const tick = () => {
    gx = lerp(gx, mx, 0.15);
    gy = lerp(gy, my, 0.15);
    glow.style.left = gx + "px";
    glow.style.top = gy + "px";
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("a, button, .project-card, .skill-card, .marquee-card, .glass");
    if (t) glow.classList.add("hover");
  }, { passive: true });
  document.addEventListener("mouseout", (e) => {
    const t = e.target.closest("a, button, .project-card, .skill-card, .marquee-card, .glass");
    if (t) glow.classList.remove("hover");
  }, { passive: true });
})();

// ─── Helpers ───────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          requestAnimationFrame(() => e.target.classList.add("in"));
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useCountUp(target, start) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let r;
    const t0 = performance.now();
    const dur = 1200;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(eased * target));
      if (p < 1) r = requestAnimationFrame(step);
    };
    r = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r);
  }, [start, target]);
  return v;
}

function useTypewriter(strings, isRTL) {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [phase, setPhase] = useState("type");
  useEffect(() => { setTxt(""); setPhase("type"); setIdx(0); }, [isRTL]);
  useEffect(() => {
    const cur = strings[idx];
    let t;
    if (phase === "type") {
      if (txt.length < cur.length) {
        t = setTimeout(() => setTxt(cur.slice(0, txt.length + 1)), 55);
      } else {
        t = setTimeout(() => setPhase("hold"), 1400);
      }
    } else if (phase === "hold") {
      t = setTimeout(() => setPhase("delete"), 200);
    } else {
      if (txt.length > 0) {
        t = setTimeout(() => setTxt(cur.slice(0, txt.length - 1)), 28);
      } else {
        setIdx((i) => (i + 1) % strings.length);
        setPhase("type");
      }
    }
    return () => clearTimeout(t);
  }, [txt, phase, idx, strings]);
  return txt;
}

// ─── ScrollProgress ────────────────────────────────────────────
function ScrollProgress() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div id="scroll-progress" style={{ width: `${width}%` }} aria-hidden="true" />;
}

// ─── FloatingParticles (optimized — 10 instead of 18) ─────────
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: ((i * 9.2 + 5) % 90) + 5,
      size: 1.8 + (i % 3) * 1.2,
      duration: 22 + (i * 3.1 + 1) % 18,
      delay: -((i * 2.5 + 0.3) % 16),
      opacity: 0.15 + (i % 5) * 0.07,
    })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <span key={p.id} className="particle" style={{
          left: `${p.left}%`,
          bottom: '-8px',
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          opacity: p.opacity,
        }} />
      ))}
    </div>
  );
}

// ─── BackToTop ─────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const on = () => setVisible(window.scrollY > 420);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button id="back-to-top" className={visible ? "visible" : ""}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top">
      <I.ChevronUp size={20} />
    </button>
  );
}

// ─── Section shell ─────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="reveal mb-12 md:mb-16">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[11px] tracking-[0.2em] text-sky-400/80 uppercase">{eyebrow}</span>
        <span className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-sky-400/40 to-transparent"></span>
      </div>
      <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-white leading-[1.05]">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-400 text-base md:text-lg max-w-2xl">{subtitle}</p>}
    </div>
  );
}

// ─── useActiveSection (scroll spy) ────────────────────────────
function useActiveSection(sectionIds) {
  const [active, setActive] = useState("home");
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { threshold: 0.2, rootMargin: "-70px 0px -40% 0px" });
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sectionIds]);
  return active;
}

// ─── Nav ───────────────────────────────────────────────────────
const NAV_SECTIONS = ["home", "about", "work", "skills", "credentials", "contact"];

function Nav({ onLink, lang, onLangToggle }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(NAV_SECTIONS);
  const t = CONTENT[lang].nav;
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [
    { k: "home",        l: t.home },
    { k: "about",       l: t.about },
    { k: "work",        l: t.work },
    { k: "skills",      l: t.skills },
    { k: "credentials", l: t.creds },
    { k: "contact",     l: t.contact },
  ];

  // Ripple effect for buttons
  const onBtnEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ripple-x", ((e.clientX - r.left) / r.width * 100) + "%");
    e.currentTarget.style.setProperty("--ripple-y", ((e.clientY - r.top) / r.height * 100) + "%");
  };

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <button onClick={() => onLink("home")} className="flex items-center gap-2 group">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] group-hover:scale-125 transition-transform"></span>
            <span className="text-[13.5px] tracking-[-0.01em] text-white font-medium">Mohammed Aldkhily</span>
          </button>

          <div className="hidden md:flex items-center gap-0.5">
            {links.map((l) => (
              <button key={l.k} onClick={() => onLink(l.k)}
                className={`nav-link px-3 py-1.5 text-[13px] transition-colors rounded-md hover:bg-sky-400/5 ${
                  active === l.k ? "active text-white" : "text-slate-400 hover:text-white"
                }`}>
                {l.l}
              </button>
            ))}
            <button onClick={onLangToggle}
              className="ms-2 px-3 py-1.5 text-[13px] font-mono text-sky-400/80 hover:text-sky-300 border border-sky-400/20 hover:border-sky-400/50 rounded-md transition-all hover:bg-sky-400/5">
              {t.toggle}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={onLangToggle}
              className="px-2.5 py-1 text-[12px] font-mono text-sky-400/80 border border-sky-400/20 rounded-md">
              {t.toggle}
            </button>
            <button onClick={() => setOpen(true)} className="p-2 text-slate-300 hover:text-white">
              <I.Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu with staggered animation */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-[#0A0E1A]/85 backdrop-blur-xl" onClick={() => setOpen(false)}></div>
          <div className="absolute inset-y-0 end-0 w-[82%] max-w-sm glass border-s border-sky-400/10 p-6 flex flex-col gap-1 menu-scroll">
            <div className="flex items-center justify-between mb-8 menu-item-anim" style={{ animationDelay: "50ms" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span className="text-[13px] text-white font-medium">Mohammed Aldkhily</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-slate-400 hover:text-white"><I.X size={20} /></button>
            </div>
            {links.map((l, i) => (
              <button key={l.k} onClick={() => { onLink(l.k); setOpen(false); }}
                className={`menu-item-anim text-start px-3 py-3 text-lg hover:text-white hover:bg-sky-400/5 rounded-lg transition-colors ${
                  active === l.k ? "text-white bg-sky-400/5" : "text-slate-200"
                }`}
                style={{ animationDelay: `${100 + i * 60}ms` }}>
                {l.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── WordReveal helper ─────────────────────────────────────────
function WordReveal({ text, className, baseDelay = 0 }) {
  const words = text.split(" ");
  return (
    <span className={`word-reveal ${className || ""}`}>
      {words.map((w, i) => (
        <span key={i} style={{ animationDelay: `${baseDelay + i * 80}ms` }}>
          {w}{i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

// ─── Hero ──────────────────────────────────────────────────────
function Hero({ lang, onCta }) {
  const t = CONTENT[lang].hero;
  const typed = useTypewriter(t.roles, lang === "ar");
  const heroRef = useRef(null);

  // Subtle parallax on scroll
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > window.innerHeight) return;
      const slow = hero.querySelector(".parallax-slow");
      if (slow) slow.style.transform = `translateY(${y * 0.12}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ripple effect for buttons
  const onBtnEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ripple-x", ((e.clientX - r.left) / r.width * 100) + "%");
    e.currentTarget.style.setProperty("--ripple-y", ((e.clientY - r.top) / r.height * 100) + "%");
  };

  return (
    <section id="home" ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-70 parallax-slow"></div>
      <div className="aurora"></div>
      <FloatingParticles />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0E1A] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-8 order-2 lg:order-1">
            <h1 className="rise d-1 font-semibold tracking-[-0.04em] leading-[0.95] text-[40px] sm:text-[62px] md:text-[80px] lg:text-[104px]">
              <WordReveal text={t.name} className="gradient-text" baseDelay={300} />
            </h1>

            <div className="rise d-2 mt-5 font-mono text-sky-400 text-sm md:text-xl min-h-[1.5em]">
              <span className="text-slate-500">{">"} </span>
              <span>{typed}</span>
              <span className="caret"></span>
            </div>

            <p className="rise d-3 mt-6 text-slate-400 leading-relaxed max-w-2xl text-sm md:text-lg">
              {t.desc}
            </p>

            <div className="rise d-4 mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => onCta("work")} onMouseEnter={onBtnEnter}
                className="btn-primary group inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[14px]">
                <span>{t.cta1}</span>
                <I.ArrowRight size={16} className="rtl-mirror group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a href="uploads/Mohammed_Aldkhily_CV.pdf" download onMouseEnter={onBtnEnter}
                className="btn-ghost group inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[14px]">
                <I.Download size={16} />
                <span>{t.cta2}</span>
              </a>
            </div>
          </div>

          {/* Profile photo with enhanced glow */}
          <div className="lg:col-span-4 order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="rise d-2 relative w-44 sm:w-60 md:w-72 lg:w-full max-w-[300px] aspect-square group">
              <div className="absolute -inset-3 bg-gradient-to-br from-sky-400/30 to-blue-600/10 rounded-3xl blur-2xl group-hover:from-sky-400/40 group-hover:to-blue-600/20 transition-all duration-700"></div>
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-sky-400/20 bg-[#0f1729] shadow-[0_30px_60px_-25px_rgba(56,189,248,0.4)] group-hover:shadow-[0_40px_80px_-25px_rgba(56,189,248,0.55)] group-hover:border-sky-400/35 transition-all duration-500">
                <img src="assets/profile.png" alt="Mohammed Aldkhily" loading="eager" decoding="async"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/40 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rise d-4 mt-16 flex items-center gap-2 text-[11px] font-mono text-slate-500 tracking-wider uppercase">
          <span>{t.scroll}</span>
          <I.ChevronDown size={14} className="bounce-soft" />
        </div>
      </div>
    </section>
  );
}

// ─── About ─────────────────────────────────────────────────────
function AboutAvatar({ lang }) {
  const first = lang === "ar" ? "محمد" : "Mohammed";
  const last  = lang === "ar" ? "الدخيلي" : "Aldkhily";
  return (
    <div className="relative aspect-square w-full max-w-md mx-auto">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400/30 via-blue-500/10 to-transparent border border-sky-400/15 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
        <div className="absolute top-6 start-6 grid grid-cols-6 gap-1.5 opacity-60">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-sky-400" style={{ opacity: 0.3 + (i % 5) * 0.15 }}></span>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="font-semibold tracking-[-0.04em] leading-[0.92] text-white text-[40px] md:text-[54px]">{first}</div>
          <div className="mt-1 font-semibold tracking-[-0.04em] leading-[0.92] text-sky-400 text-[40px] md:text-[54px]">{last}</div>
          <div className="mt-4 font-mono text-[10px] text-slate-400/80 tracking-[0.3em] uppercase">
            {lang === "ar" ? "مطوّر · مهندس AI" : "developer · ai engineer"}
          </div>
        </div>
        <div className="absolute bottom-4 end-4 flex items-center gap-1.5 font-mono text-[10px] text-slate-400/70">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span>v2026.1</span>
        </div>
        <div className="absolute bottom-4 start-4 font-mono text-[10px] text-slate-500/70">[24.0000°N, 46.0000°E]</div>
        <div className="absolute -top-20 -end-20 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

function StatCard({ n, suf, label, startAnim }) {
  const v = useCountUp(n, startAnim);
  return (
    <div className="glass rounded-xl p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30">
      <div className="font-mono text-2xl md:text-4xl font-semibold text-sky-400 num tracking-tight">
        {v}<span className="text-sky-400/80">{suf}</span>
      </div>
      <div className="mt-1.5 text-[11px] md:text-sm text-slate-400 leading-tight">{label}</div>
    </div>
  );
}

function About({ lang }) {
  const t = CONTENT[lang].about;
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <section id="about" className="relative py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} />
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5 reveal">
            <AboutAvatar lang={lang} />
            <div className="mt-6 flex flex-wrap gap-2 text-[12px] text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md glass"><I.MapPin size={12} className="text-sky-400" /> {t.location}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md glass"><I.Calendar size={12} className="text-sky-400" /> {t.available}</span>
            </div>
          </div>
          <div className="md:col-span-7 reveal">
            <p className={`text-slate-300 leading-[1.78] ${lang === "ar" ? "text-lg" : "text-[17px]"}`} style={{ textWrap: "pretty" }}>
              {t.body}
            </p>
            <div ref={ref} className="stat-grid mt-10 grid grid-cols-3 gap-3 md:gap-4">
              {t.stats.map((s, i) => (
                <StatCard key={i} n={s.n} suf={s.suf} label={s.label} startAnim={seen} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Cert Marquee (image cards) ───────────────────────────────
const ORG_GRADIENTS = {
  SDAIA:     { from: "#0a2040", to: "#061428", icon: "#38BDF8" },
  Microsoft: { from: "#0a2010", to: "#061208", icon: "#22c55e" },
  IBM:       { from: "#0a1840", to: "#060e28", icon: "#818cf8" },
  MISK:      { from: "#2a1408", to: "#180c04", icon: "#f59e0b" },
};

function MarqueeCard({ cert }) {
  const handleClick = () => {
    if (cert.file) window.open(cert.file, "_blank", "noopener");
  };
  return (
    <div className="marquee-card" onClick={handleClick} role={cert.file ? "button" : undefined}>
      <div className="marquee-card-thumb">
        {cert.img ? (
          <img src={cert.img} alt={cert.name} loading="lazy" decoding="async" />
        ) : cert.file ? (
          <div className="marquee-card-pdf-wrap">
            <iframe
              src={`${cert.file}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title={cert.name}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="marquee-card-empty shimmer-bg" />
        )}
      </div>
      <div className="marquee-card-info">
        <div className="marquee-card-name">{cert.name}</div>
        {cert.org && <div className="marquee-card-org">{cert.org}</div>}
      </div>
    </div>
  );
}

function CertMarquee({ certs }) {
  const doubled  = useMemo(() => [...certs, ...certs], [certs]);
  const reversed = useMemo(() => [...[...certs].reverse(), ...[...certs].reverse()], [certs]);
  return (
    <div className="marquee-section mt-12">
      <div className="marquee-row anim-l">
        {doubled.map((c, i) => <MarqueeCard key={i} cert={c} />)}
      </div>
      <div className="marquee-divider"></div>
      <div className="marquee-row anim-r">
        {reversed.map((c, i) => <MarqueeCard key={i} cert={c} />)}
      </div>
    </div>
  );
}

// ─── Project mockups ──────────────────────────────────────────
function BrowserChrome({ url, children }) {
  return (
    <div className="device relative overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-sky-400/10 bg-[#0b1120]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[#0A0E1A] border border-sky-400/10 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-sky-400"></span>
          <span className="truncate">{url}</span>
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function MedicalMock({ lang }) {
  const m = CONTENT[lang].mock;
  return (
    <BrowserChrome url={m.medicalBrowser}>
      <div className="p-4 md:p-5 grid grid-cols-2 gap-3 bg-[#0a1020] min-h-[280px]">
        <div className="rounded-lg border border-sky-400/10 bg-[#0f1729] p-3">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mb-2 uppercase tracking-wider">
            <I.Stethoscope size={11} className="text-sky-400" />
            <span>{m.medicalInputLabel}</span>
          </div>
          <p dir="rtl" className="text-[11px] leading-relaxed text-slate-200" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            {m.medicalInput}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="font-mono text-[9px] text-sky-400/80">analyzing…</span>
          </div>
        </div>
        <div className="rounded-lg border border-sky-400/20 bg-gradient-to-br from-[#0f1729] to-[#0a0e1a] p-3">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mb-2 uppercase tracking-wider">
            <I.Sparkles size={11} className="text-sky-400" />
            <span>{m.medicalReportLabel}</span>
          </div>
          <div className="space-y-1.5">
            {m.medicalReport.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[10.5px]">
                <span className="font-mono text-slate-500 w-16 shrink-0">{r.k}:</span>
                <span className="text-slate-200 leading-tight">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-sky-400/10 flex items-center justify-between">
            <span className="font-mono text-[9px] text-sky-400">GPT-4 · NLP</span>
            <span className="font-mono text-[9px] text-slate-500">1.2s</span>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function StoreMock({ lang }) {
  const m = CONTENT[lang].mock;
  return (
    <BrowserChrome url={m.storeBrowser}>
      <div className="p-4 md:p-5 bg-[#0a1020] min-h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center font-mono text-[10px] font-bold text-[#0a0e1a]">SF</div>
            <span className="font-mono text-[10px] text-slate-300">SmoothFlow</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <I.ShoppingCart size={12} />
            <span className="font-mono text-[10px]">2</span>
          </div>
        </div>
        <div className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-2">{m.storeCat}</div>
        <div className="grid grid-cols-2 gap-2">
          {m.storeProducts.map((p, i) => (
            <div key={i} className="rounded-lg border border-sky-400/10 bg-[#0f1729] p-2.5 hover:border-sky-400/30 transition-colors">
              <div className="h-12 rounded bg-gradient-to-br from-slate-800 to-slate-900 mb-2 flex items-center justify-center">
                <span className="font-mono text-[9px] text-sky-400/60">{p.tag}</span>
              </div>
              <div className="text-[10px] text-slate-200 truncate">{p.name}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-[10px] text-sky-400 num">{p.price}</span>
                <button className="text-[8.5px] px-1.5 py-0.5 rounded bg-sky-400/15 text-sky-300 border border-sky-400/20">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  );
}

function TelegramMock({ lang }) {
  const m = CONTENT[lang].mock;
  return (
    <div className="device overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sky-400/10 bg-gradient-to-b from-[#0c1424] to-[#0b1120]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
          <I.Cpu size={14} className="text-[#0a0e1a]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-white truncate">{m.telegramTitle}</div>
          <div className="flex items-center gap-1 text-[10px] text-sky-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span className="font-mono">{m.telegramOnline}</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-[#0a1020] min-h-[220px] flex flex-col gap-2">
        {m.telegramMessages.map((msg, i) => (
          <div key={i} className={`max-w-[78%] ${msg.from === "user" ? "self-end" : "self-start"}`}>
            <div className={`px-3 py-2 rounded-2xl text-[11.5px] leading-tight ${
              msg.from === "user"
                ? "bg-sky-500/90 text-[#0a0e1a] rounded-br-sm"
                : "bg-[#0f1729] border border-sky-400/10 text-slate-200 rounded-bl-sm"
            }`} dir="auto">{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2.5 border-t border-sky-400/10 bg-[#0b1120]">
        <div className="flex items-center gap-1 overflow-hidden">
          {m.archFlow.map((n, i) => (
            <React.Fragment key={i}>
              <span className={`font-mono text-[8.5px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                i === 3 ? "bg-sky-400/15 text-sky-300 border border-sky-400/25" : "text-slate-400 border border-sky-400/5 bg-[#0a0e1a]"
              }`}>{n}</span>
              {i < m.archFlow.length - 1 && <span className="text-slate-700 text-[9px]">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Project image (animated) ─────────────────────────────────
function ProjectImage({ src, alt }) {
  return (
    <div className="project-img-wrap">
      <img src={src} alt={alt} loading="lazy" decoding="async" className="project-img" />
    </div>
  );
}

// ─── Qassim Food Detection mock (4-image mosaic) ──────────────
function QassimMock({ lang }) {
  const items = [
    { src: "uploads/qassim-food-detection/live-detection.png", label: "Jareesh",  conf: "70%" },
    { src: "uploads/qassim-food-detection/kleeja.png",         label: "Kleeja",   conf: "61%" },
    { src: "uploads/qassim-food-detection/masabeeb.png",       label: "Masabeeb", conf: "92%" },
    { src: "uploads/qassim-food-detection/maamoul.png",        label: "Maamoul",  conf: "75%" },
  ];
  return (
    <div className="device overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-sky-400/10 bg-[#0b1120]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[#0A0E1A] border border-sky-400/10 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="truncate">qassim-food-detection · live</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-sky-400/80">
          <I.Camera size={11} />
          <span>53 FPS</span>
        </div>
      </div>
      <div className="qassim-grid p-2 bg-[#0a1020]">
        {items.map((it, i) => (
          <div key={i} className="qassim-tile">
            <img src={it.src} alt={it.label} loading="lazy" decoding="async" />
            <div className="qassim-tile-tag">
              <span className="qassim-tile-dot"></span>
              <span>{it.label}</span>
              <span className="qassim-tile-conf">{it.conf}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-sky-400/10 bg-[#0b1120] flex items-center justify-between">
        <span className="font-mono text-[9px] text-sky-400">YOLO11x · ONNX FP16</span>
        <span className="font-mono text-[9px] text-slate-500">4 classes · custom dataset</span>
      </div>
    </div>
  );
}

// ─── Mundial Chatbot mock (2 stacked screenshots) ─────────────
function WorldcupMock({ lang }) {
  const items = [
    { src: "uploads/worldcup-rag-chatbot/UI.png",            label: "Chat UI · AR + EN" },
    { src: "uploads/worldcup-rag-chatbot/1778777676529.jpg", label: "Training · QLoRA" },
  ];
  return (
    <div className="device overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-sky-400/10 bg-[#0b1120]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[#0A0E1A] border border-sky-400/10 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="truncate">worldcup-rag-chatbot · live</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-sky-400/80">
          <I.Sparkles size={11} />
          <span>RAG</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2 bg-[#0a1020]">
        {items.map((it, i) => (
          <div key={i}
               className="qassim-tile"
               style={{ aspectRatio: "auto" }}>
            <img src={it.src} alt={it.label} loading="lazy" decoding="async"
                 style={{ height: "auto", objectFit: "contain" }} />
            <div className="qassim-tile-tag">
              <span className="qassim-tile-dot"></span>
              <span>{it.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-sky-400/10 bg-[#0b1120] flex items-center justify-between">
        <span className="font-mono text-[9px] text-sky-400">Mistral-7B · QLoRA</span>
        <span className="font-mono text-[9px] text-slate-500">6,949 Q&amp;A · AR + EN</span>
      </div>
    </div>
  );
}

// ─── Work ──────────────────────────────────────────────────────
function ProjectCard({ p, idx, lang }) {
  const t = CONTENT[lang].work;
  const cardRef = useRef(null);
  const reversed = typeof p.reverse === "boolean" ? p.reverse : idx % 2 === 1;

  const onMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cx = r.width / 2, cy = r.height / 2;
    const tiltX = ((y - cy) / cy) * 2.5;
    const tiltY = ((cx - x) / cx) * 2.5;
    cardRef.current.style.setProperty("--mx", `${x}px`);
    cardRef.current.style.setProperty("--my", `${y}px`);
    cardRef.current.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
  };

  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  const Mock = { medical: MedicalMock, store: StoreMock, telegram: TelegramMock, qassim: QassimMock, worldcup: WorldcupMock }[p.kind];

  return (
    <article ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
      className="reveal project-card glass rounded-2xl p-6 md:p-10 relative">
      <div className="edge-gradient"></div>
      <div className={`grid md:grid-cols-12 gap-8 md:gap-12 items-center ${reversed ? "md:[direction:rtl]" : ""}`}>
        {/* Text */}
        <div className={`md:col-span-6 relative ${reversed ? "md:[direction:ltr]" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10.5px] tracking-[0.15em] uppercase text-slate-400">{p.tag}</span>
            {p.featured && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full glass text-[10px] font-mono tracking-widest text-sky-300 uppercase">
                <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse"></span>
                {t.latest}
              </span>
            )}
          </div>
          <h3 className="mt-3 text-2xl md:text-4xl font-semibold text-white tracking-[-0.02em] leading-tight">{p.title}</h3>
          <p className="mt-2 text-sky-400/90 text-[15px]">{p.summary}</p>
          <p className="mt-4 text-slate-400 leading-relaxed text-[14.5px]" style={{ textWrap: "pretty" }}>{p.desc}</p>

          <ul className="mt-6 space-y-2.5">
            {p.achievements.map((a, i) => {
              const Icon = I[a.icon] || I.Sparkles;
              return (
                <li key={i} className="flex items-start gap-3 text-[13.5px] text-slate-300">
                  <span className="mt-0.5 w-6 h-6 shrink-0 rounded-md bg-sky-400/10 border border-sky-400/15 flex items-center justify-center text-sky-400">
                    <Icon size={13} />
                  </span>
                  <span className="leading-snug">{a.text}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {p.tech.map((tech, i) => (
              <span key={i} className="font-mono text-[10.5px] px-2 py-1 rounded-md bg-[#0A0E1A]/60 border border-sky-400/10 text-slate-300">
                {tech}
              </span>
            ))}
          </div>

          {(p.live || p.github) && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {p.live && (
                <a href={p.live} target="_blank" rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px]">
                  <I.ExternalLink size={14} />
                  <span>{t.live}</span>
                </a>
              )}
              {p.github && (
                <a href={p.github} target="_blank" rel="noreferrer"
                  className="btn-ghost inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px]">
                  <I.Github size={14} />
                  <span>{t.code}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Visual */}
        <div className={`md:col-span-6 relative ${reversed ? "md:[direction:ltr]" : ""}`} dir="ltr">
          <div className="relative">
            <div className="absolute -inset-6 bg-sky-500/5 blur-3xl rounded-full"></div>
            {p.img ? <ProjectImage src={p.img} alt={p.title} /> : <Mock lang={lang} />}
          </div>
        </div>
      </div>
    </article>
  );
}

function Work({ lang }) {
  const t = CONTENT[lang].work;
  return (
    <section id="work" className="relative py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className="flex flex-col gap-8 md:gap-12">
          {t.projects.map((p, i) => <ProjectCard key={i} p={p} idx={i} lang={lang} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Skills ────────────────────────────────────────────────────
function SkillCard({ cat, idx }) {
  const Icon = I[cat.icon] || I.Code2;
  const cardRef = useRef(null);

  const onMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    cardRef.current.style.setProperty("--mx", `${x}%`);
    cardRef.current.style.setProperty("--my", `${y}%`);
  };

  return (
    <div ref={cardRef} onMouseMove={onMove}
      className="skill-card glass rounded-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_56px_-18px_rgba(56,189,248,0.28)] group"
      style={{ "--mx": "50%", "--my": "50%", background: "radial-gradient(ellipse at var(--mx) var(--my), rgba(56,189,248,0.06), rgba(15,23,41,0.55))" }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="skill-icon w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-600/10 border border-sky-400/20 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Icon size={17} />
        </span>
        <h3 className="text-[15px] font-semibold text-white tracking-tight">{cat.name}</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cat.items.map((it, j) => (
          <span key={j} className="font-mono text-[11px] px-2 py-1 rounded-md bg-[#0A0E1A]/60 border border-sky-400/10 text-slate-300 hover:border-sky-400/30 hover:text-sky-200 hover:bg-sky-400/5 transition-all duration-200">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function Skills({ lang }) {
  const t = CONTENT[lang].skills;
  return (
    <section id="skills" className="relative py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className="reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {t.cats.map((c, i) => <SkillCard key={i} cat={c} idx={i} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Credentials ───────────────────────────────────────────────
function Credentials({ lang }) {
  const t = CONTENT[lang].creds;
  return (
    <section id="credentials" className="relative py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} />

        {/* Education + cert list */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Education */}
          <div className="reveal glass rounded-xl p-6 md:p-8 md:w-auto md:shrink-0 w-full" style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.15em] uppercase text-slate-400 mb-4">
              <I.GraduationCap size={14} className="text-sky-400" />
              <span>{t.eduLabel}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white tracking-[-0.01em]">{t.degree}</h3>
            <p className="mt-1.5 text-slate-400">{t.university}</p>
            <div className="mt-5">
              <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-[#0A0E1A]/60 border border-sky-400/10 text-slate-300 num">{t.years}</span>
            </div>
          </div>

          {/* Cert list */}
          <div className="reveal glass rounded-xl p-6 md:p-8 flex-1 min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.15em] uppercase text-slate-400 mb-4">
              <I.Award size={14} className="text-sky-400" />
              <span>{t.certLabel}</span>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0 divide-y-0">
              {t.certs.map((c, i) => (
                <li key={i} className="py-1.5 flex items-start gap-2 border-b border-sky-400/5">
                  <span className="mt-[5px] w-1 h-1 rounded-full bg-sky-400/50 shrink-0 flex-none"></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] text-slate-200 leading-snug">{c.name}</div>
                    {c.org && <div className="font-mono text-[9px] text-slate-500 mt-0.5">{c.org}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <CertMarquee certs={t.certs} />
      </div>
    </section>
  );
}

// ─── Contact ───────────────────────────────────────────────────
function Contact({ lang }) {
  const t = CONTENT[lang].contact;
  return (
    <section id="contact" className="relative py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="reveal max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[11px] tracking-[0.2em] text-sky-400/80 uppercase">{t.eyebrow}</span>
            <span className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-sky-400/40 to-transparent"></span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.02]">
            <span className="gradient-text">{t.title}</span>
          </h2>
          <p className="mt-5 text-slate-400 text-lg max-w-2xl">{t.subtitle}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {t.cards.map((c, i) => {
            const Icon = I[c.icon] || I.Mail;
            return (
              <a key={i} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
                className="contact-card reveal group glass rounded-xl p-6 md:p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-18px_rgba(56,189,248,0.22)]"
                style={{ animationDelay: `${i * 150}ms` }}>
                <div className="flex items-start gap-4">
                  <span className="w-11 h-11 shrink-0 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-600/10 border border-sky-400/20 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Icon size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10.5px] tracking-[0.15em] uppercase text-slate-500">{c.label}</div>
                    <div className="mt-1 text-[15px] md:text-[17px] text-white truncate">{c.value}</div>
                  </div>
                  <I.ArrowUpRight size={18} className="text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>
                <div className="absolute -bottom-20 -end-20 w-48 h-48 bg-sky-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────
function Footer({ lang }) {
  const t = CONTENT[lang].footer;
  return (
    <footer className="relative border-t border-sky-400/10 py-12 mt-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></span>
              <span className="text-[13.5px] text-white font-medium tracking-tight">Mohammed Aldkhily</span>
            </div>
            <p className="text-[13px] text-slate-400">{t.line1}</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/imdk-cs" target="_blank" rel="noreferrer"
              className="footer-link text-slate-500 hover:text-sky-400">
              <I.Github size={18} />
            </a>
            <a href="https://www.linkedin.com/in/mohammed-cs0/" target="_blank" rel="noreferrer"
              className="footer-link text-slate-500 hover:text-sky-400">
              <I.Linkedin size={18} />
            </a>
            <a href="mailto:mohammed.aldkhily@gmail.com"
              className="footer-link text-slate-500 hover:text-sky-400">
              <I.Mail size={18} />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-sky-400/5 text-center">
          <p className="font-mono text-[11px] text-slate-500">{t.line2}</p>
        </div>
      </div>
    </footer>
  );
}

// ─── App ───────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showIcons": true,
  "accent": "#38BDF8",
  "showAurora": true,
  "showDotGrid": true,
  "gradientName": true
}/*EDITMODE-END*/;

// ─── Section Divider ──────────────────────────────────────────
function SectionDivider() {
  return <div className="section-glow-divider reveal" aria-hidden="true"></div>;
}

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState("en");
  useScrollReveal();

  // Finish preloader once app mounts
  useEffect(() => {
    if (window.__finishPreloader) window.__finishPreloader();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.documentElement.style.setProperty("--sky", tw.accent);
    document.documentElement.style.setProperty("--accent", tw.accent);
    document.body.classList.toggle("no-icons", !tw.showIcons);
    document.body.classList.toggle("no-aurora", !tw.showAurora);
    document.body.classList.toggle("no-dotgrid", !tw.showDotGrid);
    document.body.classList.toggle("no-gradient-name", !tw.gradientName);
  }, [tw]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const toggleLang = () => setLang(l => l === "en" ? "ar" : "en");

  return (
    <div className="relative min-h-screen">
      <ScrollProgress />
      <Nav onLink={scrollTo} lang={lang} onLangToggle={toggleLang} />
      <main>
        <Hero lang={lang} onCta={scrollTo} />
        <SectionDivider />
        <About lang={lang} />
        <SectionDivider />
        <Work lang={lang} />
        <SectionDivider />
        <Credentials lang={lang} />
        <SectionDivider />
        <Skills lang={lang} />
        <SectionDivider />
        <Contact lang={lang} />
      </main>
      <Footer lang={lang} />
      <BackToTop />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Display" />
        <TweakToggle label="Show icons"    value={tw.showIcons}    onChange={(v) => setTweak("showIcons", v)} />
        <TweakToggle label="Gradient name" value={tw.gradientName} onChange={(v) => setTweak("gradientName", v)} />
        <TweakToggle label="Animated aurora" value={tw.showAurora} onChange={(v) => setTweak("showAurora", v)} />
        <TweakToggle label="Dot grid"      value={tw.showDotGrid}  onChange={(v) => setTweak("showDotGrid", v)} />
        <TweakSection label="Accent" />
        <TweakColor label="Primary" value={tw.accent} onChange={(v) => setTweak("accent", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
