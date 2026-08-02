import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowRight, ArrowUpRight, Play, Lock, Users, Clock, Brain, FileText,
  Activity, Globe, CheckCircle2, Star, ChevronDown, ChevronLeft,
  ChevronRight, Menu, X, Twitter, Linkedin, Github, Instagram, Mail,
  Home, Wallet, Settings, Eye, EyeOff, ShieldCheck, Cpu, Layers, Target, Fingerprint
} from 'lucide-react';


import './LandingPage.css';

/* ─── animation presets ─── */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
};

const stagger = (delay = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay }
});

/* ─── counter hook ─── */
function useCounter(end: number, duration = 2000, prefix = '', suffix = '') {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { ref, display: `${prefix}${count.toLocaleString()}${suffix}` };
}

/* ─── data ─── */
const FAQs = [
  {
    q: 'How does Zero-Knowledge encryption protect my digital assets?',
    a: 'With Zero-Knowledge architecture, your data is encrypted locally on your device before it ever reaches our servers. The encryption keys are derived from your master password — we never have access to your keys or raw data. Only you and your authorized nominees can decrypt the vault.'
  },
  {
    q: "What triggers the Dead Man's Switch?",
    a: "The Dead Man's Switch monitors your account activity. If no activity is detected for your specified threshold (e.g., 30, 90, or 180 days), the system sends warning emails and SMS. If you still don't respond, the system triggers the automatic release of specific assets to your pre-assigned nominees."
  },
  {
    q: 'How does AI Document Verification work?',
    a: 'Our advanced AI models analyze uploaded documents (wills, identity cards, trust deeds) to verify authenticity, check for tampering, and extract essential meta-data to ensure the documents are legally sound and match your specified conditions.'
  },
  {
    q: 'Can I manage both Web3 crypto wallets and traditional stock accounts?',
    a: 'Yes, Trustix handles a hybrid portfolio. You can securely store private keys and seed phrases for Web3 assets, alongside login credentials and formal documents for traditional brokerage and bank accounts.'
  },
  {
    q: 'What happens if I lose my Master Vault Key?',
    a: 'Because we use strict Zero-Knowledge encryption, we cannot recover a lost Master Key. However, if you configure a Trusted Nominee Recovery system or print out the emergency recovery kit during onboarding, you can restore access.'
  }
];

