import React from 'react';
import { User } from 'firebase/auth';
import { Mail, Shield, CreditCard, LogOut, ExternalLink, Loader2, Check, BookOpen, Crown } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ConnectionGuide } from '../components/ConnectionGuide';

interface SettingsProps {
  user: User;
  onLogOut: () => void;
  onNavigate?: (page: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogOut, onNavigate }) => {
  const [userData, setUserData] = React.useState<any>(null);
  const [showGuide, setShowGuide] = React.useState(false);
  const [showSmtpGuide, setShowSmtpGuide] = React.useState(false);
  // Note: Using local userData for subscription status (premium check)
  const isPremium = userData?.subscriptionStatus === 'premium';
  const [smtpSettings, setSmtpSettings] = React.useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: ''
  });
  const [isSmtpModalOpen, setIsSmtpModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
        if (doc.data().smtpSettings) {
          setSmtpSettings(doc.data().smtpSettings);
        }
      }
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleConnectGmail = async (reconnect = false) => {
    // Show the guide first for new connections
    if (!reconnect) {
      setShowGuide(true);
      return;
    }
    
    console.log('Initiating Gmail connection...', reconnect ? '(reconnect)' : '');
    if (!auth.currentUser) {
      console.error('No authenticated user found.');
      alert('Gmail connection is not available in Demo Mode or if you are not signed in. Please sign in with a real account.');
      return;
    }
    
    // Open a blank window first to avoid popup blocker
    const authWindow = window.open('about:blank', 'google_auth', 'width=600,height=700');
    if (!authWindow) {
      console.error('Popup blocked.');
      alert('Please allow popups for this site to connect your account.');
      return;
    }

    try {
      console.log('Fetching Google Auth URL for user:', auth.currentUser.uid);
      const url = reconnect 
        ? `/api/auth/google/url?userId=${auth.currentUser.uid}&reconnect=true`
        : `/api/auth/google/url?userId=${auth.currentUser.uid}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Try to get JSON error message, but handle non-JSON responses
        let errorMsg = 'Failed to get auth URL';
        try {
          const text = await response.text();
          const data = JSON.parse(text);
          console.error('Server error fetching auth URL:', data);
          errorMsg = data.message || errorMsg;
        } catch (e) {
          console.error('Server error (non-JSON):', response.status, response.statusText);
        }
        authWindow.close();
        alert(errorMsg + '. Please check your Google OAuth credentials in the Settings menu.');
        return;
      }

      const data = await response.json();
      if (data.url) {
        console.log('Redirecting to Google Auth URL:', data.url);
        authWindow.location.href = data.url;
      } else {
        console.error('No URL returned from server.');
        authWindow.close();
        throw new Error('Failed to get auth URL');
      }
    } catch (error: any) {
      console.error('Error getting Google Auth URL:', error);
      authWindow.close();
      // Show more detailed error message
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to connect Gmail: ${errorMessage}\n\nPlease ensure you have set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the Settings menu.`);
    }
  };

  const [isTestingSmtp, setIsTestingSmtp] = React.useState(false);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsTestingSmtp(true);
    try {
      // 1. Test the connection first
      const testResponse = await fetch('/api/auth/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings)
      });
      
      const testResult = await testResponse.json();
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'SMTP connection test failed');
      }

      // 2. If test passes, save to Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { 
        smtpSettings,
        gmailConnected: false 
      });
      setIsSmtpModalOpen(false);
      alert('SMTP connection verified and saved successfully!');
    } catch (error: any) {
      console.error('Error saving SMTP settings:', error);
      alert(error.message || 'Failed to verify SMTP settings. Please check your credentials.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Profile Settings</h3>
        <div className="flex items-center gap-6">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
            alt="Avatar" 
            className="w-20 h-20 rounded-2xl"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="text-lg font-bold">{user.displayName}</h4>
            <p className="text-neutral-500">{user.email}</p>
            <div className="mt-2 flex gap-2 items-center">
              {isPremium ? (
                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                  <Crown size={12} /> Premium
                </span>
              ) : (
                <>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">Free Plan</span>
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase rounded-md">
                    100 Credits Left
                  </span>
                  <button 
                    onClick={() => onNavigate ? onNavigate('pricing') : window.location.hash = '#/pricing'}
                    className="ml-2 text-xs bg-amber-500 text-white px-2 py-1 rounded-md font-bold hover:bg-amber-600 inline-block"
                  >
                    Upgrade
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Email Connections</h3>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 text-emerald-600 font-bold text-sm hover:underline"
          >
            <BookOpen size={16} /> {showGuide ? 'Hide Guide' : 'Connection Guide'}
          </button>
        </div>

        {showGuide && (
          <div className="mb-8 p-8 bg-neutral-50 dark:bg-neutral-700 rounded-3xl border border-neutral-200 dark:border-neutral-600 animate-in fade-in slide-in-from-top-4">
            <ConnectionGuide 
              isOpen={showGuide} 
              connectionType="gmail"
              onClose={() => setShowGuide(false)} 
              onProceed={() => {
                setShowGuide(false);
                handleConnectGmail(true);
              }} 
            />
          </div>
        )}

        {showSmtpGuide && (
          <div className="mb-8 p-8 bg-neutral-50 dark:bg-neutral-700 rounded-3xl border border-neutral-200 dark:border-neutral-600 animate-in fade-in slide-in-from-top-4">
            <ConnectionGuide 
              isOpen={showSmtpGuide} 
              connectionType="smtp"
              onClose={() => setShowSmtpGuide(false)} 
              onProceed={() => {
                setShowSmtpGuide(false);
                setIsSmtpModalOpen(true);
              }} 
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all relative ${userData?.gmailConnected ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-100 bg-white'}`}>
            {userData?.gmailConnected && (
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-emerald-600">
                <Check size={20} />
              </div>
            )}
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Mail size={20} />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-2">Gmail Connection</h3>
            <p className="text-sm text-neutral-500 mb-4 sm:mb-6">Connect your Gmail or Google Workspace account to send outreach emails.</p>
            <button 
              onClick={() => handleConnectGmail(false)}
              className={`w-full py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${userData?.gmailConnected ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50'}`}
            >
              {userData?.gmailConnected ? (
                <><Shield size={16} /> Gmail Connected</>
              ) : (
                <><ExternalLink size={16} /> Connect Gmail</>
              )}
            </button>
          </div>

          <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all relative ${userData?.smtpSettings ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-100 bg-white'}`}>
            {userData?.smtpSettings && (
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-emerald-600">
                <Check size={20} />
              </div>
            )}
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Shield size={20} />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-2">Custom Business Email</h3>
            <p className="text-sm text-neutral-500 mb-4 sm:mb-6">Connect any business email provider (Zoho, Outlook, etc.) via SMTP.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSmtpGuide(true)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                <BookOpen size={16} /> Guide
              </button>
              <button 
                onClick={() => setIsSmtpModalOpen(true)}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${userData?.smtpSettings ? 'bg-white text-emerald-600 border border-emerald-200' : 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50'}`}
              >
                {userData?.smtpSettings ? 'Settings' : 'Connect SMTP'} <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
          <CreditCard size={20} />
        </div>
        <h3 className="text-base sm:text-lg font-bold mb-2">Subscription</h3>
        <p className="text-sm text-neutral-500 mb-4 sm:mb-6">You are currently on the Free plan. Upgrade to Pro for more emails and AI features.</p>
        <button 
          onClick={() => onNavigate ? onNavigate('pricing') : window.location.hash = '#/pricing'}
          className="w-full py-2.5 sm:py-3 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors"
        >
          Upgrade to Pro
        </button>
      </div>

      {isSmtpModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-[40px] p-6 sm:p-12 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8">SMTP Settings</h2>
             <form onSubmit={handleSaveSmtp} className="space-y-4 sm:space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">SMTP Host</label>
                   <input 
                     type="text" 
                     value={smtpSettings.host}
                     onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                     placeholder="smtp.yourbusiness.com"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none"
                     required
                   />
                   <p className="text-xs text-neutral-500 mt-1">Examples: smtp.gmail.com (Gmail), smtp.outlook.com (Outlook), smtp.zoho.com (Zoho)</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Port</label>
                   <input 
                     type="number" 
                     value={smtpSettings.port}
                     onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
                     placeholder="587"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none"
                     required
                   />
                   <p className="text-xs text-neutral-500 mt-1">Common ports: 587 (TLS), 465 (SSL), 25 (plain - not recommended)</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Username</label>
                   <input 
                     type="text" 
                     value={smtpSettings.user}
                     onChange={(e) => setSmtpSettings({...smtpSettings, user: e.target.value})}
                     placeholder="your-email@gmail.com"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none"
                     required
                   />
                   <p className="text-xs text-neutral-500 mt-1">Your full email address</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                   <input 
                     type="password" 
                     value={smtpSettings.pass}
                     onChange={(e) => setSmtpSettings({...smtpSettings, pass: e.target.value})}
                     className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none"
                     required
                   />
                   <p className="text-xs text-neutral-500 mt-1">Use an app password if 2FA is enabled</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">From Name</label>
                   <input 
                     type="text" 
                     value={smtpSettings.fromName}
                     onChange={(e) => setSmtpSettings({...smtpSettings, fromName: e.target.value})}
                     placeholder="Your Name or Company Name"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none"
                     required
                   />
                   <p className="text-xs text-neutral-500 mt-1">The name recipients will see as the sender</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-2">From Email</label>
                   <input 
                     type="email" 
                     value={smtpSettings.fromEmail}
                     onChange={(e) => setSmtpSettings({...smtpSettings, fromEmail: e.target.value})}
                     placeholder="your-email@yourbusiness.com"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none"
                     required
                   />
                   <p className="text-xs text-neutral-500 mt-1">Should match your SMTP username</p>
                 </div>
               </div>
               <div className="flex gap-4 pt-6">
                 <button 
                   type="submit" 
                   disabled={isTestingSmtp}
                   className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isTestingSmtp ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Save Settings'}
                 </button>
                 <button type="button" onClick={() => setIsSmtpModalOpen(false)} className="flex-1 border border-neutral-200 py-4 rounded-xl font-bold hover:bg-neutral-50">
                   Cancel
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

      <div className="bg-red-50 rounded-3xl border border-red-100 p-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-red-900">Sign Out</h3>
          <p className="text-sm text-red-600">Log out of your AutoMailor account on this device.</p>
        </div>
        <button 
          onClick={onLogOut}
          className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
};
