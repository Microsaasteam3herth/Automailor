import React, { useState, useEffect } from 'react';
import { auth, logOut, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Campaigns } from './pages/Campaigns';
import { NewCampaign } from './pages/NewCampaign';
import { CampaignDetails } from './pages/CampaignDetails';
import { Settings } from './pages/Settings';
import { TemplatesPage } from './pages/Templates';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { BlogPage } from './pages/BlogPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { AuthModal } from './components/AuthModal';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import { ThemeProvider } from './context/ThemeContext';
import { Mail, Menu, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [publicPage, setPublicPage] = useState('home');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(() => {
    return localStorage.getItem('is_selecting_template') === 'true';
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRef = React.useRef(user);
  userRef.current = user;

  useEffect(() => {
    localStorage.setItem('is_selecting_template', isSelectingTemplate.toString());
  }, [isSelectingTemplate]);

  const [demoUser, setDemoUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isDemoMode) {
        setUser(user);
        setLoading(false);
      }
    });

    const handleDemoMode = (e: any) => {
      setIsDemoMode(true);
      setDemoUser(e.detail);
      setUser(e.detail);
      setLoading(false);
    };

    const handleGoogleAuth = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { tokens } = event.data;
        // In a real app, you'd save these tokens to Firestore
        console.log('Google Auth Success:', tokens);
        // You might want to show a success toast here
      }
    };

    window.addEventListener('message', handleGoogleAuth);
    window.addEventListener('enable-demo-mode', handleDemoMode);
    
    // Handle hash-based routing for pricing page
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/pricing') {
        // If user is logged in, show pricing as a page; otherwise show public pricing
        if (userRef.current) {
          setCurrentPage('pricing');
        } else {
          setPublicPage('pricing');
        }
      } else if (hash === '#/privacy') {
        setShowPrivacyPolicy(true);
      } else if (hash === '#/terms') {
        setShowTermsOfService(true);
      } else if (hash === '#/') {
        setPublicPage('home');
      }
    };
    
    // Check initial hash
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      unsubscribe();
      window.removeEventListener('message', handleGoogleAuth);
      window.removeEventListener('enable-demo-mode', handleDemoMode);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isDemoMode]);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider>
        <div className="relative">
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        
        {/* Public Header */}
        <header className="fixed top-0 left-0 right-0 z-[10000] px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/10 dark:border-neutral-700 rounded-2xl px-6 py-4">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setPublicPage('home')}
            >
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Mail size={20} />
              </div>
              <span className="text-xl font-['Playfair_Display'] italic font-bold tracking-tight text-white dark:text-white">AutoMailor</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setPublicPage('home')}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${publicPage === 'home' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white dark:text-neutral-300 dark:hover:text-white'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setPublicPage('pricing')}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${publicPage === 'pricing' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white dark:text-neutral-300 dark:hover:text-white'}`}
              >
                Pricing
              </button>
              <button 
                onClick={() => setPublicPage('blog')}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${publicPage === 'blog' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white dark:text-neutral-300 dark:hover:text-white'}`}
              >
                Blog
              </button>
              <div className="flex items-center gap-4">
                <ThemeToggleButton />
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
                >
                  Sign In
                </button>
              </div>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-4 mx-4 bg-white/10 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/10 dark:border-neutral-700 rounded-2xl p-6 md:hidden">
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { setPublicPage('home'); setMobileMenuOpen(false); }}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors text-left ${publicPage === 'home' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white dark:text-neutral-300 dark:hover:text-white'}`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => { setPublicPage('pricing'); setMobileMenuOpen(false); }}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors text-left ${publicPage === 'pricing' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white dark:text-neutral-300 dark:hover:text-white'}`}
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => { setPublicPage('blog'); setMobileMenuOpen(false); }}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors text-left ${publicPage === 'blog' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white dark:text-neutral-300 dark:hover:text-white'}`}
                  >
                    Blog
                  </button>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <ThemeToggleButton />
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all flex-1"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {showPrivacyPolicy ? (
          <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
        ) : showTermsOfService ? (
          <TermsOfService onBack={() => setShowTermsOfService(false)} />
        ) : publicPage === 'home' ? (
          <LandingPage onSignIn={() => setIsAuthModalOpen(true)} />
        ) : publicPage === 'pricing' ? (
          <PricingPage onSignIn={() => setIsAuthModalOpen(true)} />
        ) : (
          <BlogPage onSignIn={() => setIsAuthModalOpen(true)} />
        )}
      </div>
      </ThemeProvider>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'campaigns':
        return <Campaigns onSelectCampaign={(id) => {
          if (id === 'new') {
            setCurrentPage('new-campaign');
          } else {
            setCurrentCampaignId(id);
            setCurrentPage('campaign-details');
          }
        }} />;
      case 'new-campaign':
        return (
          <NewCampaign 
            key="new-campaign-wizard"
            onComplete={() => setCurrentPage('campaigns')} 
            onManageTemplates={() => {
              setIsSelectingTemplate(true);
              setCurrentPage('templates');
            }} 
          />
        );
      case 'campaign-details':
        return <CampaignDetails campaignId={currentCampaignId!} onBack={() => setCurrentPage('campaigns')} />;
      case 'templates':
        return (
          <TemplatesPage 
            key="templates-page"
            onSelect={isSelectingTemplate ? (id) => {
              console.log('App: Template selected:', id);
              localStorage.setItem('new_campaign_template', id);
              setCurrentPage('new-campaign');
              setIsSelectingTemplate(false);
            } : undefined}
            onBack={() => {
              if (isSelectingTemplate) {
                setCurrentPage('new-campaign');
                setIsSelectingTemplate(false);
              } else {
                setCurrentPage('dashboard');
              }
            }}
          />
        );
      case 'settings':
        return <Settings user={user} onLogOut={logOut} onNavigate={setCurrentPage} />;
      case 'pricing':
        return <PricingPage onSignIn={() => setIsAuthModalOpen(true)} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
    <Layout 
      user={user} 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
    >
      <div key={currentPage}>
        {renderPage()}
      </div>

      {/* Upvote Widget is already included in Layout */}
    </Layout>
    </ThemeProvider>
  );
}
