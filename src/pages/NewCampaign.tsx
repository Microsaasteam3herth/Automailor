import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db, auth } from '../firebase';
import { useUserLimits } from '../hooks/useUserLimits';
import { collection, addDoc, serverTimestamp, writeBatch, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { Upload, X, Check, ArrowRight, Loader2, Mail, Layout, Sparkles, Shield, ExternalLink, Info, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { SYSTEM_TEMPLATES } from '../constants/templates';

import { ConnectionGuide } from '../components/ConnectionGuide';

interface NewCampaignProps {
  onComplete: () => void;
  onManageTemplates: () => void;
}

export const NewCampaign: React.FC<NewCampaignProps> = ({ onComplete, onManageTemplates }) => {
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('new_campaign_step');
    return saved ? parseInt(saved) : 1;
  });
  const [name, setName] = useState(() => localStorage.getItem('new_campaign_name') || '');
  const [userData, setUserData] = useState<any>(null);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: ''
  });
  const [showGuide, setShowGuide] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [csvData, setCsvData] = useState<any[]>(() => {
    const saved = localStorage.getItem('new_campaign_csv');
    return saved ? JSON.parse(saved) : [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const [templates, setTemplates] = useState<any[]>(SYSTEM_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => {
    const saved = localStorage.getItem('new_campaign_template');
    console.log('NewCampaign: Initializing selectedTemplateId from localStorage:', saved);
    return saved && saved !== '' && saved !== 'null' ? saved : null;
  });
  const [startImmediately, setStartImmediately] = useState(() => localStorage.getItem('new_campaign_start_now') !== 'false');
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('new_campaign_schedule');
    return saved ? JSON.parse(saved) : {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startTime: '09:00',
      endTime: '17:00',
      interval: 5,
      batchSize: 10
    };
  });
  const [enrichmentEnabled, setEnrichmentEnabled] = useState(() => localStorage.getItem('new_campaign_enrichment') !== 'false');
  
  // Follow-ups state (up to 5)
  const { isPremium, loading: limitsLoading } = useUserLimits();
  
  const [followUps, setFollowUps] = useState([
    { enabled: false, daysAfter: 3, subject: '', body: '', generateWithAI: false },
    { enabled: false, daysAfter: 5, subject: '', body: '', generateWithAI: false },
    { enabled: false, daysAfter: 7, subject: '', body: '', generateWithAI: false },
    { enabled: false, daysAfter: 10, subject: '', body: '', generateWithAI: false },
    { enabled: false, daysAfter: 14, subject: '', body: '', generateWithAI: false }
  ]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [generatingFollowUp, setGeneratingFollowUp] = useState<number | null>(null);

  useEffect(() => {
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

  // Load user templates from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'templates'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Combine system templates with user templates
      setTemplates([...SYSTEM_TEMPLATES, ...userTemplates]);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleConnectGmail = async () => {
    console.log('Initiating Gmail connection...');
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
      const response = await fetch(`/api/auth/google/url?userId=${auth.currentUser.uid}`);
      
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
       if (authWindow && !authWindow.closed) {
         authWindow.close();
       }
       // Show more detailed error message
       const errorMessage = error?.message || 'Unknown error';
       alert(`Failed to connect Gmail: ${errorMessage}\n\nPlease ensure you have set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the Settings menu.`);
     }
  };

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
        gmailConnected: false // Ensure only one is active or at least clear Gmail if SMTP is set
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        // User data will be updated via onSnapshot
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const isEmailConnected = userData?.gmailConnected || userData?.smtpSettings;

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('new_campaign_step', step.toString());
    localStorage.setItem('new_campaign_name', name);
    localStorage.setItem('new_campaign_csv', JSON.stringify(csvData));
    localStorage.setItem('new_campaign_template', selectedTemplateId || '');
    localStorage.setItem('new_campaign_schedule', JSON.stringify(schedule));
    localStorage.setItem('new_campaign_enrichment', enrichmentEnabled.toString());
    localStorage.setItem('new_campaign_start_now', startImmediately.toString());
  }, [step, name, csvData, selectedTemplateId, schedule, enrichmentEnabled, startImmediately]);

  const clearPersistence = () => {
    localStorage.removeItem('new_campaign_step');
    localStorage.removeItem('new_campaign_name');
    localStorage.removeItem('new_campaign_csv');
    localStorage.removeItem('new_campaign_template');
    localStorage.removeItem('new_campaign_schedule');
    localStorage.removeItem('new_campaign_enrichment');
    localStorage.removeItem('new_campaign_start_now');
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    console.log('NewCampaign: Setting up templates snapshot for user:', auth.currentUser.uid);
    const q = query(
      collection(db, 'templates'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('NewCampaign: Templates updated:', userTemplates.length, 'user templates found');
      setTemplates([...SYSTEM_TEMPLATES, ...userTemplates]);
    }, (error) => {
      console.error('NewCampaign: Templates snapshot error:', error);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Helper function to find column values
    const findKey = (row: any, keys: string[]) => {
      const found = Object.keys(row).find(k => 
        keys.some(key => 
          k.toLowerCase().replace(/[^a-z]/g, '').includes(key.toLowerCase().replace(/[^a-z]/g, ''))
        )
      );
      return found ? row[found] : '';
    };
    
    // Mapping function - simpler: just find email, extract name from email if needed
    const mapRow = (row: any) => {
      // Find email column
      const emailKey = Object.keys(row).find(k => 
        /email|mail|e-mail/i.test(k)
      );
      const email = emailKey ? row[emailKey] : '';
      
      // Find first name - try various column names
      const nameKey = Object.keys(row).find(k => 
        /first|firstname|first.?name|name|fname/i.test(k)
      );
      const firstName = nameKey ? row[nameKey] : '';
      
      // Find last name
      const lastKey = Object.keys(row).find(k => 
        /last|lastname|last.?name|lname/i.test(k)
      );
      const lastName = lastKey ? row[lastKey] : '';
      
      // Find company
      const companyKey = Object.keys(row).find(k => 
        /company|org|business|contact/i.test(k)
      );
      const company = companyKey ? row[companyKey] : '';
      
      // Find website
      const websiteKey = Object.keys(row).find(k => 
        /website|site|url|web/i.test(k)
      );
      const website = websiteKey ? row[websiteKey] : '';
      
      // Find linkedin
      const linkedinKey = Object.keys(row).find(k => 
        /linkedin|profile|li/i.test(k)
      );
      const linkedinUrl = linkedinKey ? row[linkedinKey] : '';
      
      return {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        company: company || '',
        website: website || '',
        linkedinUrl: linkedinUrl || ''
      };
    };
    
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      // Parse Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const mappedData = jsonData.map(mapRow).filter(r => r.email);
        setCsvData(mappedData);
        setStep(3);
      };
      reader.readAsBinaryString(file as any);
    } else {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mappedData = results.data.map(mapRow).filter(r => r.email);
          setCsvData(mappedData);
          setStep(3);
        },
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  const handleCreateCampaign = async () => {
    if (!auth.currentUser) {
      alert('Please sign in first');
      return;
    }
    
    // Check if we have contacts
    const validContacts = csvData.filter(c => c.email);
    if (validContacts.length === 0) {
      alert('No valid email addresses found in your file. Please check your CSV has an "email" column.');
      return;
    }
    
    setIsUploading(true);

    try {
      // 1. Create Campaign
      const campaignRef = await addDoc(collection(db, 'campaigns'), {
        userId: auth.currentUser.uid,
        name,
        status: startImmediately ? 'sending' : 'draft',
        schedule,
        enrichmentEnabled,
        templateId: selectedTemplateId,
        followUps: followUps.filter(f => f.enabled), // Save enabled follow-ups
        createdAt: serverTimestamp()
      });

      // 2. Add Contacts in chunks (Firestore batch limit is 500)
      const CHUNK_SIZE = 450;
      for (let i = 0; i < validContacts.length; i += CHUNK_SIZE) {
        const chunk = validContacts.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        
        chunk.forEach((row) => {
          const contactRef = doc(collection(db, `campaigns/${campaignRef.id}/contacts`));
          batch.set(contactRef, {
            campaignId: campaignRef.id,
            firstName: row.firstName || row.first_name || '',
            lastName: row.lastName || row.last_name || '',
            email: row.email || '',
            company: row.company || '',
            website: row.website || '',
            linkedinUrl: row.linkedinUrl || row.linkedin || '',
            status: 'pending',
            currentFollowUp: 0, // Track which follow-up to send next
            enrichment: {
              status: enrichmentEnabled ? 'pending' : 'completed'
            },
            createdAt: serverTimestamp()
          });
        });
        
        await batch.commit();
      }

      clearPersistence();
      onComplete();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  // Generate AI follow-up email
  const generateFollowUpAI = async (followUpIndex: number) => {
    const followUp = followUps[followUpIndex];
    const template = templates.find(t => t.id === selectedTemplateId);
    
    setGeneratingFollowUp(followUpIndex);
    
    const defaultFollowUps = [
      {
        subject: `Quick question about ${template?.name?.replace('Template', '') || 'your company'}`,
        body: `Hi,\n\nI wanted to follow up on my previous email. I understand you're busy, but I wanted to share a quick thought:\n\nWe help companies like yours increase response rates by 40% - would love to show you how.\n\nAre you free for a 10-min chat this week?\n\nBest`
      },
      {
        subject: `Thoughts on this?`,
        body: `Hi,\n\nI know you're swamped, so I'll keep this brief.\n\nJust wanted to see if you had a chance to think about my last email. Happy to hop on a quick call if it'd help.\n\nCheers`
      },
      {
        subject: `${template?.name?.replace('Template', '') || 'Following up'}`,
        body: `Hi,\n\nI realize I haven't heard back - no pressure at all!\n\nIf this isn't the right time, just let me know and I'll follow up in a few months.\n\nOtherwise, would love to chat!\n\nBest`
      },
      {
        subject: `One more thing...`,
        body: `Hi,\n\nJust one more thing I wanted to share:\n\nWe recently helped a company in your industry get 50% more meetings booked. Happy to share the case study.\n\nLet me know if interested!\n\nBest`
      },
      {
        subject: `Last try - I promise!`,
        body: `Hi,\n\nThis is my last follow-up, I promise!\n\nIf this still isn't a good fit, no worries at all. But if you're ever looking for help with outreach, we'd be here.\n\nThanks for your time!\n\nBest`
      }
    ];
    
    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'followup',
          followUpNumber: followUpIndex + 1,
          previousSubject: template?.subject || '',
          previousBody: template?.body || '',
          daysAfter: followUp.daysAfter
        })
      });
      
      if (!response.ok) {
        throw new Error('API failed');
      }
      
      const data = await response.json();
      
      const newFollowUps = [...followUps];
      newFollowUps[followUpIndex] = {
        ...newFollowUps[followUpIndex],
        subject: data.subject || defaultFollowUps[followUpIndex]?.subject || `Follow-up #${followUpIndex + 1}`,
        body: data.body || defaultFollowUps[followUpIndex]?.body || ''
      };
      setFollowUps(newFollowUps);
    } catch (error) {
      console.error('Error generating follow-up, using default:', error);
      // Provide default follow-up content based on follow-up number
      const newFollowUps = [...followUps];
      const defaultContent = defaultFollowUps[followUpIndex] || defaultFollowUps[0];
      newFollowUps[followUpIndex] = {
        ...newFollowUps[followUpIndex],
        subject: defaultContent.subject,
        body: defaultContent.body
      };
      setFollowUps(newFollowUps);
    } finally {
      setGeneratingFollowUp(null);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    console.log('NewCampaign: selectedTemplateId changed:', selectedTemplateId);
    console.log('NewCampaign: templates count:', templates.length);
    console.log('NewCampaign: selectedTemplate found:', !!selectedTemplate);
    if (selectedTemplateId && !selectedTemplate) {
      console.log('NewCampaign: Template not found in current templates list. ID:', selectedTemplateId);
    }
  }, [selectedTemplateId, templates, selectedTemplate]);

  const refreshTemplates = useCallback(async () => {
    if (!auth.currentUser) return;
    // The onSnapshot already handles this, but we can force a re-fetch if needed
    // For now, we'll just show a brief loading state to give feedback
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 500);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              step === i ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : step > i ? "bg-emerald-100 text-emerald-600" : "bg-neutral-200 text-neutral-500"
            )}>
              {step > i ? <Check size={20} /> : i}
            </div>
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest",
              step === i ? "text-neutral-900" : "text-neutral-500"
            )}>
              {i === 1 ? 'Connect' : i === 2 ? 'Name' : i === 3 ? 'Upload' : i === 4 ? 'Template' : i === 5 ? 'Schedule' : 'Review'}
            </span>
            {i < 6 && <div className="w-12 h-px bg-neutral-200 mx-2" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[40px] border border-neutral-200 p-4 sm:p-8 lg:p-12 shadow-xl shadow-neutral-100 relative overflow-hidden">
        {step === 1 && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Connect your email</h2>
                <p className="text-neutral-500 text-sm sm:text-base">Choose how you want to send your outreach emails.</p>
              </div>
              <button 
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-2 text-emerald-600 font-bold text-sm hover:underline whitespace-nowrap"
              >
                <BookOpen size={16} /> {showGuide ? 'Hide Guide' : 'Connection Guide'}
              </button>
            </div>

            {showGuide && (
              <div className="bg-neutral-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-neutral-200 animate-in fade-in slide-in-from-top-4">
                <ConnectionGuide 
                  isOpen={showGuide}
                  connectionType="gmail"
                  onClose={() => setShowGuide(false)}
                  onProceed={() => {
                    setShowGuide(false);
                    handleConnectGmail();
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className={cn(
                "bg-neutral-50 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 border-2 transition-all relative",
                userData?.gmailConnected ? "border-emerald-500 bg-emerald-50" : "border-neutral-100"
              )}>
                {userData?.gmailConnected && (
                  <div className="absolute top-6 right-6 text-emerald-600">
                    <Check size={24} />
                  </div>
                )}
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Mail size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Gmail / Workspace</h3>
                <p className="text-sm text-neutral-500 mb-8">Connect your Google account directly via OAuth for the best experience.</p>
                <button 
                  onClick={handleConnectGmail}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    userData?.gmailConnected ? "bg-white text-emerald-600 border border-emerald-200" : "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {userData?.gmailConnected ? 'Connected' : 'Connect Gmail'} <ExternalLink size={18} />
                </button>
              </div>

              <div className={cn(
                "bg-neutral-50 rounded-[32px] p-8 border-2 transition-all relative",
                userData?.smtpSettings ? "border-emerald-500 bg-emerald-50" : "border-neutral-100"
              )}>
                {userData?.smtpSettings && (
                  <div className="absolute top-6 right-6 text-emerald-600">
                    <Check size={24} />
                  </div>
                )}
                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <Shield size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Custom SMTP</h3>
                <p className="text-sm text-neutral-500 mb-8">Connect Zoho, Outlook, or any custom business email provider.</p>
                <button 
                  onClick={() => setIsSmtpModalOpen(true)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    userData?.smtpSettings ? "bg-white text-emerald-600 border border-emerald-200" : "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {userData?.smtpSettings ? 'Settings' : 'Connect SMTP'} <ExternalLink size={18} />
                </button>
              </div>
            </div>

            <button 
              disabled={!isEmailConnected}
              onClick={() => setStep(2)}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 text-xl shadow-lg shadow-emerald-200 transition-all"
            >
              Next Step <ArrowRight size={24} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Name your campaign</h2>
              <p className="text-neutral-500 mb-6 sm:mb-8 text-sm sm:text-base">Give your campaign a descriptive name to track it easily.</p>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 SaaS Outreach"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-neutral-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-base sm:text-lg"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all"
              >
                Back
              </button>
              <button 
                disabled={!name}
                onClick={() => setStep(3)}
                className="flex-1 bg-emerald-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-emerald-200 transition-all"
              >
                Next <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Upload your leads</h2>
            <p className="text-neutral-500 mb-6 sm:mb-8 text-sm sm:text-base">Upload a CSV file with your contact information.</p>
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl sm:rounded-[32px] p-8 sm:p-16 lg:p-20 text-center cursor-pointer transition-all",
                isDragActive ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 hover:border-emerald-400 hover:bg-neutral-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-14 sm:w-20 h-14 sm:h-20 bg-neutral-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-neutral-400">
                <Upload size={40} />
              </div>
              <p className="text-xl font-bold">Click or drag CSV file to upload</p>
              <p className="text-sm text-neutral-500 mt-3">Required: email. Recommended: first_name, company, website, linkedin.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-4 rounded-2xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all"
              >
                Back
              </button>
              {csvData.length > 0 && (
                <button 
                  onClick={() => setStep(4)}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all"
                >
                  Next <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Choose a template</h2>
                <p className="text-neutral-500 text-sm sm:text-base">Select the email template you want to use for this campaign.</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={refreshTemplates}
                  className="text-neutral-500 hover:text-neutral-900 transition-colors"
                  title="Refresh templates"
                >
                  <Loader2 size={16} className={cn(isUploading && "animate-spin")} />
                </button>
                <button 
                  onClick={onManageTemplates}
                  className="text-emerald-600 font-bold text-sm hover:underline flex items-center gap-1"
                >
                  Manage Templates <ArrowRight size={14} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2">
              {/* AI Generated Template - Premium Only */}
              <div 
                onClick={() => isPremium ? setSelectedTemplateId('ai-generated') : null}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all relative group",
                  selectedTemplateId === 'ai-generated' ? "border-emerald-500 bg-emerald-50" : 
                  isPremium ? "border-purple-200 hover:border-purple-400 cursor-pointer" : "border-neutral-100 cursor-not-allowed opacity-60"
                )}
              >
                {selectedTemplateId === 'ai-generated' && (
                  <div className="absolute top-4 right-4 text-emerald-600">
                    <Check size={20} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600 mb-2">
                  <Sparkles size={12} /> AI Generated
                  {!isPremium && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">Premium</span>}
                </div>
                <h3 className="font-bold text-lg mb-2">AI Auto-Generated Email</h3>
                <p className="text-xs text-neutral-500 line-clamp-2 italic">"AI will generate personalized emails for each recipient based on their company website & LinkedIn profile"</p>
                {!isPremium && (
                  <div className="mt-3 text-xs text-amber-600 font-medium">
                    Upgrade to Premium to use AI-generated emails
                  </div>
                )}
              </div>
              
              {templates.map((template) => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={cn(
                    "p-6 rounded-2xl border-2 cursor-pointer transition-all relative group",
                    selectedTemplateId === template.id ? "border-emerald-500 bg-emerald-50" : "border-neutral-100 hover:border-emerald-200"
                  )}
                >
                  {selectedTemplateId === template.id && (
                    <div className="absolute top-4 right-4 text-emerald-600">
                      <Check size={20} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2">
                    <Mail size={12} /> {template.category}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 italic">"{template.subject}"</p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-4 rounded-2xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all"
              >
                Back
              </button>
              <button 
                disabled={!selectedTemplateId}
                onClick={() => setStep(5)}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all"
              >
                Next <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Setup schedule</h2>
            <p className="text-neutral-500 mb-6 sm:mb-8 text-sm sm:text-base">Define when and how often your emails should be sent.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Start Time</label>
                <input 
                  type="time" 
                  value={schedule.startTime}
                  onChange={(e) => setSchedule({...schedule, startTime: e.target.value})}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">End Time</label>
                <input 
                  type="time" 
                  value={schedule.endTime}
                  onChange={(e) => setSchedule({...schedule, endTime: e.target.value})}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Interval (minutes)</label>
                <input 
                  type="number" 
                  value={schedule.interval}
                  onChange={(e) => setSchedule({...schedule, interval: parseInt(e.target.value)})}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Batch Size (emails per run)</label>
                <input 
                  type="number" 
                  value={schedule.batchSize}
                  onChange={(e) => setSchedule({...schedule, batchSize: parseInt(e.target.value)})}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="p-4 sm:p-8 bg-emerald-50 rounded-2xl sm:rounded-[32px] border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-100 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">AI Personalization</p>
                  <p className="text-sm text-emerald-700">Scrape LinkedIn & Website for custom emails</p>
                  {!isPremium && !limitsLoading && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-0 sm:ml-2 mt-1 sm:mt-0 inline-block">Premium</span>
                  )}
                </div>
              </div>
              {isPremium || limitsLoading ? (
                <button 
                  onClick={() => setEnrichmentEnabled(!enrichmentEnabled)}
                  className={cn(
                    "w-14 h-7 rounded-full transition-all relative",
                    enrichmentEnabled ? "bg-emerald-600" : "bg-neutral-300"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-1 transition-all",
                    enrichmentEnabled ? "left-8" : "left-1"
                  )} />
                </button>
              ) : (
                <button
                  onClick={() => window.location.hash = '#/pricing'}
                  className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>

            {/* Follow-ups Section */}
            <div className="mt-8 border-t border-neutral-100 pt-8">
              <button
                onClick={() => setShowFollowUps(!showFollowUps)}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                    <Mail size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-orange-900">Follow-up Sequences</p>
                    <p className="text-sm text-orange-700">Send up to 5 follow-ups to non-responders</p>
                  </div>
                </div>
                {showFollowUps ? <ChevronUp size={24} className="text-orange-600" /> : <ChevronDown size={24} className="text-orange-600" />}
              </button>

              {showFollowUps && (
                <div className="mt-4 space-y-4">
                  {!isPremium && !limitsLoading && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-amber-800 font-semibold mb-2">🔒 Follow-ups are a Premium Feature</p>
                      <p className="text-amber-700 text-sm mb-3">Upgrade to send automated follow-up sequences to increase your reply rate.</p>
                      <button
                        onClick={() => window.location.hash = '#/pricing'}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                  {followUps.map((followUp, index) => (
                    <div key={index} className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      followUp.enabled ? "border-orange-200 bg-orange-50" : "border-neutral-100 bg-neutral-50"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Follow-up #{index + 1}</span>
                          {followUp.enabled && (
                            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                              {followUp.daysAfter} days after
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const newFollowUps = [...followUps];
                            newFollowUps[index].enabled = !newFollowUps[index].enabled;
                            setFollowUps(newFollowUps);
                          }}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            followUp.enabled ? "bg-orange-500" : "bg-neutral-300"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                            followUp.enabled ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>

                      {followUp.enabled && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <label className="text-xs font-bold text-neutral-500">Send after:</label>
                            <select
                              value={followUp.daysAfter}
                              onChange={(e) => {
                                const newFollowUps = [...followUps];
                                newFollowUps[index].daysAfter = parseInt(e.target.value);
                                setFollowUps(newFollowUps);
                              }}
                              className="px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                            >
                              <option value={1}>1 day</option>
                              <option value={2}>2 days</option>
                              <option value={3}>3 days</option>
                              <option value={5}>5 days</option>
                              <option value={7}>7 days</option>
                              <option value={10}>10 days</option>
                              <option value={14}>14 days</option>
                              <option value={21}>21 days</option>
                            </select>
                            <span className="text-sm text-neutral-500">of previous email</span>
                          </div>

                          <input
                            type="text"
                            placeholder="Follow-up subject (leave empty for AI generation)"
                            value={followUp.subject}
                            onChange={(e) => {
                              const newFollowUps = [...followUps];
                              newFollowUps[index].subject = e.target.value;
                              setFollowUps(newFollowUps);
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-orange-400"
                          />

                          <textarea
                            placeholder="Follow-up email body (leave empty for AI generation)"
                            value={followUp.body}
                            onChange={(e) => {
                              const newFollowUps = [...followUps];
                              newFollowUps[index].body = e.target.value;
                              setFollowUps(newFollowUps);
                            }}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-orange-400 resize-none"
                          />

                          <button
                            onClick={() => generateFollowUpAI(index)}
                            disabled={generatingFollowUp === index}
                            className="w-full py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {generatingFollowUp === index ? (
                              <><Loader2 size={14} className="animate-spin" /> Generating...</>
                            ) : (
                              <><Sparkles size={14} /> Generate with AI</>
                            )}
                          </button>
                          
                          {/* Template suggestion based on follow-up number */}
                          <div className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded-lg">
                            <span className="font-bold">Tip:</span> {index === 0 && "Value proposition - mention benefits"}
                            {index === 1 && "Casual check-in - keep it short"}
                            {index === 2 && "Soft follow-up - offer help"}
                            {index === 3 && "Case study angle - social proof"}
                            {index === 4 && "Final attempt - friendly goodbye"}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-neutral-400 text-center">
                    Follow-ups will only be sent to contacts who haven't replied
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(4)}
                className="flex-1 px-6 py-4 rounded-2xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(6)}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all"
              >
                Next <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Review & Launch</h2>
            <p className="text-neutral-500 mb-6 sm:mb-8 text-sm sm:text-base">Check everything before starting your campaign.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 sm:p-6 bg-neutral-50 rounded-2xl sm:rounded-3xl border border-neutral-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Campaign</p>
                <p className="font-bold text-base sm:text-lg">{name}</p>
              </div>
              <div className="p-4 sm:p-6 bg-neutral-50 rounded-2xl sm:rounded-3xl border border-neutral-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Contacts</p>
                <p className="font-bold text-base sm:text-lg">{csvData.length} Leads</p>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-neutral-50 rounded-2xl sm:rounded-3xl border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Selected Template</p>
                {selectedTemplateId && (
                  <button 
                    onClick={() => setStep(4)}
                    className="text-xs text-emerald-600 hover:text-emerald-500 font-bold"
                  >
                    Change
                  </button>
                )}
              </div>
              {selectedTemplate ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="font-bold text-base sm:text-lg">{selectedTemplate.name}</p>
                  <span className="text-sm text-neutral-500 italic line-clamp-1 max-w-[50%] sm:max-w-none">"{selectedTemplate.subject}"</span>
                </div>
              ) : selectedTemplateId ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="flex items-center mb-2 text-emerald-600">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    <span className="font-medium">Finding template...</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono">ID: {selectedTemplateId}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Mail className="text-neutral-300 mb-2" size={32} />
                  <p className="text-neutral-500 font-medium mb-2">No template selected</p>
                  <button 
                    onClick={() => setStep(4)}
                    className="text-emerald-600 hover:text-emerald-500 text-sm font-bold flex items-center gap-1"
                  >
                    Choose one <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-emerald-50 rounded-2xl sm:rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Start Immediately</p>
                  <p className="text-xs text-emerald-700">Begin sending as soon as enrichment is done</p>
                </div>
              </div>
              <button 
                onClick={() => setStartImmediately(!startImmediately)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  startImmediately ? "bg-emerald-600" : "bg-neutral-300"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                  startImmediately ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(5)}
                className="flex-1 px-6 py-4 rounded-2xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleCreateCampaign}
                disabled={isUploading}
                className="flex-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <Sparkles size={20} />
                    {startImmediately ? 'Launch Campaign' : 'Save as Draft'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {isSmtpModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-12 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">SMTP Settings</h2>
              <button onClick={() => setIsSmtpModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveSmtp} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">SMTP Host</label>
                  <input 
                    type="text" 
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                    placeholder="smtp.zoho.com"
                    className="w-full px-6 py-4 rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Port</label>
                  <input 
                    type="number" 
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
                    className="w-full px-6 py-4 rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Username</label>
                  <input 
                    type="text" 
                    value={smtpSettings.user}
                    onChange={(e) => setSmtpSettings({...smtpSettings, user: e.target.value})}
                    placeholder="you@company.com"
                    className="w-full px-6 py-4 rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Password</label>
                  <input 
                    type="password" 
                    value={smtpSettings.pass}
                    onChange={(e) => setSmtpSettings({...smtpSettings, pass: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">From Name</label>
                  <input 
                    type="text" 
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings({...smtpSettings, fromName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-6 py-4 rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">From Email</label>
                  <input 
                    type="email" 
                    value={smtpSettings.fromEmail}
                    onChange={(e) => setSmtpSettings({...smtpSettings, fromEmail: e.target.value})}
                    placeholder="john@company.com"
                    className="w-full px-6 py-4 rounded-2xl border border-neutral-200 outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="submit" 
                  disabled={isTestingSmtp}
                  className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg shadow-emerald-200 transition-all"
                >
                  {isTestingSmtp ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      <Shield size={24} /> Verify & Save
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsSmtpModalOpen(false)} 
                  className="flex-1 border border-neutral-200 py-5 rounded-2xl font-bold hover:bg-neutral-50 transition-all text-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
