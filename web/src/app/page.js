'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Hexagon, BarChart3, Shield, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const featuresRef = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }, featuresRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-background grid-bg">
      <nav className="fixed top-0 left-0 right-0 h-16 flex justify-between items-center px-8 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
          <Hexagon size={20} className="fill-black text-black" />
          ExpenseLens
        </div>
        <div className="flex gap-6 items-center text-sm font-medium text-text-muted">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="/login" className="text-foreground hover:text-text-muted transition-colors">Log In</Link>
          <Link href="/login" className="btn-primary py-1.5 px-4 text-xs">Get Started</Link>
        </div>
      </nav>

      <section className="min-h-[85vh] flex flex-col justify-center items-center text-center relative overflow-hidden pt-32 pb-20">
        <div className="page-container relative z-10 w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="px-3 py-1 rounded-full border border-border bg-surface text-xs font-semibold tracking-wide text-text-muted mb-8 shadow-sm">
              Introducing ExpenseLens 2.0
            </div>
            
            <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-bold tracking-tighter leading-[1.05] mb-6 text-foreground max-w-[900px]">
              Financial intelligence, <br />
              <span className="text-text-muted">simplified.</span>
            </h1>
            <p className="text-lg text-text-muted max-w-[600px] mx-auto mb-10 leading-relaxed font-medium">
              A professional suite to track, analyze, and optimize your financial operations. Built for speed, designed for clarity.
            </p>
            
            <div className="flex gap-4 justify-center items-center">
              <Link href="/login" className="btn-primary flex items-center gap-2">
                Start Tracking <ArrowRight size={16} />
              </Link>
              <Link href="#features" className="btn-secondary">
                Explore Features
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-[1000px] mt-20 relative glow-effect"
          >
            <div className="bg-white rounded-xl border border-border shadow-[0_20px_40px_rgba(0,0,0,0.08)] h-[500px] p-2 flex flex-col">
              <div className="h-8 border-b border-border flex items-center px-4 gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <div className="flex gap-4 h-full px-4 pb-4">
                {/* Sidebar Mock */}
                <div className="w-1/4 h-full bg-surface rounded-lg border border-border/50 p-4 flex flex-col gap-3">
                  <div className="h-4 w-2/3 bg-black/10 rounded mb-4" />
                  <div className="h-6 w-full bg-black/5 rounded" />
                  <div className="h-6 w-5/6 bg-black/5 rounded" />
                  <div className="h-6 w-full bg-black/5 rounded" />
                  <div className="h-6 w-4/5 bg-black/5 rounded" />
                  <div className="mt-auto h-8 w-full bg-black rounded" />
                </div>
                
                {/* Main Content Mock */}
                <div className="w-3/4 flex flex-col gap-4">
                  {/* Top Stats Cards */}
                  <div className="flex gap-4 h-32">
                    <div className="flex-1 bg-surface rounded-lg border border-border/50 p-4 flex flex-col justify-between">
                      <div className="h-3 w-1/2 bg-black/20 rounded" />
                      <div className="text-3xl font-bold font-sans tracking-tight">₹45,200</div>
                      <div className="h-2 w-full bg-black/10 rounded mt-2">
                        <div className="h-full w-3/4 bg-[#e00] rounded" />
                      </div>
                    </div>
                    <div className="flex-1 bg-surface rounded-lg border border-border/50 p-4 flex flex-col justify-between">
                      <div className="h-3 w-1/2 bg-black/20 rounded" />
                      <div className="text-3xl font-bold font-sans tracking-tight">34</div>
                      <div className="h-3 w-2/3 bg-black/10 rounded mt-2" />
                    </div>
                    <div className="flex-1 bg-surface rounded-lg border border-border/50 p-4 flex flex-col justify-between">
                      <div className="h-3 w-1/2 bg-black/20 rounded" />
                      <div className="flex gap-2 items-end">
                        <div className="w-4 h-8 bg-black/80 rounded-t-sm" />
                        <div className="w-4 h-12 bg-black/20 rounded-t-sm" />
                        <div className="w-4 h-6 bg-black/40 rounded-t-sm" />
                        <div className="w-4 h-10 bg-black/60 rounded-t-sm" />
                      </div>
                    </div>
                  </div>
                  
                  {/* List Mock */}
                  <div className="flex-1 bg-surface rounded-lg border border-border/50 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="h-4 w-1/3 bg-black/20 rounded mb-2" />
                    <div className="flex justify-between items-center p-2 border border-border rounded">
                      <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-[#f0f0f0]" /><div className="h-3 w-24 bg-black/20 rounded" /></div>
                      <div className="h-3 w-12 bg-black/80 rounded" />
                    </div>
                    <div className="flex justify-between items-center p-2 border border-border rounded">
                      <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-[#f0f0f0]" /><div className="h-3 w-20 bg-black/20 rounded" /></div>
                      <div className="h-3 w-16 bg-black/80 rounded" />
                    </div>
                    <div className="flex justify-between items-center p-2 border border-border rounded">
                      <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-[#f0f0f0]" /><div className="h-3 w-28 bg-black/20 rounded" /></div>
                      <div className="h-3 w-10 bg-black/80 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-32 bg-surface border-t border-border" ref={featuresRef}>
        <div className="page-container">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
              Enterprise-grade functionality.
            </h2>
            <p className="text-text-muted font-medium max-w-[600px] mx-auto">
              Everything you need to maintain complete visibility and control over your financial data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card bg-white p-8 rounded-xl border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border text-foreground">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">AI Extraction</h3>
              <p className="text-text-muted font-medium leading-relaxed text-sm">Automated receipt scanning extracts amounts, dates, and categories with high precision.</p>
            </div>

            <div className="feature-card bg-white p-8 rounded-xl border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border text-foreground">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Advanced Analytics</h3>
              <p className="text-text-muted font-medium leading-relaxed text-sm">Real-time charts and categorical breakdowns provide actionable insights into your cash flow.</p>
            </div>

            <div className="feature-card bg-white p-8 rounded-xl border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border text-foreground">
                <Shield size={20} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Smart Budgets</h3>
              <p className="text-text-muted font-medium leading-relaxed text-sm">Establish custom limits per category. Proactive alerts prevent overspending.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border bg-white text-center text-sm font-medium text-text-muted">
        <p>&copy; 2026 ExpenseLens. All rights reserved.</p>
      </footer>
    </main>
  );
}
