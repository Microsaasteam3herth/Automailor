import React, { useState, useEffect } from 'react';
import { 
   LayoutDashboard, 
   Send, 
   BarChart3, 
   Settings as SettingsIcon, 
   LogOut,
   PlusCircle,
   Mail,
   Layout as LayoutIcon,
   Menu,
   X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';
import UpvoteWidget from './UpvoteWidget';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  showUpvoteWidget?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentPage, onNavigate, showUpvoteWidget = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'templates', label: 'Templates', icon: LayoutIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];
  
  // Check quota status
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState('');
  
  useEffect(() => {
    const checkQuota = async () => {
      try {
        const response = await fetch('/api/quota-status');
        
        // Check if response is OK before parsing JSON
        if (!response.ok) {
          console.error('Quota API error:', response.status, response.statusText);
          return;
        }
        
        // Get response as text first to handle non-JSON responses
        const text = await response.text();
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Invalid JSON response from quota API:', text);
          return;
        }
        
        if (data.quotaExceeded) {
          setQuotaExceeded(true);
          setQuotaMessage(data.message || "Freemium limit reached! You've used your 100 free emails. Upgrade to Pro for unlimited emails.");
        } else {
          setQuotaExceeded(false);
        }
      } catch (e) {
        console.error('Error checking quota:', e);
      }
    };
    checkQuota();
    // Check every 30 seconds - reduced from rapid calls to avoid spam
    const interval = setInterval(checkQuota, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 lg:p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Mail size={24} />
          </div>
          <span className="text-xl font-['Playfair_Display'] italic font-bold tracking-tight text-black dark:text-white">AutoMailor</span>
        </div>

        <button 
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 lg:hidden text-neutral-500"
        >
          <X size={24} />
        </button>

        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                currentPage === item.id 
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100"
              )}
            >
              <item.icon size={20} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 lg:p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 px-3 lg:px-4 py-3">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate dark:text-neutral-100">{user.displayName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Quota Exceeded Warning Banner - Shows on ALL pages */}
        {quotaExceeded && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 max-w-7xl mx-auto py-3">
              <span className="text-lg sm:text-xl">⚠️</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Daily Email Limit Reached: </span>
                <span className="text-amber-700 dark:text-amber-300 text-sm">{quotaMessage}</span>
              </div>
              <a href="#/pricing" className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline whitespace-nowrap">
                Upgrade to Pro
              </a>
            </div>
          </div>
        )}
        <header className="h-16 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 lg:hidden text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold capitalize dark:text-neutral-100">{currentPage.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => onNavigate('new-campaign')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">New Campaign</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Upvote Widget */}
      {showUpvoteWidget && (
        <UpvoteWidget userId={user?.uid} email={user?.email || undefined} />
      )}
    </div>
  );
};
