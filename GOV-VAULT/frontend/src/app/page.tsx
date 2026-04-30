'use client';

import Link from 'next/link';
import { Shield, Sparkles, FileText, Users, ArrowRight, CheckCircle, Lock, Activity } from 'lucide-react';

const features = [
  {
    icon: <Shield size={22} />,
    color: '#1a3a5c',
    bg: '#e8f0f8',
    title: 'Encrypted Identity Vault',
    desc: 'AES-256 encryption for Aadhaar and PAN. Multi-layer fraud detection protects every registration.',
  },
  {
    icon: <Sparkles size={22} />,
    color: '#7c3aed',
    bg: '#ede9fe',
    title: 'AI Scheme Discovery',
    desc: 'Scheme Saathi AI recommends the top government welfare schemes matched to your family profile.',
  },
  {
    icon: <FileText size={22} />,
    color: '#0369a1',
    bg: '#e0f2fe',
    title: 'Claim Management',
    desc: 'Submit and track welfare claims with a full audit trail and real-time status updates.',
  },
  {
    icon: <Activity size={22} />,
    color: '#15803d',
    bg: '#dcfce7',
    title: 'Admin Oversight',
    desc: 'Live approval queues, analytics dashboards, and recommendation conversion metrics.',
  },
];

const steps = [
  { num: '01', title: 'Register Account', desc: 'Create a secure account with strong password protection.' },
  { num: '02', title: 'Register Family', desc: 'Add all family members with Aadhaar verification for the head.' },
  { num: '03', title: 'Admin Approval', desc: 'Your registration is reviewed and approved by an administrator.' },
  { num: '04', title: 'Get Recommendations', desc: 'AI engine finds the best matching government schemes for your family.' },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-page)' }}>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--gov-blue)' }} className="relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            {/* Pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{ background: 'rgba(201,162,39,0.2)', color: 'var(--gov-gold)', border: '1px solid rgba(201,162,39,0.35)' }}>
              <Sparkles size={14} />
              AI-Powered Welfare Management
            </div>

            <h1 className="mb-6 text-5xl sm:text-6xl font-black leading-tight text-white">
              PARIVAR-<span style={{ color: 'var(--gov-gold)' }}>NETRA</span>
              <br />
              <span className="text-3xl sm:text-4xl font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Unified Family Governance System
              </span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Register your family, discover eligible government schemes powered by deep learning,
              and track welfare claims — all in one secure, government-grade platform.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/register"
                style={{ background: 'var(--gov-gold)', color: 'var(--gov-blue)', borderRadius: 8 }}
                className="flex items-center gap-2 px-7 py-3.5 font-bold text-base hover:brightness-110 transition-all shadow-lg">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link href="/login"
                className="flex items-center gap-2 px-7 py-3.5 font-semibold text-base rounded-lg transition-all"
                style={{ border: '1.5px solid rgba(255,255,255,0.35)', color: 'white' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Sign In
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: <Lock size={14} />, text: 'AES-256 Encrypted' },
                { icon: <Shield size={14} />, text: 'Government Grade' },
                { icon: <CheckCircle size={14} />, text: 'Full Audit Trail' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {b.icon} {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{ background: 'var(--gov-blue-dark)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="mx-auto max-w-6xl px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: 'AES-256', label: 'Encryption Standard' },
            { value: 'Groq LLM', label: 'AI Inference Engine' },
            { value: 'Pinecone', label: 'Vector Search DB' },
            { value: '100%', label: 'Audit Traced' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black" style={{ color: 'var(--gov-gold)' }}>{s.value}</div>
              <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black mb-3" style={{ color: 'var(--gov-blue)' }}>Built for Every Indian Citizen</h2>
          <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>Transparent, secure, and AI-powered from registration to claim settlement.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(f => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-all"
              style={{ borderTop: `3px solid ${f.color}` }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
                style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: '#eef2f7', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black mb-3" style={{ color: 'var(--gov-blue)' }}>How It Works</h2>
            <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>Four simple steps to access all government welfare benefits.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px z-0"
                    style={{ background: 'var(--border-strong)' }} />
                )}
                <div className="relative z-10">
                  <div className="text-5xl font-black mb-4" style={{ color: 'rgba(26,58,92,0.12)' }}>{s.num}</div>
                  <div className="h-2 w-8 rounded-full mb-4" style={{ background: 'var(--gov-gold)' }} />
                  <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="card-elevated p-10 text-center"
          style={{ borderTop: '4px solid var(--gov-blue)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: '#e8f0f8', color: 'var(--gov-blue)' }}>
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--gov-blue)' }}>
            Ready to Register Your Family?
          </h2>
          <p className="mb-8 max-w-lg mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            Takes 5 minutes. Secure by default. Our AI automatically finds your eligible government welfare schemes.
          </p>
          <Link href="/register"
            style={{ background: 'var(--gov-blue)', color: 'white', borderRadius: 8 }}
            className="inline-flex items-center gap-2 px-8 py-3.5 font-bold text-base hover:brightness-110 transition-all shadow-md">
            Register Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--gov-blue)', borderTop: '2px solid var(--gov-gold)' }} className="py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--gov-gold)', borderRadius: 5 }}
              className="flex h-7 w-7 items-center justify-center">
              <Shield size={16} style={{ color: 'var(--gov-blue)' }} />
            </div>
            <span className="font-black text-white">PARIVAR<span style={{ color: 'var(--gov-gold)' }}>-NETRA</span></span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            © 2026 GOV-VAULT. Unified Family Governance System. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
