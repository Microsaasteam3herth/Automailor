import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Shield, Globe, Mail } from 'lucide-react';

const PricingCard = ({ 
  tier, 
  price, 
  description, 
  features, 
  highlight = false,
  buttonText = "Get Started",
  onSelect
}: { 
  tier: string, 
  price: string, 
  description: string, 
  features: string[], 
  highlight?: boolean,
  buttonText?: string,
  onSelect: () => void
}) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`p-6 sm:p-10 rounded-2xl sm:rounded-[40px] border ${highlight ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-black dark:text-white'} shadow-xl flex flex-col h-full`}
  >
    <div className="mb-6 sm:mb-8">
      <h3 className="text-xl sm:text-2xl font-serif italic font-medium mb-2">{tier}</h3>
      <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
        <span className="text-3xl sm:text-5xl font-serif italic font-light">{price}</span>
        {price !== "Custom" && <span className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${highlight ? 'text-emerald-100' : 'text-neutral-400'}`}>/month</span>}
      </div>
      <p className={`text-sm sm:text-lg font-light ${highlight ? 'text-emerald-50' : 'text-neutral-500'}`}>{description}</p>
    </div>

    <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12 flex-grow">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <div className={`w-5 sm:w-6 h-5 sm:h-6 rounded-full flex items-center justify-center ${highlight ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
            <Check size={12} />
          </div>
          <span className="text-sm sm:font-light">{feature}</span>
        </div>
      ))}
    </div>

    <button 
      onClick={onSelect}
      className={`w-full py-3 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-xl font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 ${
        highlight 
          ? 'bg-white text-emerald-600 hover:bg-neutral-100' 
          : 'bg-black text-white hover:bg-neutral-800'
      }`}
    >
      {buttonText}
      <ArrowRight size={18} />
    </button>
  </motion.div>
);

export const PricingPage: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-black dark:text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E')] mix-blend-overlay" />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 md:pt-48 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-8 sm:mb-12"
          >
            <Zap size={16} />
            <span>Transparent Investment</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-serif italic font-light tracking-tighter mb-6 sm:mb-8 leading-[0.8] lowercase">
            Simple <br />
            <span className="text-emerald-600">Pricing.</span>
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-neutral-500 max-w-2xl mx-auto font-light italic">
            Choose the plan that fits your growth ambitions. Start with a free trial or go unlimited.
          </p>
        </div>

        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] md:w-[1000px] h-[400px] sm:h-[500px] md:h-[600px] bg-emerald-100/50 blur-[80px] sm:blur-[120px] rounded-full -z-10" />
      </section>

      {/* Pricing Grid */}
      <section className="pb-16 sm:pb-24 md:pb-48 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
           <PricingCard 
             tier="Pro"
             price="$9"
             description="Free 7-day trial. Everything you need to scale."
             highlight={true}
             features={[
               "7-Day Free Trial",
               "1,000 AI-Personalized Emails",
               "Deep Web Lead Enrichment",
               "Gmail Integration",
               "Priority Support"
             ]}
             onSelect={() => window.location.href = 'https://checkout.dodopayments.com/buy/pdt_0NbJKikekRihFg03pbtwa?quantity=1'}
           />
          <PricingCard 
            tier="Enterprise"
            price="Custom"
            description="For teams that need absolute acquisition power."
            buttonText="Contact Sales"
            features={[
              "Unlimited AI Emails",
              "Custom AI Model Training",
              "Dedicated Account Manager",
              "SOC2 Compliance",
              "Full API Access"
            ]}
            onSelect={() => window.location.href = 'mailto:entrext@business.in'}
          />
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-32 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-serif italic font-light mb-8">Still have questions?</h2>
          <p className="text-xl text-neutral-500 mb-12 font-light">Our team is here to help you find the perfect plan for your business needs.</p>
          <button className="px-10 py-5 rounded-2xl text-xl font-bold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-neutral-900 dark:text-neutral-100">
            Contact Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Mail size={24} />
            </div>
            <span className="text-2xl font-['Playfair_Display'] italic font-bold tracking-tight text-black dark:text-white">AutoMailor</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#/privacy" className="text-neutral-500 hover:text-emerald-600 transition-colors">Privacy Policy</a>
            <a href="#/terms" className="text-neutral-500 hover:text-emerald-600 transition-colors">Terms of Service</a>
          </div>
          <p className="text-neutral-500 text-sm font-light">
            © 2026 AutoMailor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
