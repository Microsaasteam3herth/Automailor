import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
import { EmailLimitsDisclosure } from './EmailLimitsDisclosure';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitsDisclosure, setShowLimitsDisclosure] = useState(false);
  const [limitsAccepted, setLimitsAccepted] = useState(false);

  const handleGoogleSignIn = async () => {
    console.log('handleGoogleSignIn called');
    console.log('limitsAccepted:', limitsAccepted);
    console.log('showLimitsDisclosure:', showLimitsDisclosure);
    
    // Show limits disclosure first for new users
    if (!limitsAccepted) {
      console.log('Setting showLimitsDisclosure to true');
      setShowLimitsDisclosure(true);
      return;
    }
    
    console.log('Proceeding with Google sign-in');
    setLoading(true);
    setError(null);
    console.log('AuthModal: Starting Google sign-in...');
    try {
      console.log('AuthModal: Calling signInWithGoogle...');
      await signInWithGoogle();
      console.log('AuthModal: Google sign-in successful, closing modal');
      onClose();
    } catch (err: any) {
      console.log('AuthModal: Caught error:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      if (err.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }
      // Handle specific Google sign-in errors
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact the app administrator.');
        setLoading(false);
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in Firebase Console.');
        setLoading(false);
        return;
      }
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show limits disclosure first for new users
    if (!limitsAccepted && !isLogin) {
      setShowLimitsDisclosure(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err.code, err.message);
      let friendlyMessage = 'Authentication failed. Please try again.';
      
      switch (err.code) {
        case 'auth/invalid-credential':
          friendlyMessage = 'Invalid email or password.';
          break;
        case 'auth/user-not-found':
          friendlyMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          friendlyMessage = 'Incorrect password.';
          break;
        case 'auth/email-already-in-use':
          friendlyMessage = 'An account already exists with this email.';
          break;
        case 'auth/weak-password':
          friendlyMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/invalid-email':
          friendlyMessage = 'Please enter a valid email address.';
          break;
        case 'auth/popup-blocked':
          friendlyMessage = 'Sign-in popup was blocked by your browser.';
          break;
        case 'auth/network-request-failed':
          friendlyMessage = 'Network error. Please check your internet connection or disable ad-blockers.';
          break;
        default:
          friendlyMessage = err.message || friendlyMessage;
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLimits = async () => {
    // Store that user accepted limits
    setLimitsAccepted(true);
    setShowLimitsDisclosure(false);
    
    // If user was trying to sign in with email/password
    if (email && password) {
      setLoading(true);
      setError(null);
      try {
        if (isLogin) {
          await signInWithEmail(email, password);
        } else {
          await signUpWithEmail(email, password, name);
        }
        onClose();
      } catch (err: any) {
        console.error("Auth error:", err.code, err.message);
        let friendlyMessage = 'Authentication failed. Please try again.';
        
        switch (err.code) {
          case 'auth/invalid-credential':
            friendlyMessage = 'Invalid email or password.';
            break;
          case 'auth/user-not-found':
            friendlyMessage = 'No account found with this email.';
            break;
          case 'auth/wrong-password':
            friendlyMessage = 'Incorrect password.';
            break;
          case 'auth/email-already-in-use':
            friendlyMessage = 'An account already exists with this email.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/invalid-email':
            friendlyMessage = 'Please enter a valid email address.';
            break;
          case 'auth/popup-blocked':
            friendlyMessage = 'Sign-in popup was blocked by your browser.';
            break;
          case 'auth/network-request-failed':
            friendlyMessage = 'Network error. Please check your internet connection or disable ad-blockers.';
            break;
          default:
            friendlyMessage = err.message || friendlyMessage;
        }
        
        setError(friendlyMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleContinueWithGoogle = async () => {
    setLimitsAccepted(true);
    setShowLimitsDisclosure(false);
    
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      if (err.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
          >
            {/* Grain Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E')] mix-blend-overlay" />

            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="relative z-10">
              <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-emerald-600/20">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-4xl font-serif italic font-bold tracking-tighter text-white mb-2">
                  {isLogin ? 'Welcome to AutoMailor' : 'Join AutoMailor'}
                </h2>
                <p className="text-neutral-300 font-light">
                  {isLogin ? 'Access your acquisition engine.' : 'Start scaling your outreach today.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white text-neutral-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span className="bg-[#0a0a0a] px-4 text-neutral-500">Or email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input 
                      required
                      type="email" 
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input 
                      required
                      type="password" 
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-base sm:text-lg"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>

              <div className="text-center mt-4 sm:mt-6">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-neutral-400 hover:text-emerald-400 transition-colors text-xs sm:text-sm font-medium"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Email Limits Disclosure Modal */}
       {showLimitsDisclosure && (
         <EmailLimitsDisclosure 
           onAccept={async () => {
             console.log('EmailLimitsDisclosure: onAccept called');
             setLimitsAccepted(true);
             setShowLimitsDisclosure(false);
             // Trigger Google sign-in after accepting limits
             await handleContinueWithGoogle();
           }}
           onCancel={() => {
             console.log('EmailLimitsDisclosure: onCancel called');
             setShowLimitsDisclosure(false);
           }}
         />
       )}
    </AnimatePresence>
  );
};
