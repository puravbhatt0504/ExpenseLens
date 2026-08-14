'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useVelocity } from 'framer-motion';
import { ArrowRight, Hexagon, BarChart3, Shield, Zap, Smartphone } from 'lucide-react';
import { ReactLenis } from 'lenis/react';

const SkewContainer = ({ children }) => {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  const skew = useTransform(smoothVelocity, [-1000, 1000], [5, -5]);

  return (
    <motion.div style={{ skewY: skew, transformOrigin: "center" }} className="w-full">
      {children}
    </motion.div>
  );
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const scaleImage = useTransform(scrollYProgress, [0, 0.5], [1, 1.05]);
  const opacityText = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <main className="min-h-[200vh] bg-background grid-bg overflow-hidden relative">
        <nav className="fixed top-0 left-0 right-0 h-16 flex justify-between items-center px-8 z-50 bg-background/70 backdrop-blur-xl border-b border-border">
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

        <section className="min-h-screen flex flex-col justify-center items-center text-center relative pt-48 pb-20">
          <div className="page-container relative z-10 w-full flex flex-col items-center">
            
            <motion.div style={{ opacity: opacityText, y: yText }} className="flex flex-col items-center will-change-transform">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
                className="px-4 py-1.5 rounded-full border border-border bg-surface text-xs font-semibold tracking-wide text-text-muted mb-8 shadow-sm"
              >
                Introducing ExpenseLens 2.0
              </motion.div>
              
              <h1 className="text-[clamp(3.5rem,7vw,6.5rem)] font-bold tracking-tighter leading-[1] mb-6 text-foreground max-w-[1000px] overflow-hidden">
                <motion.span initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="block">Financial intelligence,</motion.span>
                <motion.span initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="block text-text-muted">simplified.</motion.span>
              </h1>
              
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="text-xl text-text-muted max-w-[650px] mx-auto mb-10 leading-relaxed font-medium">
                A professional suite to track, analyze, and optimize your financial operations. Built for speed, designed for clarity.
              </motion.p>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex gap-4 justify-center items-center flex-wrap">
                <Link href="/login" className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                  Start Tracking <ArrowRight size={16} />
                </Link>
                <a href="/expenselens.apk" download className="btn-secondary flex items-center gap-2 px-6 py-3 text-sm bg-black text-white border-black hover:bg-black/90 hover:text-white transition-all shadow-md">
                  <Smartphone size={16} /> Download App
                </a>
                <Link href="#features" className="btn-secondary px-6 py-3 text-sm">
                  Explore Features
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              style={{ y: parallaxY, scale: scaleImage }}
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[1100px] mt-24 relative glow-effect will-change-transform"
            >
              <div className="bg-white rounded-2xl border border-border shadow-[0_40px_80px_rgba(0,0,0,0.08)] h-[650px] p-2 flex flex-col overflow-hidden">
                <div className="h-10 border-b border-border flex items-center px-5 gap-2.5 mb-4 bg-surface/50">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex gap-6 h-full px-5 pb-5">
                  <div className="w-[240px] h-full bg-surface rounded-xl border border-border/50 p-6 flex flex-col gap-4">
                    <div className="h-4 w-2/3 bg-black/10 rounded mb-8" />
                    <div className="h-8 w-full bg-black/5 rounded-md" />
                    <div className="h-8 w-5/6 bg-black/5 rounded-md" />
                    <div className="h-8 w-full bg-black/5 rounded-md" />
                    <div className="h-8 w-4/5 bg-black/5 rounded-md" />
                    <div className="mt-auto h-12 w-full bg-black rounded-lg" />
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-6 pt-2">
                    <div className="flex gap-6 h-40">
                      <div className="flex-1 bg-surface rounded-2xl border border-border/50 p-6 flex flex-col justify-between">
                        <div className="h-3 w-1/2 bg-black/20 rounded" />
                        <div className="text-4xl font-bold font-sans tracking-tight">₹45,200</div>
                        <div className="h-2.5 w-full bg-black/10 rounded-full mt-2 overflow-hidden">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "75%" }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }} className="h-full bg-[#e00] rounded-full" />
                        </div>
                      </div>
                      <div className="flex-1 bg-surface rounded-2xl border border-border/50 p-6 flex flex-col justify-between">
                        <div className="h-3 w-1/2 bg-black/20 rounded" />
                        <div className="text-4xl font-bold font-sans tracking-tight">34</div>
                        <div className="h-2.5 w-2/3 bg-black/10 rounded-full mt-2" />
                      </div>
                      <div className="flex-1 bg-surface rounded-2xl border border-border/50 p-6 flex flex-col justify-between">
                        <div className="h-3 w-1/2 bg-black/20 rounded" />
                        <div className="flex gap-3 items-end h-[60px]">
                          <motion.div initial={{ height: 0 }} whileInView={{ height: "40%" }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex-1 bg-black/80 rounded-t-md" />
                          <motion.div initial={{ height: 0 }} whileInView={{ height: "70%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }} className="flex-1 bg-black/20 rounded-t-md" />
                          <motion.div initial={{ height: 0 }} whileInView={{ height: "30%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="flex-1 bg-black/40 rounded-t-md" />
                          <motion.div initial={{ height: 0 }} whileInView={{ height: "100%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="flex-1 bg-black/60 rounded-t-md" />
                          <motion.div initial={{ height: 0 }} whileInView={{ height: "60%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="flex-1 bg-[#2e7d32] rounded-t-md" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-surface rounded-2xl border border-border/50 p-6 flex flex-col gap-4 overflow-hidden">
                      <div className="h-5 w-1/3 bg-black/20 rounded mb-4" />
                      <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex justify-between items-center p-4 border border-border rounded-xl bg-white shadow-sm">
                        <div className="flex gap-4 items-center"><div className="w-10 h-10 rounded-full bg-[#f0f0f0]" /><div className="h-4 w-32 bg-black/20 rounded" /></div>
                        <div className="h-5 w-16 bg-black/80 rounded" />
                      </motion.div>
                      <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex justify-between items-center p-4 border border-border rounded-xl bg-white shadow-sm">
                        <div className="flex gap-4 items-center"><div className="w-10 h-10 rounded-full bg-[#f0f0f0]" /><div className="h-4 w-24 bg-black/20 rounded" /></div>
                        <div className="h-5 w-20 bg-black/80 rounded" />
                      </motion.div>
                      <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex justify-between items-center p-4 border border-border rounded-xl bg-white shadow-sm">
                        <div className="flex gap-4 items-center"><div className="w-10 h-10 rounded-full bg-[#f0f0f0]" /><div className="h-4 w-40 bg-black/20 rounded" /></div>
                        <div className="h-5 w-12 bg-black/80 rounded" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-40 bg-white border-t border-border relative z-20 overflow-hidden">
          <div className="page-container">
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-32"
            >
              <h2 className="text-[clamp(3rem,5vw,4.5rem)] font-bold tracking-tighter mb-6 text-foreground leading-[1.1]">
                Enterprise-grade <br/>
                <span className="text-text-muted">functionality.</span>
              </h2>
              <p className="text-text-muted font-medium max-w-[650px] mx-auto text-xl">
                Everything you need to maintain complete visibility and control over your financial data.
              </p>
            </motion.div>

            <SkewContainer>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
                <motion.div 
                  whileHover={{ y: -15, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-surface p-12 rounded-[2rem] border border-border/50 flex flex-col items-start gap-8"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-border text-foreground shadow-sm">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">AI Extraction</h3>
                  <p className="text-text-muted font-medium leading-relaxed text-lg">Automated receipt scanning extracts amounts, dates, and categories with blazing high precision natively on your device.</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -15, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-surface p-12 rounded-[2rem] border border-border/50 flex flex-col items-start gap-8 md:mt-24"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-border text-foreground shadow-sm">
                    <BarChart3 size={28} />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">Advanced Analytics</h3>
                  <p className="text-text-muted font-medium leading-relaxed text-lg">Real-time charts and categorical breakdowns provide actionable insights into your cash flow immediately.</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -15, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-surface p-12 rounded-[2rem] border border-border/50 flex flex-col items-start gap-8 md:mt-48"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-border text-foreground shadow-sm">
                    <Shield size={28} />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">Smart Budgets</h3>
                  <p className="text-text-muted font-medium leading-relaxed text-lg">Establish custom limits per category. Proactive alerts prevent overspending before it even happens.</p>
                </motion.div>
              </div>
            </SkewContainer>
          </div>
        </section>

        <footer className="py-16 border-t border-border bg-surface text-center text-sm font-medium text-text-muted relative z-20">
          <p>&copy; 2026 ExpenseLens. All rights reserved.</p>
        </footer>
      </main>
    </ReactLenis>
  );
}
