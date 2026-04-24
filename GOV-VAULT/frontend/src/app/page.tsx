'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, FileText, Users, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: <Shield className="h-6 w-6 text-indigo-400" />,
    title: 'Secure Registration',
    desc: 'AES-256 encrypted Aadhaar and PAN with multi-layer fraud detection.',
  },
  {
    icon: <Sparkles className="h-6 w-6 text-violet-400" />,
    title: 'AI Scheme Discovery',
    desc: 'Scheme Saathi recommends top government schemes tailored to your family profile.',
  },
  {
    icon: <FileText className="h-6 w-6 text-cyan-400" />,
    title: 'Claim Tracking',
    desc: 'Submit and monitor welfare claims with full audit trail and AI source tracking.',
  },
  {
    icon: <Users className="h-6 w-6 text-emerald-400" />,
    title: 'Admin Oversight',
    desc: 'Real-time approval queues, analytics, and recommendation conversion metrics.',
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Welfare Management
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
            <span className="text-gradient">GOV-VAULT</span>
            <br />
            <span className="text-slate-700">Welfare Made Intelligent</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
            Register your family, discover eligible government schemes powered by AI,
            and track claims — all in one secure, encrypted platform.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all"
            >
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[var(--gov-blue)] px-8 py-3.5 text-base font-medium text-[var(--gov-blue)] hover:bg-slate-50 transition-all shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {[
            { label: 'Encryption', value: 'AES-256' },
            { label: 'AI Engine', value: 'Scheme Saathi' },
            { label: 'Fraud Layers', value: 'Multi-Layer' },
            { label: 'Audit Trail', value: 'Full Trace' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-[var(--gov-blue)]">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-[var(--gov-blue)] sm:text-4xl">
            Built for Every Citizen
          </h2>
          <p className="mt-3 text-slate-600 font-medium">
            Transparent, secure, and AI-powered from registration to claim.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
                {f.icon}
              </div>
              <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-[var(--gov-blue)] h-1.5 w-full"/>
          <CheckCircle className="mx-auto mb-4 h-10 w-10 text-[var(--gov-blue)]" />
          <h2 className="mb-3 text-2xl font-bold text-[var(--gov-blue)]">
            Ready to register your family?
          </h2>
          <p className="mb-6 text-slate-600 font-medium">
            Takes 5 minutes. Secure by default. AI finds your eligible schemes automatically.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Register Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
