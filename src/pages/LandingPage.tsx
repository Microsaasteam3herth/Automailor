import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Zap, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Target, 
  ShieldCheck,
  Play,
  Sparkles,
  Loader2,
  Globe,
  Cpu,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onSignIn: () => void;
}

// 3D Video Component using Veo
const HeroVideo = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>("https://cdn.create.vista.com/api/media/medium/831882430/stock-video-futuristic-robot-hand-reaches-interact-digital-email-interface-illustrating-advanced?token=");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate3DVideo = async () => {
    try {
      if (!(window as any).aistudio?.hasSelectedApiKey()) {
        await (window as any).aistudio?.openSelectKey();
      }

      setIsGenerating(true);
      setError(null);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A 3D cinematic animation of a crystalline letter envelope unfolding into a digital stream of golden data particles, representing high-value automated outreach, dark luxury aesthetic, 4k, slow motion, hyper-realistic',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await (ai as any).operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': (process.env as any).API_KEY || '',
          },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error("Video generation failed:", err);
      setError("Failed to load 3D visual.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {videoUrl ? (
        <video 
          src={videoUrl}
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-50 brightness-[0.4]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-black to-black" />
      )}
      
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
          <p className="text-emerald-400 font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
            Synthesizing 3D Visual Assets...
          </p>
        </div>
      )}
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="text-2xl font-serif italic font-light group-hover:text-emerald-400 transition-colors">{question}</span>
        {isOpen ? <ChevronUp className="text-neutral-500" /> : <ChevronDown className="text-neutral-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-neutral-400 mt-6 text-xl leading-relaxed font-light">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const whatWeDoRef = useRef<HTMLDivElement>(null);
  const methodologyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations
      gsap.from('.hero-title', {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        stagger: 0.2
      });

      // Scroll Triggered Animations
      gsap.from('.reveal-up', {
        scrollTrigger: {
          trigger: '.reveal-up',
          start: 'top 85%',
        },
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.3
      });

      // Parallax for floating cards
      gsap.to('.parallax-card', {
        scrollTrigger: {
          trigger: '.parallax-card',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        },
        y: -100,
        ease: 'none'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.04] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E')] mix-blend-overlay" />
      
      {/* 3D Hero Section */}
      <section ref={heroRef} className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <HeroVideo />

        <div className="relative z-10 text-center max-w-6xl">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-[0.3em] mb-12 backdrop-blur-2xl">
            <Sparkles size={18} />
            <span>Smart AI Email Outreach</span>
          </div>
          
          <h1 className="hero-title text-8xl md:text-[12rem] font-serif italic font-light tracking-tighter mb-10 leading-[0.75] lowercase">
            Grow <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-500">Faster.</span>
          </h1>
          
          <p className="hero-title text-base sm:text-2xl md:text-3xl lg:text-3xl text-white mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto leading-relaxed font-light font-serif italic">
            Automate your outreach. Let AI handle the research, personalization, and sending. You focus on closing deals.
          </p>

          <div className="hero-title flex justify-center">
            <button 
              onClick={onSignIn}
              className="group bg-emerald-600 text-white px-6 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl text-base sm:text-xl md:text-2xl font-bold hover:bg-emerald-500 transition-all shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center gap-3 sm:gap-4"
            >
              Get More Replies
              <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
            </button>
          </div>
        </div>

        {/* Floating 3D-like Cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="parallax-card absolute top-[25%] right-[12%] w-72 p-8 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-3xl hidden lg:block">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20" />
              <div className="h-3 w-32 bg-white/20 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-white/10 rounded-full" />
              <div className="h-2 w-5/6 bg-white/10 rounded-full" />
              <div className="h-2 w-4/6 bg-white/10 rounded-full" />
            </div>
          </div>

          <div className="parallax-card absolute bottom-[25%] left-[12%] w-80 p-8 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-3xl hidden lg:block">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">Acquisition Alpha</span>
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <div className="text-5xl font-serif italic mb-2">+342%</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest">Pipeline Acceleration</div>
          </div>
        </div>
      </section>

      {/* Deep Explanation: What We Do */}
      <section ref={whatWeDoRef} className="py-16 sm:py-24 md:py-48 bg-white dark:bg-neutral-900 text-black dark:text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-32 items-center">
            <div className="reveal-up">
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-serif italic font-light tracking-tighter mb-8 sm:mb-12 leading-[0.8]">
                Personal <br />
                <span className="text-emerald-600">Emails.</span>
              </h2>
              <p className="text-base sm:text-xl md:text-2xl text-neutral-500 leading-relaxed mb-8 sm:mb-12 md:mb-16 font-light">
                We help you send emails that people love to read. Our AI looks at your prospect's website and news to find something interesting to talk about. No more generic "Hi, I'm selling something" messages.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-12">
                {[
                  { icon: Cpu, title: "Smart Research", desc: "Our AI reads their website so you don't have to." },
                  { icon: Globe, title: "Always Fresh", desc: "We find the latest news about your leads automatically." },
                  { icon: Layers, title: "Send in Bulk", desc: "Personalize 1,000 emails as easily as sending one." },
                  { icon: ShieldCheck, title: "Inbox Safe", desc: "We make sure your emails land in the inbox, not spam." }
                ].map((item, i) => (
                  <div key={i} className="space-y-3 sm:space-y-4">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-emerald-50 text-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center">
                      <item.icon size={24} />
                    </div>
                    <h4 className="text-lg sm:text-2xl font-serif italic font-medium">{item.title}</h4>
                    <p className="text-sm sm:text-base text-neutral-500 font-light leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative reveal-up">
              <div className="relative aspect-[3/4] w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700xl] bg-neutral-100 rounded-[40px] sm:rounded-[80px] overflow-hidden border border-neutral-200 shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
                <video 
                  src="https://cdn.create.vista.com/api/media/medium/205378148/stock-video-close-up-of-hand-browsing-through-emails-on-a-smartphone-screen?token=" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1.5s]"
                />
              </div>
              <div className="absolute -bottom-8 sm:-bottom-16 -left-4 sm:-left-16 bg-emerald-600 text-white p-6 sm:p-12 md:p-16 rounded-[40px] sm:rounded-[60px] shadow-3xl hidden md:block">
                <div className="text-4xl sm:text-6xl md:text-8xl font-serif italic font-light mb-2 sm:mb-4">99.2%</div>
                <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-80">Inbox Placement Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Explanation: How It Works */}
      <section ref={methodologyRef} className="py-16 sm:py-24 md:py-48 bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-20 md:mb-32 reveal-up">
            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-serif italic font-light tracking-tighter mb-6 sm:mb-8">How it works</h2>
            <p className="text-base sm:text-xl md:text-2xl text-neutral-500 max-w-3xl mx-auto font-light italic">Three simple steps to more sales meetings.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-20">
            {[
              { 
                step: "I", 
                title: "Add Your Leads", 
                desc: "Upload a list of people you want to reach. We'll find their company info and latest news instantly." 
              },
              { 
                step: "II", 
                title: "AI Writes", 
                desc: "Our AI writes a custom message for every person based on what it learned about them." 
              },
              { 
                step: "III", 
                title: "You Send", 
                desc: "Review the emails and send them through your own Gmail account for maximum trust." 
              }
            ].map((item, i) => (
              <div key={i} className="relative group reveal-up">
                <div className="text-[15rem] font-serif italic font-light text-neutral-200 absolute -top-32 -left-12 group-hover:text-emerald-200 transition-colors z-0 opacity-40">
                  {item.step}
                </div>
                <div className="relative z-10 pt-16">
                  <h3 className="text-4xl font-serif italic font-medium mb-6">{item.title}</h3>
                  <p className="text-neutral-500 text-xl leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High Value Impact */}
      <section className="py-48 bg-[#050505] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-emerald-600 rounded-[80px] p-16 md:p-32 flex flex-col md:flex-row items-center gap-24 relative overflow-hidden reveal-up">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full -mr-64 -mt-64" />
            
            <div className="flex-1 text-center md:text-left relative z-10">
              <h2 className="text-7xl md:text-[10rem] font-serif italic font-light tracking-tighter leading-[0.8] mb-12">
                Compound <br />
                <span className="text-white/80">Growth.</span>
              </h2>
              <p className="text-2xl text-emerald-100 mb-16 max-w-2xl font-light leading-relaxed">
                We don't just fill your pipeline; we transform your acquisition model. By automating the research-heavy aspects of sales, your team can focus exclusively on high-value closing activities.
              </p>
              <button 
                onClick={onSignIn}
                className="bg-white text-emerald-600 px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-neutral-100 transition-all shadow-2xl"
              >
                Secure Your Market Share
              </button>
            </div>

            <div className="grid grid-cols-2 gap-10 w-full md:w-auto relative z-10">
              {[
                { val: "14%", label: "Conversion Alpha" },
                { val: "4.2x", label: "Pipeline Velocity" },
                { val: "85%", label: "Efficiency Gain" },
                { val: "∞", label: "Scalable ROI" }
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-3xl p-12 rounded-[40px] border border-white/10 text-center">
                  <div className="text-6xl font-serif italic font-light mb-2">{stat.val}</div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Screen Video Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <video 
          src="https://cdn.create.vista.com/api/media/small/380680336/stock-video-emails-sent-today?token=" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-serif italic text-white mb-4">Emails Sent Today</h2>
          <p className="text-xl sm:text-2xl text-white/80 font-light">Track your outreach success</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-48 bg-[#030303] text-white overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 blur-[100px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-serif italic font-light tracking-tight mb-6 reveal-up">
              What Founders <span className="text-emerald-500">Say</span>
            </h2>
            <p className="text-neutral-400 text-xl font-light italic">Real results from real growth leaders.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Marcus Chen",
                role: "CEO, Nexus Labs",
                quote: "AutoMailor generated $2.3M in pipeline within 3 months. The AI research is legitimately scary good.",
                metric: "$2.3M Pipeline"
              },
              {
                name: "Sarah Williams",
                role: "Founder, ScaleOps",
                quote: "We replaced our entire SDR team. Same leads, 10x the meetings. The personalization is indistinguishable from human.",
                metric: "10x Meetings"
              },
              {
                name: "David Park",
                role: "CRO, VelocityAI",
                quote: "68% reply rate. I've never seen anything like this in 15 years of B2B sales. AutoMailor is a different game.",
                metric: "68% Reply Rate"
              },
              {
                name: "Elena Rodriguez",
                role: "VP Sales, CloudScale",
                quote: "The warm-up technology is bulletproof. We've sent 50k+ emails with zero deliverability issues. Absolutely flawless.",
                metric: "50k+ Sent"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  rotateY: 5,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                {/* 3D Card Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl transform translate-y-2 transition-transform duration-300 group-hover:translate-y-4" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl transform translate-y-1 transition-transform duration-300 group-hover:translate-y-3" />
                
                <div className="relative bg-neutral-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 h-full transform transition-all duration-300 group-hover:border-emerald-500/30 group-hover:shadow-[0_20px_60px_rgba(16,185,129,0.15)]">
                  {/* Name & Role */}
                  <div className="mb-6">
                    <div className="font-serif italic text-xl font-semibold text-white mb-1">{testimonial.name}</div>
                    <div className="text-sm text-neutral-500 uppercase tracking-widest">{testimonial.role}</div>
                  </div>
                  
                  {/* Quote */}
                  <p className="text-neutral-300 font-light leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </p>
                  
                  {/* Metric Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      {testimonial.metric}
                    </div>
                  </div>
                  
                  {/* Decorative quote icon */}
                  <div className="absolute bottom-4 right-6 text-6xl font-serif italic text-neutral-700 opacity-50">"</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { val: "500+", label: "Active Companies" },
              { val: "$180M+", label: "Pipeline Generated" },
              { val: "47%", label: "Avg Reply Rate" },
              { val: "99.9%", label: "Uptime" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-serif italic font-bold text-emerald-500 mb-2">{stat.val}</div>
                <div className="text-sm text-neutral-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-48 bg-white dark:bg-neutral-900 text-black dark:text-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-7xl font-serif italic font-light tracking-tighter mb-24 text-center reveal-up">Strategic Inquiries</h2>
          <div className="space-y-4 reveal-up">
            <FAQItem 
              question="How does AutoMailor ensure domain safety?" 
              answer="Our system employs sophisticated warming protocols and real-time deliverability monitoring. We utilize distributed sending architectures and AI-driven rate limiting to ensure your primary domain remains pristine while maintaining high volume."
            />
            <FAQItem 
              question="Can the AI handle complex technical niches?" 
              answer="Yes. Our linguistic models are trained on vast datasets of technical and industry-specific documentation. By analyzing your target's specific whitepapers and product pages, the AI can speak their language with absolute authority."
            />
            <FAQItem 
              question="What is the integration process like?" 
              answer="Integration is seamless. We utilize secure OAuth protocols for Gmail and provide robust API endpoints for CRM synchronization. Most enterprises are fully operational within 15 minutes."
            />
            <FAQItem 
              question="How do you handle data privacy?" 
              answer="We adhere to strict SOC2 and GDPR compliance standards. Your data is encrypted at rest and in transit, and we never use your proprietary lead data to train public models."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 sm:py-24 md:py-32 border-t border-white/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Mail size={24} />
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl font-['Playfair_Display'] italic font-light tracking-tighter text-white drop-shadow-lg transform hover:scale-105 transition-transform duration-300">AutoMailor</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 text-neutral-400 font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs text-center">
            <a href="#/privacy" className="hover:text-white transition-colors">Privacy Protocol</a>
            <a href="#/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Blog</a>
            <a href="#" className="hover:text-white transition-colors">Intelligence Feed</a>
          </div>

          <p className="text-neutral-500 text-xs sm:text-sm font-light text-center">
            © 2026 AutoMailor. The Future of Enterprise Acquisition.
          </p>
        </div>
      </footer>
    </div>
  );
};