const TESTIMONIALS = [
  {
    name: 'Alex Johnson', role: 'Crypto Investor', initials: 'AJ',
    text: "Trustix gave me peace of mind knowing my family's future is secure. The platform is easy to use and incredibly secure."
  },
  {
    name: 'Sarah Williams', role: 'Entrepreneur', initials: 'SW',
    text: "The dead man's switch feature is a game changer. I know my assets will reach my loved ones, no matter what happens."
  },
  {
    name: 'Michael Chen', role: 'Blockchain Developer', initials: 'MC',
    text: 'Finally, a platform that combines security, privacy, and ease of use. Highly recommended!'
  }
];

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = useCallback(() => navigate('/auth'), [navigate]);

  /* counters */
  const c1 = useCounter(10000, 2000, '', '+');
  const c2 = useCounter(500, 2000, '$', 'M+');
  const c3 = useCounter(99, 1800, '', '.9%');
  const c4 = useCounter(150, 1600, '', '+');

  return (
    <div className="landing-wrapper">
      {/* ═══ NAVIGATION ═══ */}
      <nav className={`sticky-nav ${scrolled ? 'scrolled' : ''}`}>
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img src="/trustixlogo.png" alt="Trustix" style={{ height: 36 }} />
          <img src="/trustixname.png" alt="Trustix" style={{ height: 20 }} />
        </div>

        <ul className="nav-links hidden md:flex">
          <li><a href="#features">Features</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#how-it-works">How it Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <button className="btn-secondary" style={{ padding: '10px 24px' }} onClick={go}>
            Sign In
          </button>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={go}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[60px] left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[rgba(0,11,7,0.06)] p-6 flex flex-col gap-4 md:hidden"
          >
            {['Features', 'Security', 'How it Works', 'Pricing', 'FAQ'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-[#4a6358] hover:text-[#000B07] py-2"
                onClick={() => setMobileMenu(false)}
              >
                {item}
              </a>
            ))}
            <button className="btn-primary w-full justify-center mt-2" onClick={go}>
              Get Started <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="hero-section">
        <div className="blob-mint-1" style={{ top: '-10%', right: '-10%' }} />
        <div className="blob-cyan-1" style={{ bottom: '10%', left: '5%' }} />

        <div className="hero-content">
          {/* Left */}
          <div className="hero-left">
            <motion.div {...stagger(0)}>
              <div className="badge-zk">
                <Shield size={14} /> Zero-Knowledge Digital Inheritance
              </div>
            </motion.div>

            <motion.h1 {...stagger(0.1)}>
              Your Assets.{' '}
              <span className="gradient-mint-blue">Protected</span>{' '}
              Forever.
            </motion.h1>

            <motion.p {...stagger(0.2)} className="body-text" style={{ maxWidth: 520 }}>
              Trustix ensures your digital assets, documents, and financial accounts
              are securely encrypted and passed on to your loved ones, only when needed.
            </motion.p>

            <motion.div {...stagger(0.3)} className="flex flex-wrap items-center gap-4">
              <button className="btn-primary" onClick={go}>
                Get Started Now <ArrowRight size={18} />
              </button>
              <button className="btn-secondary">
                <Play size={18} style={{ color: '#0CFA9E' }} /> Watch how it works
              </button>
            </motion.div>

            <motion.div {...stagger(0.4)} className="trust-indicators">
              <span className="trust-indicator"><Users size={14} /> Trusted by 10,000+ users worldwide</span>
              <span className="trust-indicator">
                <span style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />)}
                </span>
                4.9/5
              </span>
            </motion.div>
          </div>

          {/* Right — Phone Mockup */}
          <motion.div {...stagger(0.2)} className="hero-right">
            {/* Shield BG */}
            <div className="shield-bg">
              <Shield size={500} strokeWidth={0.3} color="#0CFA9E" />
            </div>

            {/* Floating Cards */}
            <div className="floating-card fc-top-left">
              <div className="fc-icon mint"><Lock size={18} /></div>
              <div>
                <div className="fc-text">Encrypted Vault</div>
                <div className="fc-sub">Military-grade encryption</div>
              </div>
            </div>

            <div className="floating-card fc-top-right">
              <div className="fc-icon cyan"><Users size={18} /></div>
              <div>
                <div className="fc-text">Trusted Nominees</div>
                <div className="fc-sub">Only verified people can access</div>
              </div>
            </div>

            <div className="floating-card fc-bot-left">
              <div className="fc-icon accent"><Clock size={18} /></div>
              <div>
                <div className="fc-text">Dead Man's Switch</div>
                <div className="fc-sub">Automated transfer when inactive</div>
              </div>
            </div>

            <div className="floating-card fc-bot-right">
              <div className="fc-icon mint"><Brain size={18} /></div>
              <div>
                <div className="fc-text">AI Verification</div>
                <div className="fc-sub">Smart document verification</div>
              </div>
            </div>

            {/* Phone */}
            <div className="phone-mockup">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-header">
                  <h3>My Vault</h3>
                  <div style={{ fontSize: '0.5rem', color: '#4a6358' }}>Everything is encrypted<br />and 100% secure</div>
                </div>

                <div className="vault-status">
                  <div className="vault-status-dot" />
                  Vault Status: <strong>Secure & Locked</strong>
                </div>

                <div style={{ fontSize: '0.5625rem', color: '#4a6358', marginTop: 4 }}>
                  Last activity: <strong style={{ color: '#000B07' }}>2 days ago</strong>
                </div>

                <div className="phone-grid">
                  <div className="phone-grid-item">
                    <div className="label">Documents</div>
                    <div className="value">12 Files</div>
                  </div>
                  <div className="phone-grid-item">
                    <div className="label">Wallets</div>
                    <div className="value">5 Accounts</div>
                  </div>
                  <div className="phone-grid-item">
                    <div className="label">Nominees</div>
                    <div className="value">3 People</div>
                  </div>
                  <div className="phone-grid-item">
                    <div className="label">Activities</div>
                    <div className="value">24 Logs</div>
                  </div>
                </div>

                <div className="phone-total">
                  <div className="label">Total Assets Protected</div>
                  <div className="value">$247,680.45</div>
                  <div className="label">Across 7 Categories</div>
                </div>

                <div className="phone-nav">
                  {[
                    { icon: Home, label: 'Home', active: true },
                    { icon: Shield, label: 'Vault' },
                    { icon: Activity, label: 'Activity' },
                    { icon: Settings, label: 'Profile' }
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} className={`phone-nav-item ${active ? 'active' : ''}`}>
                      <Icon size={14} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 2: TRUSTED COMPANIES ═══ */}
      <motion.section {...fadeUp} className="trusted-section">
        <div className="trusted-logos">
          {['Google', 'Microsoft', 'OpenAI', 'AWS', 'Supabase', 'Cloudflare', 'Stripe'].map(name => (
            <span key={name} className="trusted-logo">{name}</span>
          ))}
        </div>
      </motion.section>

      {/* ═══ SECTION 3: FEATURES ═══ */}
      <section id="features" className="landing-section">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div {...fadeUp}>
            <div className="badge-zk" style={{ marginBottom: 20 }}>
              <CheckCircle2 size={14} /> Powerful Features
            </div>
            <h2 className="section-heading">
              Everything you need to{' '}
              <span className="gradient-mint-blue">secure</span>{' '}
              what matters most.
            </h2>
          </motion.div>

          <div className="features-grid">
            {[
              { icon: Shield, title: 'Non-Custodial Wallet', desc: 'You stay in control. We never see your keys or data.', bg: 'mint-bg' },
              { icon: Brain, title: 'Built-in Exchange', desc: 'Swap cryptocurrencies directly within the app.', bg: 'cyan-bg' },
              { icon: Fingerprint, title: 'Biometric Security', desc: 'Face ID & authentication for extra protection.', bg: 'accent-bg' },
              { icon: FileText, title: 'QR Code Payments', desc: 'Send and receive crypto effortlessly & securely.', bg: 'mint-bg' }
            ].map((f, i) => (
              <motion.div key={f.title} {...stagger(i * 0.1)} className="feature-card">
                <div className={`feature-icon ${f.bg}`}>
                  <f.icon size={22} />
                </div>
                <h4 className="card-title">{f.title}</h4>
                <p className="card-desc">{f.desc}</p>
                <a href="#" className="learn-more">Learn more <ArrowRight size={14} /></a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: HOW IT WORKS & STATS ═══ */}
      <section id="how-it-works" className="landing-section how-it-works-section">
        {/* Header */}
        <motion.div {...fadeUp} className="how-steps-header text-left">
          <div className="badge-pill mb-3 flex items-center gap-1.5 w-fit">
            <Target size={14} className="text-[#059669]" />
            <span>Simple Process</span>
          </div>
          <h2 className="section-title text-4xl font-bold font-alike text-[#000B07] mb-2">
            How Trustix <span className="text-[#0CFA9E] font-normal">w</span>orks
          </h2>
          <p className="body-text text-sm text-[#4a6358] font-medium m-0">
            Secure. Simple. Seamless.
          </p>
        </motion.div>

        {/* 4 Steps Flow */}
        <div className="how-steps-grid">
          {[
            { num: 1, icon: Shield, title: 'Create Your Vault', desc: 'Set up your secure vault and encrypt your important assets, documents, and accounts.', bg: 'bg-mint-circle', color: 'text-mint' },
            { num: 2, icon: Users, title: 'Add Trusted Nominees', desc: 'Choose and invite trusted individuals who can access your vault when needed.', bg: 'bg-blue-circle', color: 'text-blue' },
            { num: 3, icon: Clock, title: 'Set Triggers', desc: 'Configure inactivity periods or conditions that will trigger the release of your assets.', bg: 'bg-purple-circle', color: 'text-purple' },
            { num: 4, icon: Lock, title: 'Automatic Transfer', desc: 'When triggered, assets are securely decrypted and transferred to your nominees.', bg: 'bg-blue-circle', color: 'text-blue' }
          ].map((step, i) => (
            <motion.div key={step.title} {...stagger(i * 0.12)} className="how-step-card">
              <div className="how-num-badge">{step.num}</div>
              <div className={`how-icon-circle ${step.bg}`}>
                <step.icon size={36} className={step.color} />
              </div>
              <h4 className="font-alike font-bold text-lg text-[#000B07] mb-2 mt-4">{step.title}</h4>
              <p className="text-xs text-[#4a6358] leading-relaxed max-w-[220px] mx-auto m-0">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Integrated Stats Banner */}
        <motion.div {...fadeUp} className="how-stats-banner">
          <div className="stat-banner-item">
            <div className="stat-circle-icon bg-mint-circle">
              <Users size={24} className="text-mint" />
            </div>
            <div>
              <div className="stat-value-big font-alike font-bold text-2xl text-[#000B07]">10K+</div>
              <div className="stat-label-text text-xs text-[#4a6358]">Users Protected</div>
            </div>
          </div>

          <div className="stat-banner-item">
            <div className="stat-circle-icon bg-mint-circle">
              <Shield size={24} className="text-mint" />
            </div>
            <div>
              <div className="stat-value-big font-alike font-bold text-2xl text-[#000B07]">$500M+</div>
              <div className="stat-label-text text-xs text-[#4a6358]">Assets Secured</div>
            </div>
          </div>

          <div className="stat-banner-item">
            <div className="stat-circle-icon bg-blue-circle">
              <Clock size={24} className="text-blue" />
            </div>
            <div>
              <div className="stat-value-big font-alike font-bold text-2xl text-[#000B07]">99.9%</div>
              <div className="stat-label-text text-xs text-[#4a6358]">Uptime & Reliability</div>
            </div>
          </div>

          <div className="stat-banner-item">
            <div className="stat-circle-icon bg-purple-circle">
              <Globe size={24} className="text-purple" />
            </div>
            <div>
              <div className="stat-value-big font-alike font-bold text-2xl text-[#000B07]">150+</div>
              <div className="stat-label-text text-xs text-[#4a6358]">Countries Supported</div>
            </div>
          </div>
        </motion.div>
      </section>


      {/* ═══ SECTION 6: WHY TRUSTIX ═══ */}
      <section id="security" className="landing-section">
        <div className="grid lg:grid-cols-[1fr_2.2fr] gap-12 items-center">
          <motion.div {...fadeUp} className="why-left-content">
            <div className="badge-pill mb-4 flex items-center gap-1.5 w-fit">
              <Target size={14} className="text-[#059669]" />
              <span>Why Trustix?</span>
            </div>
            <h2 className="section-title text-3xl font-bold font-alike leading-tight text-[#000B07] mb-4">
              Built for Privacy.<br />Designed for Trust.
            </h2>
            <p className="body-text text-sm text-[#4a6358] mb-6 leading-relaxed max-w-sm">
              We combine zero-knowledge architecture with advanced security to protect what matters most.
            </p>
            <button className="btn-outline-white text-sm font-semibold flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all" onClick={go}>
              Explore Security <ArrowRight size={16} className="text-[#059669]" />
            </button>
          </motion.div>

          <div className="why-features-grid">
            {[
              { icon: EyeOff, title: 'Zero-Knowledge', desc: "We can't access your data, ever.", bg: 'bg-mint-circle', color: 'text-mint' },
              { icon: Lock, title: 'End-to-End Encrypted', desc: 'Your data is encrypted everywhere.', bg: 'bg-blue-circle', color: 'text-blue' },
              { icon: ShieldCheck, title: 'Compliant & Secure', desc: 'Built with global privacy standards.', bg: 'bg-purple-circle', color: 'text-purple' },
              { icon: Clock, title: 'Always Available', desc: '24/7 access for you and your nominees.', bg: 'bg-blue-circle', color: 'text-blue' },
              { icon: Cpu, title: 'AI-Powered Security', desc: 'Smart verification & fraud protection.', bg: 'bg-mint-circle', color: 'text-mint' },
              { icon: Layers, title: 'Decentralized Future', desc: 'Building a decentralized inheritance ecosystem.', bg: 'bg-purple-circle', color: 'text-purple' }
            ].map((f, i) => (
              <motion.div key={f.title} {...stagger(i * 0.08)} className="why-feature-item">
                <div className={`why-circle-icon ${f.bg}`}>
                  <f.icon size={26} className={f.color} />
                </div>
                <div className="why-feature-text">
                  <h4 className="font-alike font-bold text-base text-[#000B07] mb-1">{f.title}</h4>
                  <p className="text-xs text-[#4a6358] leading-relaxed m-0">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>




      {/* ═══ SECTION 8: PRICING ═══ */}
      <section id="pricing" className="landing-section">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="badge-zk mx-auto" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={14} /> Simple Pricing
          </div>
          <h2 className="section-heading">
            Plans for every <span className="gradient-mint-blue">stage</span>
          </h2>
        </motion.div>

        <div className="pricing-toggle">
          <span className={`pricing-toggle-label ${!yearly ? 'active' : ''}`}>Monthly</span>
          <div
            className={`pricing-toggle-switch ${yearly ? 'active' : ''}`}
            onClick={() => setYearly(!yearly)}
          />
          <span className={`pricing-toggle-label ${yearly ? 'active' : ''}`}>Yearly <span style={{ color: '#09d888', fontSize: '0.75rem', fontWeight: 600 }}>Save 20%</span></span>
        </div>

        <div className="pricing-grid">
          {/* Starter */}
          <motion.div {...stagger(0)} className="pricing-card">
            <div>
              <div className="pricing-plan">Starter</div>
              <div className="pricing-price">Free</div>
              <p className="pricing-desc">For individuals getting started</p>
            </div>
            <ul className="pricing-features">
              {['1 Vault', '2 Nominees', '500MB Storage', 'Basic Encryption', 'Email Support'].map(f => (
                <li key={f}><CheckCircle2 size={16} /> {f}</li>
              ))}
            </ul>
            <button className="btn-secondary w-full justify-center" onClick={go}>Get Started</button>
          </motion.div>

          {/* Pro */}
          <motion.div {...stagger(0.1)} className="pricing-card pricing-highlight">
            <div className="pricing-popular">Most Popular</div>
            <div>
              <div className="pricing-plan">Pro</div>
              <div className="pricing-price">{yearly ? '$15' : '$19'} <span>/month</span></div>
              <p className="pricing-desc">For families & professionals</p>
            </div>
            <ul className="pricing-features">
              {[
                'Unlimited Vaults', '10 Nominees', '50GB Storage', 'AES-256 Encryption',
                "Dead Man's Switch", 'AI Verification', 'Digital Will', 'Crypto Wallets',
                'Priority Support', 'Audit Logs'
              ].map(f => (
                <li key={f}><CheckCircle2 size={16} /> {f}</li>
              ))}
            </ul>
            <button className="btn-primary w-full justify-center" onClick={go}>Start Free Trial</button>
          </motion.div>

          {/* Enterprise */}
          <motion.div {...stagger(0.2)} className="pricing-card">
            <div>
              <div className="pricing-plan">Enterprise</div>
              <div className="pricing-price">Custom</div>
              <p className="pricing-desc">For organizations</p>
            </div>
            <ul className="pricing-features">
              {[
                'Everything in Pro', 'Unlimited Nominees', 'Unlimited Storage',
                'SSO / SAML', 'Custom Integrations', 'Dedicated Support',
                'SLA Guarantee', 'On-Premise Option'
              ].map(f => (
                <li key={f}><CheckCircle2 size={16} /> {f}</li>
              ))}
            </ul>
            <button className="btn-secondary w-full justify-center">Contact Sales</button>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 9: FAQ ═══ */}
      <section id="faq" className="landing-section">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="badge-zk mx-auto" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={14} /> FAQ
          </div>
          <h2 className="section-heading">
            Frequently Asked <span className="gradient-mint-blue">Questions</span>
          </h2>
        </motion.div>

        <div className="faq-list">
          {FAQs.map((faq, i) => (
            <motion.div
              key={i}
              {...stagger(i * 0.06)}
              className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}
            >
              <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <ChevronDown size={20} />
              </div>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="faq-answer">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 10: CTA ═══ */}
      <section className="cta-section-wrapper">
        <motion.div {...fadeUp} className="cta-banner-card">
          <div className="cta-left">
            <div className="cta-shield-circle">
              <Shield size={34} />
            </div>
            <div className="cta-text-group">
              <h2 className="cta-title">Ready to secure your digital legacy?</h2>
              <p className="cta-subtitle">Join thousands of users who trust Trustix to protect what matters most.</p>
            </div>
          </div>
          <button className="cta-button-white" onClick={go}>
            Get Started Now <ArrowUpRight size={20} />
          </button>
        </motion.div>
      </section>




      {/* ═══ FOOTER ═══ */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="flex items-center gap-3">
              <img src="/trustixlogo.png" alt="Trustix" style={{ height: 32 }} />
              <img src="/trustixname.png" alt="Trustix" style={{ height: 18 }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#09d888', fontWeight: 600, margin: '6px 0 0', letterSpacing: '0.02em' }}>
              Secure. Private. Forever.
            </p>
            <p>The most secure and intuitive platform for digital inheritance and asset protection.</p>
            <div className="footer-socials">
              {[Twitter, Linkedin, Github, Instagram, Mail].map((Icon, i) => (
                <a key={i} href="#" className="footer-social"><Icon size={16} /></a>
              ))}
            </div>
          </div>

          {[
            { title: 'Product', links: ['Features', 'How it Works', 'Security', 'Pricing'] },
            { title: 'Resources', links: ['FAQ', 'Blog', 'Help Center', 'Guides'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Contact Us', 'Privacy Policy'] },
            { title: 'Legal', links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Trust & Safety'] }
          ].map(col => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(link => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© 2024 Trustix. All rights reserved.</span>
          <span>Made with <span style={{ color: '#0CFA9E' }}>♥</span> for a secure future</span>
        </div>
      </footer>
    </div>
  );
}
