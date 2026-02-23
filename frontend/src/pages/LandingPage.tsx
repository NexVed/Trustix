import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    const elements = document.querySelectorAll(".fade-up");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [activePage]);

  const handleShowPage = (id: string) => {
    setActivePage(id);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleBilling = () => {
    setYearly(!yearly);
  };

  return (
    <div className="landing-wrapper">
      {/* NAVBAR */}
      <nav id="navbar" className={scrolled ? "scrolled" : ""}>
        <a className="nav-logo" onClick={() => handleShowPage("home")} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="Trustix Logo" style={{ height: "40px", width: "auto" }} />
          TRUSTIX
        </a>
        <ul className="nav-links">
          <li>
            <a onClick={() => handleShowPage("home")}>Home</a>
          </li>
          <li>
            <a onClick={() => handleShowPage("features")}>Features</a>
          </li>
          <li>
            <a onClick={() => handleShowPage("security")}>Security</a>
          </li>
          <li>
            <a onClick={() => handleShowPage("pricing")}>Pricing</a>
          </li>
        </ul>
        <div className="nav-right">
          <button className="btn-primary" onClick={handleGetStarted}>
            Get Started
          </button>
          <div className="hamburger" onClick={toggleMenu} id="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} id="mobileMenu">
        <a onClick={() => handleShowPage("home")}>Home</a>
        <a onClick={() => handleShowPage("features")}>Features</a>
        <a onClick={() => handleShowPage("security")}>Security</a>
        <a onClick={() => handleShowPage("pricing")}>Pricing</a>
      </div>

      {/* PAGE 1: HOME */}
      <div className={`page ${activePage === "home" ? "active" : ""}`} id="page-home">
        {/* HERO */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-label">Digital Inheritance Platform</div>
              <h1>
                Your Digital Legacy,<br />
                <span>Secured Forever.</span>
              </h1>
              <p className="hero-sub">
                AI-powered digital inheritance vault that protects your passwords, crypto,
                documents, and digital assets — and safely transfers them to your loved ones when it
                matters most.
              </p>
              <div className="hero-btns">
                <button className="btn-primary" onClick={handleGetStarted}>
                  Get Started →
                </button>
                <button className="btn-outline">▶ Watch Demo</button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="vault-container">
                <div className="vault-ring"></div>
                <div className="vault-ring"></div>
                <div className="vault-ring"></div>
                <div className="vault-core">
          <img src="/logo.png" alt="Trustix Logo" style={{ height: "100px", width: "auto" }} />
                  <div className="vault-core-text">TRUSTIX</div>
                </div>
                <div className="floating-badge badge-1">
                  <div className="dot" style={{ background: "#10B981" }}></div>
                  <span>Encrypted & Verified</span>
                </div>
                <div className="floating-badge badge-2">
                  <div className="dot" style={{ background: "#1A56DB" }}></div>
                  <span>Blockchain Proof</span>
                </div>
                <div className="floating-badge badge-3">
                  <div className="dot" style={{ background: "#F59E0B" }}></div>
                  <span>AI Document Scan</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <div className="trust-bar">
          <div className="trust-inner">
            <div className="trust-item">
              <span>🔒</span>
              <span>End-to-End Encrypted</span>
            </div>
            <div className="trust-item">
              <span>⛓</span>
              <span>Blockchain Verified</span>
            </div>
            <div className="trust-item">
              <span>🤖</span>
              <span>AI Document Verification</span>
            </div>
            <div className="trust-item">
              <span>👁🗨</span>
              <span>Zero-Knowledge Architecture</span>
            </div>
          </div>
        </div>

        {/* PROBLEM */}
        <section className="problem-section">
          <div className="section-inner text-center">
            <div className="section-label">The Problem</div>
            <h2 className="section-title">
              What happens to your digital life<br />after you're gone?
            </h2>
            <p className="section-sub" style={{ margin: "0 auto 0" }}>
              Every year billions in digital assets vanish — not stolen, just forgotten. Traditional
              estate planning was built for a pre-digital world.
            </p>
            <div className="cards-3">
              <div className="problem-card fade-up">
                <div className="problem-num">01</div>
                <div className="problem-icon">💸</div>
                <h3>Lost Crypto & Passwords</h3>
                <p>
                  Billions in digital assets are permanently lost due to missing recovery access and
                  unshared private keys.
                </p>
              </div>
              <div className="problem-card fade-up stagger-2">
                <div className="problem-num">02</div>
                <div className="problem-icon">📜</div>
                <h3>No Digital Inheritance Tools</h3>
                <p>
                  Traditional wills don't protect online assets or private keys. Lawyers are
                  unprepared for crypto and digital vaults.
                </p>
              </div>
              <div className="problem-card fade-up stagger-3">
                <div className="problem-num">03</div>
                <div className="problem-icon">⚖️</div>
                <h3>Fraud & Legal Complexity</h3>
                <p>
                  Families struggle to verify ownership and legal access without putting assets at
                  risk from fraud.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="solution-section">
          <div className="section-inner">
            <div className="text-center">
              <div className="section-label">The Solution</div>
              <h2 className="section-title">Meet TRUSTIX</h2>
              <p className="section-sub" style={{ margin: "0 auto 3.5rem" }}>
                A complete digital legacy platform combining military-grade encryption, AI document
                verification, and blockchain-backed proof.
              </p>
            </div>
            <div className="cards-4">
              <div className="feature-card fade-up">
                <div className="feature-card-icon">🔐</div>
                <h3>Secure Digital Vault</h3>
                <p>
                  Store passwords, keys, and documents with end-to-end AES-256 encryption.
                  Zero-knowledge by design.
                </p>
              </div>
              <div className="feature-card fade-up stagger-2">
                <div className="feature-card-icon">🤖</div>
                <h3>AI Document Verification</h3>
                <p>
                  Upload legal documents. AI verifies authenticity using OCR, fraud detection, and
                  identity cross-checks.
                </p>
              </div>
              <div className="feature-card fade-up stagger-3">
                <div className="feature-card-icon">⛓</div>
                <h3>Blockchain Proof</h3>
                <p>
                  Cryptographic hash notarization ensures tamper-proof, immutable records that
                  courts and institutions trust.
                </p>
              </div>
              <div className="feature-card fade-up stagger-4">
                <div className="feature-card-icon">👥</div>
                <h3>Nominee Access System</h3>
                <p>
                  Safe, verifiable transfer of assets through multi-step triggers. Your nominees get
                  access when it matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section">
          <div className="section-inner text-center">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">Four steps to complete peace of mind</h2>
            <p className="section-sub" style={{ margin: "0 auto 0" }}>
              Getting started takes minutes. Your protection lasts forever.
            </p>
            <div className="timeline">
              <div className="timeline-step fade-up">
                <div className="step-num">1</div>
                <h3>Create Your Secure Vault</h3>
                <p>Sign up and initialize your encrypted vault with zero-knowledge architecture.</p>
              </div>
              <div className="timeline-step fade-up stagger-2">
                <div className="step-num">2</div>
                <h3>Add Assets & Nominees</h3>
                <p>
                  Upload passwords, crypto keys, documents. Designate trusted nominees with access
                  tiers.
                </p>
              </div>
              <div className="timeline-step fade-up stagger-3">
                <div className="step-num">3</div>
                <h3>AI Verifies Documents</h3>
                <p>
                  Our AI cross-checks legal documents for authenticity and fraud markers
                  automatically.
                </p>
              </div>
              <div className="timeline-step fade-up stagger-4">
                <div className="step-num">4</div>
                <h3>Assets Released on Trigger</h3>
                <p>
                  Dead-man switch or verified death certificate triggers secure, step-by-step asset
                  release.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="container text-center">
            <h2>Protect your digital legacy today.</h2>
            <p>Join thousands of families securing their digital future with TRUSTIX.</p>
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started — It's Free
            </button>
          </div>
        </section>
      </div>

      {/* PAGE 2: FEATURES */}
      <div className={`page ${activePage === "features" ? "active" : ""}`} id="page-features">
        <div className="features-hero">
          <div className="section-label">Platform Features</div>
          <h1 className="section-title" style={{ color: "white", marginBottom: "1rem" }}>
            Everything you need to<br />protect your digital legacy
          </h1>
          <p className="section-sub" style={{ color: "rgba(255,255,255,0.6)", margin: "0 auto 0" }}>
            Enterprise-grade security features combined with consumer-friendly simplicity.
          </p>
        </div>

        <div className="feature-group" style={{ background: "white", padding: "80px 5%" }}>
          <div className="container">
            <div className="feature-group-title">
              <div className="group-icon">🛡</div>
              <h2>Security Infrastructure</h2>
            </div>
            <div className="feature-list">
              <div className="feature-pill"><span className="check">✓</span>End-to-end AES-256 encryption</div>
              <div className="feature-pill"><span className="check">✓</span>Zero-knowledge storage</div>
              <div className="feature-pill"><span className="check">✓</span>Supabase secure authentication</div>
              <div className="feature-pill"><span className="check">✓</span>Google Cloud secure storage</div>
              <div className="feature-pill"><span className="check">✓</span>Multi-factor authentication</div>
              <div className="feature-pill"><span className="check">✓</span>Encrypted key sharding</div>
              <div className="feature-pill"><span className="check">✓</span>SOC 2 compliant infrastructure</div>
              <div className="feature-pill"><span className="check">✓</span>Real-time breach monitoring</div>
            </div>
          </div>
        </div>

        <div className="feature-group" style={{ background: "var(--off-white)", padding: "80px 5%" }}>
          <div className="container">
            <div className="feature-group-title">
              <div className="group-icon">🤖</div>
              <h2>AI Verification Engine</h2>
            </div>
            <div className="feature-list">
              <div className="feature-pill"><span className="check">✓</span>Google Vision OCR processing</div>
              <div className="feature-pill"><span className="check">✓</span>Fraud detection scoring</div>
              <div className="feature-pill"><span className="check">✓</span>Identity document verification</div>
              <div className="feature-pill"><span className="check">✓</span>Death certificate verification</div>
              <div className="feature-pill"><span className="check">✓</span>Liveness detection checks</div>
              <div className="feature-pill"><span className="check">✓</span>Automated document parsing</div>
              <div className="feature-pill"><span className="check">✓</span>Notarial cross-referencing</div>
              <div className="feature-pill"><span className="check">✓</span>Continuous AI model updates</div>
            </div>
          </div>
        </div>

        <div className="feature-group" style={{ background: "white", padding: "80px 5%" }}>
          <div className="container">
            <div className="feature-group-title">
              <div className="group-icon">⛓</div>
              <h2>Blockchain Integration</h2>
            </div>
            <div className="feature-list">
              <div className="feature-pill"><span className="check">✓</span>MetaMask wallet connection</div>
              <div className="feature-pill"><span className="check">✓</span>Cryptographic signature proof</div>
              <div className="feature-pill"><span className="check">✓</span>Immutable hash storage</div>
              <div className="feature-pill"><span className="check">✓</span>Multi-chain support</div>
              <div className="feature-pill"><span className="check">✓</span>Smart contract triggers</div>
              <div className="feature-pill"><span className="check">✓</span>On-chain audit trail</div>
            </div>
          </div>
        </div>

        <div className="feature-group" style={{ background: "var(--off-white)", padding: "80px 5%" }}>
          <div className="container">
            <div className="feature-group-title">
              <div className="group-icon">👥</div>
              <h2>Smart Inheritance</h2>
            </div>
            <div className="feature-list">
              <div className="feature-pill"><span className="check">✓</span>Dead-man switch automation</div>
              <div className="feature-pill"><span className="check">✓</span>Nominee approval workflow</div>
              <div className="feature-pill"><span className="check">✓</span>Multi-step verification</div>
              <div className="feature-pill"><span className="check">✓</span>Tiered access levels</div>
              <div className="feature-pill"><span className="check">✓</span>Revocable permissions</div>
              <div className="feature-pill"><span className="check">✓</span>Dispute resolution tools</div>
              <div className="feature-pill"><span className="check">✓</span>Legal document attachments</div>
              <div className="feature-pill"><span className="check">✓</span>Executor management dashboard</div>
            </div>
          </div>
        </div>

        <section className="cta-section">
          <div className="container text-center">
            <h2>Ready to explore the platform?</h2>
            <p>Start free. No credit card required.</p>
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started Free
            </button>
          </div>
        </section>
      </div>

      {/* PAGE 3: SECURITY */}
      <div className={`page ${activePage === "security" ? "active" : ""}`} id="page-security">
        <div className="security-hero">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="section-label">Security & Trust</div>
            <h1>Built like a cybersecurity product.</h1>
            <p>
              We designed TRUSTIX with the same standards as enterprise security software — because
              your legacy deserves nothing less.
            </p>
          </div>
        </div>

        <div className="security-cards">
          <div className="sec-grid">
            <div className="sec-card fade-up">
              <div className="sec-icon">👁🗨</div>
              <h3>Zero-Knowledge Architecture</h3>
              <p>
                We cannot see your data. Only encrypted blobs are stored on our servers. Your keys
                never leave your device unencrypted. Even our engineers have zero access to your
                vault contents.
              </p>
            </div>
            <div className="sec-card fade-up stagger-2">
              <div className="sec-icon">🔐</div>
              <h3>End-to-End Encryption</h3>
              <p>
                Data is encrypted in your browser using AES-256-GCM before it ever reaches our
                servers. Your master key is derived from your password using PBKDF2 — never
                transmitted.
              </p>
            </div>
            <div className="sec-card fade-up stagger-3">
              <div className="sec-icon">☁️</div>
              <h3>Private Cloud Storage</h3>
              <p>
                Encrypted files are stored in isolated Google Cloud buckets with VPC-level access
                controls, audit logging, and automatic versioning. Your data lives in military-grade
                infrastructure.
              </p>
            </div>
            <div className="sec-card fade-up stagger-4">
              <div className="sec-icon">⛓</div>
              <h3>Immutable Blockchain Proof</h3>
              <p>
                Every document and action is cryptographically hashed and anchored on-chain. Any
                tampering is immediately detectable. Your records are permanent and
                court-admissible.
              </p>
            </div>
            <div className="sec-card fade-up">
              <div className="sec-icon">🤖</div>
              <h3>AI Fraud Prevention</h3>
              <p>
                Our verification AI scores every document for signs of forgery, manipulation, and
                inconsistency. Identity claims are cross-referenced against multiple data sources
                before any release.
              </p>
            </div>
            <div className="sec-card fade-up stagger-2">
              <div className="sec-icon">🛡</div>
              <h3>SOC 2 & Compliance</h3>
              <p>
                TRUSTIX infrastructure is SOC 2 Type II certified. We undergo regular third-party
                penetration testing and maintain full compliance with GDPR and CCPA data
                protection regulations.
              </p>
            </div>
          </div>

          <div style={{ maxWidth: "1100px", margin: "4rem auto 0", padding: "0 0 2rem" }}>
            <div className="legal-box">
              <div className="legal-icon">⚠️</div>
              <div>
                <h3>Legal Disclaimer</h3>
                <p>
                  Trustix is an AI-assisted platform and does not replace a legally executed will or
                  estate planning documents. While our platform uses blockchain verification and AI
                  document analysis, we strongly recommend consulting a licensed attorney for
                  comprehensive estate planning. TRUSTIX serves as a secure digital supplement to
                  traditional legal instruments, not a substitute.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="cta-section">
          <div className="container text-center">
            <h2>Your security is our obsession.</h2>
            <p>Start with our free tier and experience enterprise-grade protection.</p>
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started Free
            </button>
          </div>
        </section>
      </div>

      {/* PAGE 4: PRICING */}
      <div className={`page ${activePage === "pricing" ? "active" : ""}`} id="page-pricing">
        <div className="pricing-hero">
          <div className="section-label">Pricing</div>
          <h1 className="section-title">Simple, transparent pricing</h1>
          <p className="section-sub" style={{ margin: "0 auto" }}>
            Start free. Upgrade when you need more. Cancel anytime.
          </p>

          <div className="toggle-wrap">
            <span className={`toggle-label ${!yearly ? "active" : ""}`} id="label-monthly">
              Monthly
            </span>
            <button
              className={`toggle ${yearly ? "yearly" : ""}`}
              id="billingToggle"
              onClick={toggleBilling}
            ></button>
            <span className={`toggle-label ${yearly ? "active" : ""}`} id="label-yearly">
              Yearly <span className="save-badge">Save 20%</span>
            </span>
          </div>
        </div>

        <div
          className="pricing-cards"
          style={{
            display: "grid",
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px 5% 100px",
          }}
        >
          {/* BASIC */}
          <div className="price-card fade-up">
            <div className="plan-name">Basic</div>
            <div className="plan-price">
              $0<span className="plan-period" style={{ fontSize: "1.2rem" }}>/mo</span>
            </div>
            <div className="plan-period">Free forever</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>Limited vault entries (up to 10)</li>
              <li>1 nominee</li>
              <li>Basic AES encryption</li>
              <li>Email support</li>
              <li>1 GB secure storage</li>
            </ul>
            <button className="btn-outline w-100" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>

          {/* PRO */}
          <div className="price-card popular fade-up stagger-2">
            <div className="popular-badge">⭐ Most Popular</div>
            <div className="plan-name">Pro</div>
            <div className="plan-price" id="pro-price">
              {yearly ? "$7" : "$9"}
              <span style={{ fontSize: "1.2rem", fontWeight: 400 }}>/mo</span>
            </div>
            <div className="plan-period">Billed monthly</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>Unlimited vault entries</li>
              <li>AI document verification</li>
              <li>Blockchain proof generation</li>
              <li>Dead-man switch automation</li>
              <li>Up to 3 nominees</li>
              <li>Priority support</li>
              <li>50 GB secure storage</li>
            </ul>
            <button className="btn-primary w-100" onClick={handleGetStarted}>
              Start Pro
            </button>
          </div>

          {/* FAMILY */}
          <div className="price-card fade-up stagger-3">
            <div className="plan-name">Family</div>
            <div className="plan-price" id="fam-price">
              {yearly ? "$15" : "$19"}
              <span className="plan-period" style={{ fontSize: "1.2rem" }}>/mo</span>
            </div>
            <div className="plan-period">Billed monthly</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>Family accounts (up to 5 users)</li>
              <li>Multiple nominees per account</li>
              <li>Priority AI verification</li>
              <li>Advanced fraud detection</li>
              <li>Shared family vault</li>
              <li>Premium concierge support</li>
              <li>200 GB secure storage</li>
            </ul>
            <button className="btn-primary w-100" onClick={handleGetStarted}>
              Go Premium
            </button>
          </div>
        </div>

        {/* Trust indicators under pricing */}
        <div style={{ background: "var(--off-white)", padding: "60px 5%", textAlign: "center" }}>
          <div
            className="trust-inner"
            style={{
              display: "flex",
              gap: "2.5rem",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            <div className="trust-item">
              <span>🔒</span>
              <span>256-bit Encryption</span>
            </div>
            <div className="trust-item">
              <span>💳</span>
              <span>No Hidden Fees</span>
            </div>
            <div className="trust-item">
              <span>🔄</span>
              <span>Cancel Anytime</span>
            </div>
            <div className="trust-item">
              <span>🛡</span>
              <span>SOC 2 Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL FOOTER */}
      <footer id="global-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="footer-logo" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src="/logo.png" alt="Trustix Logo" style={{ height: "40px", width: "auto" }} />
                TRUSTIX
              </span>
              <p className="footer-tagline">
                Securing digital legacies for families around the world. Your assets, protected and
                preserved.
              </p>
              <div className="social-row">
                <a className="social-btn" title="Twitter">𝕏</a>
                <a className="social-btn" title="LinkedIn">in</a>
                <a className="social-btn" title="GitHub">⌥</a>
                <a className="social-btn" title="Discord">◈</a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Product</h4>
              <a onClick={() => handleShowPage("features")}>Features</a>
              <a onClick={() => handleShowPage("security")}>Security</a>
              <a onClick={() => handleShowPage("pricing")}>Pricing</a>
              <a>Changelog</a>
            </div>

            <div className="footer-col">
              <h4>Developers</h4>
              <a>API Reference</a>
              <a>Documentation</a>
              <a>SDK</a>
              <a>Webhooks</a>
            </div>

            <div className="footer-col">
              <h4>About</h4>
              <a>Blog</a>
              <a>Careers</a>
              <a>Contact</a>
              <a>Privacy Policy</a>
              <a>Terms of Service</a>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <span>© 2025 TRUSTIX Inc. All rights reserved.</span>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <a>Privacy</a>
              <a>Terms</a>
              <a>Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
