// import express from "express";
// import { createServer as createViteServer } from "vite";
// import path from "path";
// import cors from "cors";
// import dotenv from "dotenv";
// import axios from "axios";
// import * as cheerio from "cheerio";
// import { google } from "googleapis";

// // Freemium configuration
// const FREE_EMAIL_LIMIT = 100;

// // Check if user can send emails (freemium logic)
// async function canSendEmail(userId: string): Promise<{ allowed: boolean; remaining: number; isPremium: boolean }> {
//   try {
//     const userDoc = await db.collection('users').doc(userId).get();
//     const userData = userDoc.data();
    
//     if (!userData) {
//       return { allowed: false, remaining: 0, isPremium: false };
//     }
    
//     const isPremium = userData.subscriptionStatus === 'premium';
//     const emailsSent = userData.emailsSent || 0;
//     const remaining = Math.max(0, FREE_EMAIL_LIMIT - emailsSent);
    
//     // Premium users have unlimited emails
//     if (isPremium) {
//       return { allowed: true, remaining: -1, isPremium: true };
//     }
    
//     // Free users limited to 100 emails
//     return { allowed: emailsSent < FREE_EMAIL_LIMIT, remaining, isPremium: false };
//   } catch (error) {
//     console.error("Error checking email limit:", error);
//     return { allowed: false, remaining: 0, isPremium: false };
//   }
// }

// // Increment email count for user
// async function incrementEmailCount(userId: string): Promise<void> {
//   try {
//     await db.collection('users').doc(userId).update({
//       emailsSent: FieldValue.increment(1)
//     });
//   } catch (error) {
//     console.error("Error incrementing email count:", error);
//     // Try to set it if it doesn't exist
//     try {
//       await db.collection('users').doc(userId).set({
//         emailsSent: 1
//       }, { merge: true });
//     } catch (e) {
//       console.error("Error setting email count:", e);
//     }
//   }
// }

// // Check if user can use premium features
// async function canUsePremiumFeature(userId: string): Promise<boolean> {
//   try {
//     const userDoc = await db.collection('users').doc(userId).get();
//     const userData = userDoc.data();
//     return userData?.subscriptionStatus === 'premium';
//   } catch (error) {
//     return false;
//   }
// }
// import { GoogleGenAI } from "@google/genai";
// import nodemailer from "nodemailer";
// import * as admin from "firebase-admin";
// import { initializeApp, cert, getApps } from "firebase-admin/app";
// import { getFirestore, FieldValue } from "firebase-admin/firestore";
// import { getAuth } from "firebase-admin/auth";
// import fs from "fs";

// dotenv.config();

// // Load Firebase Config
// let firebaseConfig: any = {};
// try {
//   const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
//   if (fs.existsSync(firebaseConfigPath)) {
//     firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
//   }
// } catch (e) {
//   console.error("Error loading firebase-applet-config.json:", e);
// }

// // Initialize Firebase Admin
// let db: any;
// let auth: any;
// try {
//   if (firebaseConfig.projectId) {
//     if (!getApps().length) {
//       // Check for service account credentials
//       const hasCredentials = (firebaseConfig.privateKey && firebaseConfig.clientEmail) || 
//                             (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);
      
//       if (hasCredentials) {
//         // Use service account credentials
//         initializeApp({
//           credential: cert({
//             projectId: firebaseConfig.projectId,
//             clientEmail: firebaseConfig.clientEmail || process.env.FIREBASE_CLIENT_EMAIL,
//             privateKey: (firebaseConfig.privateKey || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
//           } as any),
//           projectId: firebaseConfig.projectId,
//         });
//       } else {
//         // Use Application Default Credentials (ADC)
//         console.log("No service account found, using Application Default Credentials");
//         initializeApp({
//           projectId: firebaseConfig.projectId,
//         });
//       }
//     }
    
//     if (getApps().length > 0) {
//       // Use the specific database ID if provided
//       db = firebaseConfig.firestoreDatabaseId 
//         ? getFirestore(getApps()[0], firebaseConfig.firestoreDatabaseId)
//         : getFirestore(getApps()[0]);
      
//       // Initialize Auth
//       auth = getAuth(getApps()[0]);
//     }
//   } else {
//     console.warn("No projectId found in firebase-applet-config.json. Firebase Admin not initialized.");
//   }
// } catch (e) {
//   console.error("Firebase Admin initialization error:", e);
// }

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.json());

// // --- GOOGLE OAUTH CONFIG ---
// const getOAuth2Client = (req?: express.Request) => {
//   let redirectUri: string;
  
//   // Check if this is a local development request
//   const isLocal = req && (req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1'));
  
//   // For local development, use localhost; for production, use APP_URL
//   if (isLocal) {
//     redirectUri = "http://localhost:3000/api/auth/google/callback";
//   } else if (process.env.APP_URL) {
//     redirectUri = `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`;
//   } else {
//     redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
//   }

//   if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//     console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Gmail OAuth will not work.");
//   }

//   return new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     redirectUri
//   );
// };

// const SCOPES = [
//   "https://www.googleapis.com/auth/gmail.send",
//   "https://www.googleapis.com/auth/gmail.readonly",
//   "https://www.googleapis.com/auth/spreadsheets",
//   
//   
// ];

// const SYSTEM_TEMPLATES = [
//   { id: 's1-1', name: 'SaaS: Initial Outreach', category: 'Sales', subject: 'Quick question about {{company}}\'s workflow', body: "Hi {{firstName}},\n\nI've been following {{company}} and noticed you're scaling your team. We help companies like yours automate their outreach and increase reply rates by 40%.\n\nDo you have 10 minutes next Tuesday to chat?\n\nBest,\n{{senderName}}" },
//   { id: 's2-1', name: 'Agency: Initial Outreach', category: 'Sales', subject: 'Helping {{company}} with {{service}}', body: "Hi {{firstName}},\n\nI love what you're doing at {{company}}. We specialize in {{service}} for companies in the {{industry}} space.\n\nWe recently helped a client achieve [Result]. Would you be open to a quick chat about how we could do the same for you?\n\nBest,\n{{senderName}}" },
//   { id: 'ne1', name: 'Networking: Intro Request', category: 'Networking', subject: 'I\'d love to connect, {{firstName}}', body: "Hi {{firstName}},\n\nI've been following your work in {{industry}} and would love to connect and learn more about what you're building.\n\nAre you open to a quick virtual coffee?\n\nBest,\n{{senderName}}" }
// ];

// // --- GEMINI CONFIG ---
// // Lazy initialize genAI to prevent crash if API key is missing during startup
// let genAI: any;
// function getGenAI() {
//   if (!genAI) {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       console.warn("GEMINI_API_KEY is missing. AI features will not work.");
//       return null;
//     }
//     genAI = new GoogleGenAI({ apiKey });
//   }
//   return genAI;
// }

// // --- REPLY TRACKING ---
// // Auto-response keywords to exclude
// const AUTO_RESPONSE_KEYWORDS = [
//   'out of office',
//   'out of the office',
//   'ooo',
//   'away',
//   'vacation',
//   'auto reply',
//   'auto-response',
//   'auto reply:',
//   'automatic reply',
//   'received your email',
//   'thank you for your email',
//   'acknowledgment',
//   'confirmed',
//   'thank you for contacting',
//   'mail delivery failed',
//   'undelivered',
//   'bounce',
//   'mailer-daemon',
//   'noreply',
//   'no-reply',
//   'donotreply',
//   'do not reply'
// ];

// async function checkForReplies() {
//   if (!db) return;
  
//   console.log("Reply Tracker: Checking for replies...");
  
//   try {
//     // Get all users with Google tokens
//     const usersSnapshot = await db.collection('users').where('googleTokens', '!=', null).get();
    
//     for (const userDoc of usersSnapshot.docs) {
//       const userData = userDoc.data();
//       if (!userData.googleTokens) continue;
      
//       const client = getOAuth2Client();
//       client.setCredentials(userData.googleTokens);
//       const gmail = google.gmail({ version: 'v1', auth: client });
      
//       // Get all messages from Sent folder
//       const response = await gmail.users.messages.list({
//         userId: 'me',
//         q: 'in:sent',
//         maxResults: 100
//       });
      
//       // Check for replies
//       const messages = response.data.messages || [];
//       console.log(`Checking ${messages.length} sent messages for replies...`);
      
//       for (const msg of messages) {
//         const msgDetail = await gmail.users.messages.get({
//           userId: 'me',
//           id: msg.id!
//         });
        
//         // Check if there's a thread with replies
//         const threadId = msgDetail.data.threadId;
//         if (threadId) {
//           const thread = await gmail.users.threads.get({
//             userId: 'me',
//             id: threadId
//           });
          
//           // If thread has more than 1 message, someone replied
//           if (thread.data.messages && thread.data.messages.length > 1) {
//             const lastMsg = thread.data.messages[thread.data.messages.length - 1];
//             const fromHeader = lastMsg.payload?.headers?.find(h => h.name === 'From');
//             const subjectHeader = msgDetail.data.payload?.headers?.find(h => h.name === 'Subject');
//             const toHeader = msgDetail.data.payload?.headers?.find(h => h.name === 'To');
            
//             // Check if the reply is from someone other than the sender
//             const fromEmailMatch = fromHeader?.value?.match(/<([^>]+)>/) || fromHeader?.value?.match(/^([^<]+)/);
//             const fromEmail = fromEmailMatch ? fromEmailMatch[1].trim().toLowerCase() : '';
//             const subjectLine = subjectHeader?.value || '';
            
//             // Skip if no from email or it's from the sender
//             if (!fromEmail || fromEmail === userData.email || !toHeader) continue;
            
//             // Extract reply email
//             const replyEmail = fromHeader.value;
//             const emailMatch = replyEmail.match(/<([^>]+)>/) || replyEmail.match(/^([^<]+)/);
//             const replyToEmail = emailMatch ? emailMatch[1].trim().toLowerCase() : '';
            
//             // Check for auto-responses - skip if it's an auto-response
//             const subjectLower = subjectLine.toLowerCase();
//             const isAutoResponse = AUTO_RESPONSE_KEYWORDS.some(keyword => 
//               subjectLower.includes(keyword) || 
//               (fromHeader.value && fromHeader.value.toLowerCase().includes(keyword))
//             );
            
//             if (isAutoResponse) {
//               console.log(`Skipping auto-response from: ${replyToEmail}, subject: ${subjectLine}`);
//               continue;
//             }
            
//             // Extract the TO email from the original sent message - this is the contact's email!
//             // The reply comes FROM the recipient, but the TO header in the sent message shows who it was sent TO
//             const toEmailMatch = toHeader?.value?.match(/<([^>]+)>/) || toHeader?.value?.match(/^([^<]+)/);
//             const originalRecipientEmail = toEmailMatch ? toEmailMatch[1].trim().toLowerCase() : '';
            
//             console.log(`Found potential reply from: ${replyToEmail} (sent to: ${originalRecipientEmail}) subject: ${subjectLine}`);
            
//             // Get ALL campaigns to find the contact
//             const campaignsSnapshot = await db.collection('campaigns').get();
//             console.log(`Searching across ${campaignsSnapshot.size} total campaigns for reply`);
            
//             // STRICT matching: match by subject AND the original recipient email (from To header)
//             let foundMatch = false;
//             const normalizedReplySubject = subjectLine.replace(/^Re:\s*/i, '').trim();
            
//             for (const campaignDoc of campaignsSnapshot.docs) {
//               const campaignData = campaignDoc.data();
//               const campaignSubject = campaignData.subject || '';
//               const normalizedCampaignSubject = campaignSubject.trim();
              
//               // Require exact subject match (after removing Re: prefix)
//               const subjectMatches = normalizedReplySubject.toLowerCase() === normalizedCampaignSubject.toLowerCase();
              
//               if (subjectMatches) {
//                 console.log(`Found subject match: campaign ${campaignDoc.id} with subject "${campaignSubject}"`);
                
//                 // Find contacts - match by the ORIGINAL RECIPIENT email (from To header), not the reply-from email
//                 const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`)
//                   .where('status', '==', 'sent')
//                   .get();
                
//                 // Match using the original recipient email (from To header)
//                 let matchedContact = null;
//                 for (const contactDoc of contactsSnapshot.docs) {
//                   const contact = contactDoc.data();
//                   const contactEmail = contact.email?.toLowerCase().trim();
                  
//                   // Match by the original recipient email (from To header in the sent message)
//                   if (contact.status === 'sent' && !contact.replied && 
//                       contactEmail && originalRecipientEmail && 
//                       (contactEmail === originalRecipientEmail || 
//                        contactEmail.includes(originalRecipientEmail) || 
//                        originalRecipientEmail.includes(contactEmail))) {
//                     matchedContact = contactDoc;
//                     console.log(`Found contact by original recipient email: ${contact.email}`);
//                     break;
//                   }
//                 }
                
//                 if (matchedContact) {
//                   const contact = matchedContact.data();
//                   await matchedContact.ref.update({
//                     replied: true,
//                     repliedAt: FieldValue.serverTimestamp()
//                   });
//                   console.log(`✓ Tracked REAL reply for contact ${contact.email} in campaign ${campaignDoc.id}`);
//                   foundMatch = true;
//                   break;
//                 }
//               }
              
//               if (foundMatch) break;
//             }
            
//             if (!foundMatch) {
//               console.log(`No matching contact found for reply`);
//             }
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Reply tracking error:", error);
//   }
// }

// // --- AUTOMATION ENGINE ---
// async function processCampaigns() {
//   if (!db) {
//     console.log("Automation Engine: Firestore not initialized, skipping...");
//     return;
//   }
//   console.log("Automation Engine: Checking for pending emails...");
  
//   try {
//     const campaignsSnapshot = await db.collection('campaigns')
//       .where('status', '==', 'sending')
//       .get();

//     for (const campaignDoc of campaignsSnapshot.docs) {
//       const campaign = campaignDoc.data();
//       const { schedule, userId, templateId, enrichmentEnabled } = campaign;

//       // Check email limit for free users (before processing any contacts)
//       const limitCheck = await canSendEmail(userId);
//       if (!limitCheck.allowed) {
//         console.log(`User ${userId} has reached free email limit (${FREE_EMAIL_LIMIT}). Pausing campaign ${campaign.name}`);
//         await campaignDoc.ref.update({ 
//           status: 'paused',
//           pauseReason: 'free_limit_reached'
//         });
//         continue;
//       }

//       // 1. Check Schedule (Timezone & Time Window) - skip if forceRun is true
//       const forceRun = campaign.forceRun || false;
//       if (!forceRun) {
//         const now = new Date();
//         const userTime = new Date(now.toLocaleString("en-US", { timeZone: schedule.timezone }));
//         const currentHour = userTime.getHours();
//         const currentMinute = userTime.getMinutes();
//         const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

//         if (currentTimeStr < schedule.startTime || currentTimeStr > schedule.endTime) {
//           console.log(`Campaign ${campaign.name} is outside its scheduled window (${currentTimeStr})`);
//           continue;
//         }
//       } else {
//         console.log(`Campaign ${campaign.name} is running in forced mode (bypassing schedule)`);
//       }

//       // 2. Find next pending contacts (batch)
//       const batchSize = schedule.batchSize || 10;
//       const contactSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`)
//         .where('status', '==', 'pending')
//         .limit(batchSize)
//         .get();

//       if (contactSnapshot.empty) {
//         console.log(`Campaign ${campaign.name} has no more pending contacts.`);
//         await campaignDoc.ref.update({ status: 'completed' });
//         continue;
//       }

//       for (const contactDoc of contactSnapshot.docs) {
//         const contact = contactDoc.data();

//         // 3. Enrichment & Personalization (if enabled) - Premium only!
//         let personalization = contact.personalization || {};
//         console.log('LOADED personalization from contact:', JSON.stringify(personalization));
        
//         // Check if user is premium for enrichment/scraping
//         const isPremium = await canUsePremiumFeature(userId);
//         const enrichmentAllowed = isPremium && enrichmentEnabled;
        
//         if (enrichmentAllowed && contact.enrichment?.status === 'pending') {
//           console.log(`Enriching contact ${contact.email}...`);
//           try {
//             let enrichedData: any = {};
//             if (contact.website) {
//               const response = await axios.get(contact.website, { timeout: 5000 });
//               const $ = cheerio.load(response.data);
//               enrichedData.title = $("title").text();
//               enrichedData.description = $('meta[name="description"]').attr("content") || "";
//               enrichedData.snippet = $("p").slice(0, 3).text().substring(0, 500);
//             }
            
//             if (contact.linkedinUrl) {
//               enrichedData.linkedin = "Simulated LinkedIn profile data for " + contact.linkedinUrl;
//             }

//             await contactDoc.ref.update({ 
//               enrichment: { status: 'completed', data: enrichedData } 
//             });
//             contact.enrichment = { status: 'completed', data: enrichedData };
//           } catch (err) {
//             console.error(`Enrichment failed for ${contact.email}:`, err);
//             await contactDoc.ref.update({ enrichment: { status: 'failed' } });
//           }
//         }

//         // 4. AI Personalization (if template provided)
//         // Only generate AI email if templateId is 'ai-generated' and no personalization exists yet
//         const hasPersonalization = personalization && personalization.body && personalization.body.trim().length > 0;
//         const isAIGenerated = templateId === 'ai-generated';
        
//         // If NOT using AI-generated template, clear any existing AI personalization to use template instead
//         if (!isAIGenerated && hasPersonalization) {
//           console.log('Regular template selected - clearing any AI personalization to use template');
//           personalization = {};
//         }
        
//         // Re-check personalization after clearing
//         const hasPersonalizationAfter = personalization && personalization.body && personalization.body.trim().length > 0;
        
//         // Only run AI generation for 'ai-generated' template type, and only if no personalization exists
//         if (isAIGenerated && !hasPersonalizationAfter) {
//           console.log(`Generating AI personalized email for ${contact.email}...`);
          
//           try {
//             const ai = getGenAI();
//             if (ai) {
//                 // Generate AI email from scratch without a template base
//                 const response = await ai.models.generateContent({
//                   model: "gemini-3-flash-preview",
//                   contents: `
//                     You are an expert email copywriter. Create a highly personalized outreach email from scratch.
                    
//                     LEAD INFO:
//                     Name: ${contact.firstName} ${contact.lastName}
//                     Company: ${contact.company}
//                     Website: ${contact.website}
//                     LinkedIn: ${contact.linkedinUrl}
                    
//                     ENRICHMENT DATA:
//                     ${JSON.stringify(contact.enrichment?.data || {})}
                    
//                     INSTRUCTIONS:
//                     1. Create a compelling, personalized cold outreach email from scratch.
//                     2. Make it sound human, not AI-generated.
//                     3. Keep it concise and professional (3-4 short paragraphs max).
//                     4. Include a clear call-to-action.
//                     5. Do NOT use placeholders like {{firstName}} - use the actual name.
                    
//                     Return the result as JSON:
//                     {
//                       "subject": "...",
//                       "body": "..."
//                     }
//                   `,
//                   config: {
//                     responseMimeType: "application/json"
//                   }
//                 });

//                 const personalized = JSON.parse(response.text || "{}");
//                 if (personalized.subject && personalized.body) {
//                   personalization = personalized;
//                   // Store in aiGeneratedEmail for future use
//                   await contactDoc.ref.update({ 
//                     personalization,
//                     aiGeneratedEmail: personalization 
//                   });
//                   console.log('AI-generated email created and stored');
//                 }
//               }
//             } catch (err) {
//               console.error(`AI generation failed for ${contact.email}:`, err);
//             }
//           }
//           // If NOT AI-generated, just skip (template will be used as-is)
//         }
        
//         // If still no personalization, use template directly (skip for AI-generated mode)
//         if (!personalization?.body && templateId && !isAIGenerated) {
//           const templateDoc = await db.collection('templates').doc(templateId).get();
//           const template = templateDoc.data() || SYSTEM_TEMPLATES.find(t => t.id === templateId);
//           if (template) {
//             personalization = { subject: template.subject, body: template.body };
//           }
//         }

//         // 5. Send Email
//         console.log(`Sending email to ${contact.email} for campaign ${campaign.name}`);
//         console.log(`DEBUG: templateId = "${templateId}", hasPersonalization = ${hasPersonalization}`);
//         console.log(`DEBUG: contact.personalization =`, contact.personalization);
        
//         // Get User Settings (Gmail or SMTP)
//         const userDoc = await db.collection('users').doc(userId).get();
//         const userData = userDoc.data();

//         // ALWAYS get the campaign's template first
//         let emailSubject = 'Quick question';
//         let emailBody = 'Hi {{firstName}},\n\nI noticed what {{company}} is doing and I think we could help.\n\nWould you be open to a quick chat?\n\nBest,\n{{senderName}}';
        
//         // Re-check if this is an AI-generated campaign
//         const isAIGeneratedCampaign = templateId === 'ai-generated';
        
//         // First, try to get template from campaign (only if NOT AI-generated mode)
//         if (templateId && !isAIGeneratedCampaign) {
//           console.log('Using user-selected template (not AI-generated)');
//           console.log('Looking for template with ID:', templateId);
//           const templateDoc = await db.collection('templates').doc(templateId).get();
//           let template = templateDoc.data();
//           console.log('Firestore template found:', !!template);
//           if (!template && templateId) {
//             template = SYSTEM_TEMPLATES.find(t => t.id === templateId);
//             console.log('System template found:', !!template);
//           }
//           if (template) {
//             emailSubject = template.subject;
//             emailBody = template.body;
//             console.log('Loaded user-selected template:', template.name || templateId);
//           }
//         }
        
//         // If AI-generated mode, try to use any existing AI-generated email from the contact
//         if (isAIGeneratedCampaign) {
//           console.log('AI-generated campaign detected, checking for existing AI email...');
//           // Use aiGeneratedEmail if available (stored from previous AI generation)
//           if (contact.aiGeneratedEmail) {
//             const aiEmail = contact.aiGeneratedEmail;
//             if (aiEmail.subject) emailSubject = aiEmail.subject;
//             if (aiEmail.body) emailBody = aiEmail.body;
//             console.log('Using existing AI-generated email from contact');
//           } else if (personalization?.subject || personalization?.body) {
//             // Use personalization if exists - ACTUALLY USE IT!
//             console.log('Using personalization from contact:', personalization);
//             if (personalization.subject) emailSubject = personalization.subject;
//             if (personalization.body) emailBody = personalization.body;
//           } else {
//             // Need to generate AI email - use a default base template for AI generation
//             console.log('No AI email found, will generate new one during personalization phase');
//           }
//         }
        
//         // If still no template, try to load any available template
//         if (!emailBody) {
//           console.log('No template found by templateId, trying to load from Firestore...');
//           try {
//             const templatesSnapshot = await db.collection('templates').limit(1).get();
//             if (!templatesSnapshot.empty) {
//               const template = templatesSnapshot.docs[0].data();
//               emailSubject = template.subject;
//               emailBody = template.body;
//               console.log('Loaded first available template from Firestore:', templatesSnapshot.docs[0].id);
//             }
//           } catch (e) {
//             console.log('No templates in Firestore, using system template');
//             // Use first system template as fallback
//             const sysTemplate = SYSTEM_TEMPLATES[0];
//             if (sysTemplate) {
//               emailSubject = sysTemplate.subject;
//               emailBody = sysTemplate.body;
//             }
//           }
//         }
        
//         // Then override with personalization if exists
//         if (personalization?.subject && personalization?.subject.trim()) emailSubject = personalization.subject;
//         if (personalization?.body && personalization?.body.trim()) emailBody = personalization.body;
        
//         // Then override with personalization if exists (for non-AI campaigns)
//         if (!isAIGeneratedCampaign && personalization?.subject && personalization?.subject.trim()) {
//           emailSubject = personalization.subject;
//         }
//         if (!isAIGeneratedCampaign && personalization?.body && personalization?.body.trim()) {
//           emailBody = personalization.body;
//         }
        
//         console.log('=== EMAIL CONTENT DEBUG ===');
//         console.log('TemplateId:', templateId);
//         console.log('Personalization:', JSON.stringify(personalization));
//         console.log('Final Subject:', emailSubject);
//         console.log('Final Body (first 200 chars):', emailBody?.substring(0, 200));
//         console.log('===========================');
        
//         if (!emailSubject || !emailBody) {
//           // Try to get template from campaign - first Firestore, then system templates
//           const templateDoc = await db.collection('templates').doc(templateId).get();
//           let template = templateDoc.data();
          
//           // Fallback to system templates if not found in Firestore
//           if (!template && templateId) {
//             template = SYSTEM_TEMPLATES.find(t => t.id === templateId);
//           }
          
//           if (template) {
//             emailSubject = template.subject;
//             emailBody = template.body;
//           }
//         }
        
//         // Get template as fallback if no personalization
//         if (!emailBody && templateId) {
//           console.log('No email body found, loading template directly...');
//           const templateDoc = await db.collection('templates').doc(templateId).get();
//           const template = templateDoc.data() || SYSTEM_TEMPLATES.find(t => t.id === templateId);
//           if (template) {
//             emailSubject = template.subject;
//             emailBody = template.body;
//             console.log('Loaded template:', template.name);
//           }
//         }
        
//         // Final fallback
//         console.log('BEFORE FALLBACK - emailSubject:', emailSubject, 'emailBody:', emailBody?.substring(0, 100));
//         emailSubject = emailSubject || "Quick question about your company";
//         emailBody = emailBody || "Hi {{firstName}},\n\nI noticed what {{company}} is doing and thought I'd reach out.\n\nWould you be open to a quick chat?\n\nBest,\n{{senderName}}";
//         console.log('AFTER FALLBACK - emailSubject:', emailSubject, 'emailBody:', emailBody?.substring(0, 100));
        
//         // Replace placeholders with contact data
//         emailSubject = emailSubject
//           .replace(/\{\{firstName\}\}/g, contact.firstName || '')
//           .replace(/\{\{lastName\}\}/g, contact.lastName || '')
//           .replace(/\{\{company\}\}/g, contact.company || '');
        
//         emailBody = emailBody
//           .replace(/\{\{firstName\}\}/g, contact.firstName || '')
//           .replace(/\{\{lastName\}\}/g, contact.lastName || '')
//           .replace(/\{\{company\}\}/g, contact.company || '');
        
//         // Get sender's name from user profile or SMTP settings
//         const senderName = userData?.displayName || userData?.smtpSettings?.fromName || userData?.name || 'Your Name';
//         console.log('Sender name:', senderName);
        
//         // Replace {{senderName}} placeholder in the email body (case insensitive)
//         emailBody = emailBody.split('{{senderName}}').join(senderName);
        
//         // Also append sender name at the end if not already there
//         if (!emailBody.includes(senderName)) {
//           emailBody = emailBody + '\n\n' + senderName;
//         }
        
//         console.log(`Using email - Subject: ${emailSubject}, Body: ${emailBody.substring(0, 50)}...`);
        
//         // Add open tracking pixel (for HTML emails)
//         const appUrl = process.env.APP_URL || 'http://localhost:3000';
//         const trackingPixel = `<img src="${appUrl}/api/track/open?campaignId=${campaignDoc.id}&contactId=${contactDoc.id}" width="1" height="1" style="display:none" />`;
//         const htmlBody = `<html><body><pre style="font-family: sans-serif;">${emailBody}</pre>${trackingPixel}</body></html>`;

//         let sent = false;

//         if (userData?.smtpSettings) {
//           // Use SMTP
//           const transporter = nodemailer.createTransport({
//             host: userData.smtpSettings.host,
//             port: userData.smtpSettings.port,
//             secure: userData.smtpSettings.secure,
//             auth: {
//               user: userData.smtpSettings.user,
//               pass: userData.smtpSettings.pass
//             }
//           });

//           await transporter.sendMail({
//             from: `"${userData.smtpSettings.fromName}" <${userData.smtpSettings.fromEmail}>`,
//             to: contact.email,
//             subject: emailSubject,
//             text: emailBody,
//             html: htmlBody
//           });
//           sent = true;
//         } else if (userData?.googleTokens) {
//           // Use Gmail API
//           try {
//             const client = getOAuth2Client();
//             client.setCredentials(userData.googleTokens);
//             const gmail = google.gmail({ version: 'v1', auth: client });
            
//             const utf8Subject = `=?utf-8?B?${Buffer.from(emailSubject).toString('base64')}?=`;
//             const messageParts = [
//               `From: ${userData.email}`,
//               `To: ${contact.email}`,
//               `Content-Type: text/html; charset=utf-8`,
//               `MIME-Version: 1.0`,
//               `Subject: ${utf8Subject}`,
//               ``,
//               htmlBody,
//             ];
//             const message = messageParts.join('\n');
//             const encodedMessage = Buffer.from(message)
//               .toString('base64')
//               .replace(/\+/g, '-')
//               .replace(/\//g, '_')
//               .replace(/=+$/, '');

//             await gmail.users.messages.send({
//               userId: 'me',
//               requestBody: {
//                 raw: encodedMessage,
//               },
//             });
//             sent = true;
//           } catch (err) {
//             console.error(`Gmail API sending failed for ${contact.email}:`, err);
//           }
//         }

//         if (sent) {
//           // Increment email count for user
//           await incrementEmailCount(campaign.userId);
          
//           // Get follow-ups from campaign (only for premium users)
//           const followUps = campaign.followUps || [];
          
//           // Check if user can use follow-ups (premium only)
//           const canFollowUp = await canUsePremiumFeature(campaign.userId);
//           const activeFollowUps = canFollowUp ? followUps : [];
          
//           if (activeFollowUps.length > 0) {
//             // Schedule first follow-up
//             const firstFollowUp = followUps[0];
//             const followUpDate = new Date();
//             followUpDate.setDate(followUpDate.getDate() + firstFollowUp.daysAfter);
            
//             await contactDoc.ref.update({
//               status: 'sent',
//               sentAt: FieldValue.serverTimestamp()
//             });
//           }
//         }
//       }
//     }
//   catch (error) {
//     console.error("Automation Engine Error:", error);
//   }

//   // --- EMAIL TRACKING ---
// // (Proper implementation at line ~1286)

// // Run automation engine every minute
// setInterval(processCampaigns, 60000);

// // Run reply checker every 2 minutes
// setInterval(checkForReplies, 120000);

// // --- API ROUTES ---

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok" });
// });

// // Get user subscription status and email limits
// app.get("/api/user/limit", async (req, res) => {
//   const userId = req.headers['x-user-id'] as string;
  
//   if (!userId) {
//     return res.status(400).json({ error: "userId is required" });
//   }
  
//   try {
//     const userDoc = await db.collection('users').doc(userId).get();
//     const userData = userDoc.data();
    
//     if (!userData) {
//       return res.status(404).json({ error: "User not found" });
//     }
    
//     const isPremium = userData.subscriptionStatus === 'premium';
//     const emailsSent = userData.emailsSent || 0;
//     const remaining = Math.max(0, FREE_EMAIL_LIMIT - emailsSent);
    
//     res.json({
//       isPremium,
//       emailsSent,
//       freeLimit: FREE_EMAIL_LIMIT,
//       remaining: isPremium ? -1 : remaining,
//       canSendEmail: isPremium || emailsSent < FREE_EMAIL_LIMIT
//     });
//   } catch (error) {
//     console.error("Error getting user limit:", error);
//     res.status(500).json({ error: "Failed to get user limit" });
//   }
// });

// // Admin endpoint to set user subscription status
// app.post("/api/admin/set-subscription", async (req, res) => {
//   const { userId, subscriptionStatus } = req.body;
//   const adminKey = req.headers['x-admin-key'] as string;
  
//   // Simple admin key check (in production, use proper auth)
//   if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key') {
//     return res.status(403).json({ error: "Unauthorized" });
//   }
  
//   if (!userId || !subscriptionStatus) {
//     return res.status(400).json({ error: "userId and subscriptionStatus are required" });
//   }
  
//   try {
//     await db.collection('users').doc(userId).update({
//       subscriptionStatus
//     });
    
//     res.json({ success: true, message: `User subscription set to ${subscriptionStatus}` });
//   } catch (error) {
//     console.error("Error setting subscription:", error);
//     res.status(500).json({ error: "Failed to set subscription" });
//   }
// });

// // Google Auth URL
// app.get("/api/auth/google/url", (req, res) => {
//   const { userId, reconnect } = req.query;
//   if (!userId) {
//     return res.status(400).json({ error: "userId is required" });
//   }

//   if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//     return res.status(500).json({ 
//       error: "Google OAuth credentials missing", 
//       message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables." 
//     });
//   }
  
//   const client = getOAuth2Client(req);
  
//   // If reconnect=true, force consent to get new scopes
//   const url = client.generateAuthUrl({
//     access_type: "offline",
//     scope: SCOPES,
//     prompt: reconnect === "true" ? "consent select_account" : "consent",
//     state: userId as string,
//   });
//   res.json({ url });
// });

// // Google Auth Callback
// app.get("/api/auth/google/callback", async (req, res) => {
//   const { code, state: userId } = req.query;
//   try {
//     const client = getOAuth2Client(req);
//     const { tokens } = await client.getToken(code as string);
    
//     // Store tokens in Firestore
//     if (db && userId) {
//       const userRef = db.collection('users').doc(userId as string);
//       await userRef.set({
//         googleTokens: tokens,
//         gmailConnected: true,
//         updatedAt: FieldValue.serverTimestamp()
//       }, { merge: true });
//     }

//     res.send(`
//       <html>
//         <body>
//           <script>
//             if (window.opener) {
//               window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
//               window.close();
//             } else {
//               window.location.href = '/';
//             }
//           </script>
//           <p>Authentication successful! You can close this window.</p>
//         </body>
//       </html>
//     `);
//   } catch (error) {
//     console.error("Error exchanging code for tokens:", error);
//     res.status(500).send("Authentication failed.");
//   }
// });

// // Scraping & Enrichment Route - Premium only!
// app.post("/api/enrich", async (req, res) => {
//   const { website, linkedinUrl } = req.body;
//   const userId = req.headers['x-user-id'] as string;
  
//   // Check if user is premium
//   if (!userId || !(await canUsePremiumFeature(userId))) {
//     return res.status(403).json({ 
//       success: false, 
//       error: 'Premium feature. Website and LinkedIn scraping requires a premium subscription.' 
//     });
//   }
  
//   let enrichedData: any = {};

//   try {
//     if (website) {
//       const response = await axios.get(website, { timeout: 5000 });
//       const $ = cheerio.load(response.data);
//       enrichedData.title = $("title").text();
//       enrichedData.description = $('meta[name="description"]').attr("content") || "";
//       enrichedData.h1 = $("h1").first().text();
//       // Basic scraping for "what they do"
//       enrichedData.snippet = $("p").slice(0, 3).text().substring(0, 500);
//     }

//     // LinkedIn scraping is complex and usually requires a proxy/API
//     // For this implementation, we'll simulate the data if a URL is provided
//     if (linkedinUrl) {
//       enrichedData.linkedin = "Simulated LinkedIn profile data for " + linkedinUrl;
//     }

//     res.json({ success: true, data: enrichedData });
//   } catch (error) {
//     console.error("Enrichment error:", error);
//     res.status(500).json({ success: false, error: "Failed to enrich lead data" });
//   }
// });

// // AI Personalization Route
// app.post("/api/personalize", async (req, res) => {
//   const { lead, template, enrichment } = req.body;

//   try {
//     const ai = getGenAI();
//     if (!ai) {
//       return res.status(500).json({ success: false, error: "AI service not configured" });
//     }

//     const response = await ai.models.generateContent({
//       model: "gemini-3-flash-preview",
//       contents: `
//         You are an expert sales copywriter. Write a highly personalized email for the following lead.
        
//         Lead Name: ${lead.firstName} ${lead.lastName}
//         Company: ${lead.company}
//         Template Subject: ${template.subject}
//         Template Body: ${template.body}
        
//         Enriched Data: ${JSON.stringify(enrichment)}
        
//         Instructions:
//         1. Use the enriched data to make the email feel personal and researched.
//         2. Mention something specific from their website or LinkedIn if available.
//         3. Keep the tone professional but conversational.
//         4. Output only the final Subject and Body in JSON format.
//       `,
//       config: {
//         responseMimeType: "application/json"
//       }
//     });

//     const personalized = JSON.parse(response.text || "{}");
//     res.json({ success: true, personalized });
//   } catch (error) {
//     console.error("Personalization error:", error);
//     res.status(500).json({ success: false, error: "Failed to generate personalized email" });
//   }
// });

// // Generate Email Route
// app.post("/api/generate-email", async (req, res) => {
//   const { firstName, company, websiteData, type, followUpNumber, previousSubject, previousBody, daysAfter } = req.body;

//   try {
//     const ai = getGenAI();
//     if (!ai) {
//       return res.status(500).json({ error: "AI service not configured" });
//     }

//     let prompt = '';
//     let subjectPrompt = '';

//     if (type === 'followup') {
//       // Follow-up email generation with better prompting
//       const followUpNumberText = ['First', 'Second', 'Third', 'Fourth', 'Fifth'][followUpNumber - 1] || 'Follow-up';
      
//       subjectPrompt = `
//         Generate a subject line for a ${followUpNumberText} follow-up email (follow-up #${followUpNumber}).
//         - Previous email subject was: ${previousSubject}
//         - Keep it short, curiosity-building, and different from the original.
//         - Avoid: "Following up", "Just checking in" - these are overused.
//         - Good examples: "Thoughts on this?", "Quick question", "${company} + [your company]"
//         - Return just the subject line, nothing else.
//       `;

//       prompt = `
//         You are an expert sales copywriter. Write a highly effective, human-like ${followUpNumberText} follow-up email.
        
//         CONTEXT:
//         - This is follow-up #${followUpNumber} (${daysAfter} days after the previous email)
//         - Previous email subject: ${previousSubject}
//         - Previous email body: ${previousBody}
//         - Recipient first name: ${firstName}
//         - Recipient company: ${company}
        
//         STRATEGY:
//         1. The previous email likely didn't get a response - that's okay!
//         2. This follow-up should be SHORTER than the original (2-3 sentences max)
//         3. Add value or a new angle - not just "checking in"
//         4. Use a different hook than the first email
//         5. Make it feel like a natural follow-up from a real person
//         6. Include {{firstName}} placeholder if you mention their name
        
//         TONE:
//         - Professional but casual
//         - Not pushy or desperate
//         - Confident and helpful
//         - Like you're sharing something valuable
        
//         OUTPUT FORMAT (JSON):
//         {
//           "subject": "your generated subject line",
//           "body": "your generated email body"
//         }
        
//         Make it genuine, compelling, and likely to get a response. Don't be generic!
//       `;
//     } else {
//       // Original email generation
//       prompt = `
//         You are an expert sales copywriter. Write a short, personalized cold outreach email.
        
//         Recipient: ${firstName}
//         Company: ${company}
//         Website Info: ${JSON.stringify(websiteData)}
        
//         Instructions:
//         1. Keep the email short (3-4 sentences)
//         2. Be specific to their company
//         3. Include a clear call-to-action
//         4. Output just the email body text, nothing else.
//       `;
//     }

//     const response = await ai.models.generateContent({
//       model: "gemini-3-flash-preview",
//       contents: prompt,
//       config: {
//         responseMimeType: "application/json"
//       }
//     });

//     // Parse the response
//     let result = {};
//     try {
//       result = JSON.parse(response.text || "{}");
//     } catch (e) {
//       // If not JSON, treat as plain email body
//       result = { body: response.text, subject: "" };
//     }

//     res.json(result);
//   } catch (error) {
//     console.error("Generate email error:", error);
//     res.status(500).json({ error: "Failed to generate email" });
//   }
// });

// SMTP Test Route removed - using the active one below instead

// // Email Open Tracking Endpoint
// app.get("/api/track/open", async (req, res) => {
//   const { campaignId, contactId } = req.query;
  
//   if (!db || !campaignId || !contactId) {
//     // Return 1x1 transparent pixel
//     return res.set('Content-Type', 'image/gif').send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
//   }
  
//   try {
//     const contactRef = db.doc(`campaigns/${campaignId}/contacts/${contactId}`);
//     await contactRef.update({
//       opened: true,
//       openedAt: FieldValue.serverTimestamp()
//     });
//     console.log(`Tracked open for contact ${contactId} in campaign ${campaignId}`);
//   } catch (error) {
//     console.error("Error tracking open:", error);
//   }
  
//   // Return 1x1 transparent pixel
//   return res.set('Content-Type', 'image/gif').send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
// });

// // Start Campaign - bypasses schedule and starts sending immediately
// app.post("/api/campaigns/:campaignId/start", async (req, res) => {
//   const { campaignId } = req.params;
//   const { userId } = req.body;

//   if (!db) {
//     return res.status(500).json({ error: "Database not initialized" });
//   }

//   try {
//     const campaignRef = db.doc(`campaigns/${campaignId}`);
//     await campaignRef.update({
//       status: 'sending',
//       forceRun: true, // Bypass schedule check
//       startedAt: FieldValue.serverTimestamp()
//     });
//     res.json({ success: true, message: "Campaign started!" });
//   } catch (error) {
//     console.error("Start campaign error:", error);
//     res.status(500).json({ error: "Failed to start campaign" });
//   }
// });

// // Stop/Pause Campaign
// app.post("/api/campaigns/:campaignId/stop", async (req, res) => {
//   const { campaignId } = req.params;
//   const { userId } = req.body;

//   if (!db) {
//     return res.status(500).json({ error: "Database not initialized" });
//   }

//   try {
//     const campaignRef = db.doc(`campaigns/${campaignId}`);
//     await campaignRef.update({
//       status: 'paused',
//       forceRun: false,
//       stoppedAt: FieldValue.serverTimestamp()
//     });
//     res.json({ success: true, message: "Campaign paused!" });
//   } catch (error) {
//     console.error("Stop campaign error:", error);
//     res.status(500).json({ error: "Failed to stop campaign" });
//   }
// });

// // Reset reply tracking - clears all replied flags
// app.post("/api/admin/reset-replies", async (req, res) => {
//   if (!db) {
//     return res.status(500).json({ error: "Database not initialized" });
//   }

//   try {
//     const campaignsSnapshot = await db.collection('campaigns').get();
//     let totalReset = 0;

//     for (const campaignDoc of campaignsSnapshot.docs) {
//       const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`).get();
      
//       for (const contactDoc of contactsSnapshot.docs) {
//         const contact = contactDoc.data();
//         if (contact.replied === true) {
//           await contactDoc.ref.update({
//             replied: false,
//             repliedAt: FieldValue.delete()
//           });
//           totalReset++;
//         }
//       }
//     }

//     console.log(`Reset ${totalReset} contacts replied status to false`);
//     res.json({ success: true, message: `Reset ${totalReset} contacts` });
//   } catch (error) {
//     console.error("Error resetting replies:", error);
//     res.status(500).json({ error: "Failed to reset replies" });
//   }
// });

// // Reset open tracking - clears all opened flags
// app.post("/api/admin/reset-opens", async (req, res) => {
//   if (!db) {
//     return res.status(500).json({ error: "Database not initialized" });
//   }

//   try {
//     const campaignsSnapshot = await db.collection('campaigns').get();
//     let totalReset = 0;

//     for (const campaignDoc of campaignsSnapshot.docs) {
//       const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`).get();
      
//       for (const contactDoc of contactsSnapshot.docs) {
//         const contact = contactDoc.data();
//         if (contact.opened === true) {
//           await contactDoc.ref.update({
//             opened: false,
//             openedAt: FieldValue.delete()
//           });
//           totalReset++;
//         }
//       }
//     }

//     console.log(`Reset ${totalReset} contacts opened status to false`);
//     res.json({ success: true, message: `Reset ${totalReset} contacts` });
//   } catch (error) {
//     console.error("Error resetting opens:", error);
//     res.status(500).json({ error: "Failed to reset opens" });
//   }
// });

// // --- VITE MIDDLEWARE ---
// async function startServer() {
//   console.log("Starting server...");
//   try {
//     if (process.env.NODE_ENV !== "production") {
//       console.log("Initializing Vite middleware...");
//       const vite = await createViteServer({
//         server: { middlewareMode: true },
//         appType: "spa",
//       });
//       app.use(vite.middlewares);
//       console.log("Vite middleware initialized.");
//     } else {
//       const distPath = path.join(process.cwd(), "dist");
//       app.use(express.static(distPath));
//       app.get("*", (req, res) => {
//         res.sendFile(path.join(distPath, "index.html"));
//       });
//     }

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Error starting server:", error);
//   }
// }

// startServer();
// }

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

dotenv.config();

// Freemium configuration
const FREE_EMAIL_LIMIT = 100;

// Load Firebase Config
let firebaseConfig: any = {};
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
  }
} catch (e) {
  console.error("Error loading firebase-applet-config.json:", e);
}

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

console.log(`=== Firebase Admin Initialization START ===`);
console.log(`firebaseConfig.projectId: ${firebaseConfig.projectId}`);
console.log(`firebaseConfig.firestoreDatabaseId: "${firebaseConfig.firestoreDatabaseId}"`);

try {
  if (firebaseConfig.projectId) {
    if (!getApps().length) {
      const hasCredentials = (firebaseConfig.privateKey && firebaseConfig.clientEmail) || 
                            (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);
      
      if (hasCredentials) {
        console.log(`Using service account credentials`);
        initializeApp({
          credential: cert({
            projectId: firebaseConfig.projectId,
            clientEmail: firebaseConfig.clientEmail || process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (firebaseConfig.privateKey || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
          } as any),
          projectId: firebaseConfig.projectId,
        });
      } else {
        console.log("No service account found, using Application Default Credentials");
        initializeApp({
          projectId: firebaseConfig.projectId,
        });
      }
    } else {
      console.log(`Using existing Firebase app, apps.length: ${getApps().length}`);
    }
    
    if (getApps().length > 0) {
      // Only use non-empty firestoreDatabaseId
      const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== '' 
        ? firebaseConfig.firestoreDatabaseId.trim() 
        : undefined;
      console.log(`Initializing Firestore with dbId: "${dbId}" (undefined = use default)`);
      db = dbId 
        ? getFirestore(getApps()[0], dbId)
        : getFirestore(getApps()[0]);
      auth = getAuth(getApps()[0]);
      console.log(`=== Firebase Admin initialized successfully! db is available: ${!!db} ===`);
    } else {
      console.warn(`No Firebase apps available after initialization`);
    }
  } else {
    console.warn("No projectId found in firebase-applet-config.json. Firebase Admin not initialized.");
  }
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// --- HELPER FUNCTIONS ---

// Simple in-memory cache for user limits (60 second TTL)
const userLimitCache = new Map<string, { data: { allowed: boolean; remaining: number; isPremium: boolean }; expires: number }>();
const CACHE_TTL = 60000; // 60 seconds

// Check if user can send emails (freemium logic)
async function canSendEmail(userId: string): Promise<{ allowed: boolean; remaining: number; isPremium: boolean }> {
  if (!db) return { allowed: false, remaining: 0, isPremium: false };
  
  // Check cache first
  const cached = userLimitCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return { allowed: false, remaining: 0, isPremium: false };
    }
    
    const isPremium = userData.subscriptionStatus === 'premium';
    const emailsSent = userData.emailsSent || 0;
    const remaining = Math.max(0, FREE_EMAIL_LIMIT - emailsSent);
    
    let result: { allowed: boolean; remaining: number; isPremium: boolean };
    if (isPremium) {
      result = { allowed: true, remaining: -1, isPremium: true };
    } else {
      result = { allowed: emailsSent < FREE_EMAIL_LIMIT, remaining, isPremium: false };
    }
    
    // Cache the result
    userLimitCache.set(userId, { data: result, expires: Date.now() + CACHE_TTL });
    
    return result;
  } catch (error) {
    console.error("Error checking email limit:", error);
    return { allowed: false, remaining: 0, isPremium: false };
  }
}

// Increment email count for user
async function incrementEmailCount(userId: string): Promise<void> {
  if (!db) return;
  
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        emailsSent: FieldValue.increment(1)
      });
    } else {
      await userRef.set({
        emailsSent: 1,
        createdAt: FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error incrementing email count:", error);
  }
}

// Check if user can use premium features
async function canUsePremiumFeature(userId: string): Promise<boolean> {
  if (!db) return false;
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.subscriptionStatus === 'premium';
  } catch (error) {
    console.error("Error checking premium feature:", error);
    return false;
  }
}

// System templates - available globally
const SYSTEM_TEMPLATES = [
  // --- SEQUENCE 1: SaaS/Product Pitch ---
  { id: 's1-1', userId: 'system', category: 'Sales', name: 'SaaS: Initial Outreach', subject: 'Quick question about {{company}}\'s workflow', body: "Hi {{firstName}},\n\nI've been following {{company}} and noticed you're scaling your team. We help companies like yours automate their outreach and increase reply rates by 40%.\n\nDo you have 10 minutes next Tuesday to chat?\n\nBest,\n{{senderName}}" },
  { id: 's1-2', userId: 'system', category: 'Follow-up', name: 'SaaS: Follow-up 1 (The Bump)', subject: 'Re: Quick question about {{company}}\'s workflow', body: "Hi {{firstName}},\n\nBumping this to the top of your inbox in case it got buried.\n\nI'd love to show you how we can help {{company}} save 10+ hours a week on outreach.\n\nBest,\n{{senderName}}" },
  { id: 's1-3', userId: 'system', category: 'Follow-up', name: 'SaaS: Follow-up 2 (Value Add)', subject: 'Thought you might find this interesting', body: "Hi {{firstName}},\n\nI saw this case study on how a similar company in {{industry}} doubled their pipeline using AI outreach. Thought it might be relevant to what you're building at {{company}}.\n\nLink: [Case Study Link]\n\nBest,\n{{senderName}}" },
  { id: 's1-4', userId: 'system', category: 'Follow-up', name: 'SaaS: Follow-up 3 (The Idea)', subject: 'Idea for {{company}}\'s growth', body: "Hi {{firstName}},\n\nI have a specific idea on how {{company}} could leverage our new AI personalization feature to reach more leads without increasing headcount.\n\nWorth a quick 5-minute call?\n\nBest,\n{{senderName}}" },
  { id: 's1-5', userId: 'system', category: 'Follow-up', name: 'SaaS: Follow-up 4 (The Breakup)', subject: 'Permission to close your file?', body: "Hi {{firstName}},\n\nI haven't heard back from you, so I assume outreach automation isn't a priority for {{company}} right now. I'll close your file for now.\n\nFeel free to reach out if things change.\n\nBest,\n{{senderName}}" },

  // --- SEQUENCE 2: Agency/Service Pitch ---
  { id: 's2-1', userId: 'system', category: 'Sales', name: 'Agency: Initial Outreach', subject: 'Helping {{company}} with {{service}}', body: "Hi {{firstName}},\n\nI love what you're doing at {{company}}. We specialize in {{service}} for companies in the {{industry}} space.\n\nWe recently helped a client achieve [Result]. Would you be open to a quick chat about how we could do the same for you?\n\nBest,\n{{senderName}}" },
  { id: 's2-2', userId: 'system', category: 'Follow-up', name: 'Agency: Follow-up 1 (The Bump)', subject: 'Re: Helping {{company}} with {{service}}', body: "Hi {{firstName}},\n\nJust wanted to follow up on my previous email. I know you're busy, but I'd love to connect and see if we can help {{company}} scale.\n\nBest,\n{{senderName}}" },
  { id: 's2-3', userId: 'system', category: 'Follow-up', name: 'Agency: Follow-up 2 (Social Proof)', subject: 'How we helped {{competitor}}', body: "Hi {{firstName}},\n\nWe recently worked with {{competitor}} to improve their {{service}} results. They saw a [Percentage]% increase in [Metric] within 3 months.\n\nI'd love to share our process with you.\n\nBest,\n{{senderName}}" },
  { id: 's2-4', userId: 'system', category: 'Follow-up', name: 'Agency: Follow-up 3 (Free Audit)', subject: 'Free {{service}} audit for {{company}}', body: "Hi {{firstName}},\n\nI took a quick look at your current {{service}} setup and have a few ideas on how to improve it. I'd be happy to share a free audit with you.\n\nAre you interested?\n\nBest,\n{{senderName}}" },
  { id: 's2-5', userId: 'system', category: 'Follow-up', name: 'Agency: Follow-up 4 (The Breakup)', subject: 'Moving on for now', body: "Hi {{firstName}},\n\nI haven't heard back, so I'll stop reaching out for now. I'll keep an eye on {{company}}'s progress and wish you all the best.\n\nBest,\n{{senderName}}" },

  // --- SEQUENCE 3: Networking/Partnership ---
  { id: 's3-1', userId: 'system', category: 'Networking', name: 'Partnership: Initial Outreach', subject: 'Potential partnership between {{company}} and [My Company]', body: "Hi {{firstName}},\n\nI've been following {{company}} and I'm impressed with your work in {{industry}}. I think there's a great opportunity for us to collaborate.\n\nDo you have time for a brief intro call?\n\nBest,\n{{senderName}}" },
  { id: 's3-2', userId: 'system', category: 'Follow-up', name: 'Partnership: Follow-up 1 (The Bump)', subject: 'Re: Potential partnership', body: "Hi {{firstName}},\n\nJust checking in to see if you received my previous email about a potential partnership. I'd love to hear your thoughts.\n\nBest,\n{{senderName}}" },
  { id: 's3-3', userId: 'system', category: 'Follow-up', name: 'Partnership: Follow-up 2 (Specific Idea)', subject: 'A specific idea for our collaboration', body: "Hi {{firstName}},\n\nI was thinking about how our two companies could work together on [Specific Project/Idea]. I think it could be a win-win for both of us.\n\nWhat do you think?\n\nBest,\n{{senderName}}" },
  { id: 's3-4', userId: 'system', category: 'Follow-up', name: 'Partnership: Follow-up 3 (Mutual Benefit)', subject: 'How this partnership benefits {{company}}', body: "Hi {{firstName}},\n\nI wanted to highlight a few ways this partnership could specifically benefit {{company}}, including [Benefit 1] and [Benefit 2].\n\nWould you be open to a 10-minute chat?\n\nBest,\n{{senderName}}" },
  { id: 's3-5', userId: 'system', category: 'Follow-up', name: 'Partnership: Follow-up 4 (The Breakup)', subject: 'Staying in touch', body: "Hi {{firstName}},\n\nI'll stop reaching out about a partnership for now, but I'd love to stay in touch. Feel free to reach out if you ever want to connect.\n\nBest,\n{{senderName}}" },

  // --- SEQUENCE 4: Content/Webinar Promotion ---
  { id: 's4-1', userId: 'system', category: 'Marketing', name: 'Webinar: Initial Invite', subject: 'Invite: How to scale your outreach with AI', body: "Hi {{firstName}},\n\nWe're hosting a live webinar next Thursday on how to use AI to scale your outreach without losing the personal touch.\n\nRegister here: [Link]\n\nBest,\n{{senderName}}" },
  { id: 's4-2', userId: 'system', category: 'Follow-up', name: 'Webinar: Follow-up 1 (Reminder)', subject: 'Don\'t miss our AI outreach webinar', body: "Hi {{firstName}},\n\nJust a quick reminder about our webinar next week. We'll be sharing some exclusive tips and tricks.\n\nSave your spot: [Link]\n\nBest,\n{{senderName}}" },
  { id: 's4-3', userId: 'system', category: 'Follow-up', name: 'Webinar: Follow-up 2 (Speaker Highlight)', subject: 'Meet our guest speaker for the webinar', body: "Hi {{firstName}},\n\nWe're excited to have [Speaker Name] joining us for our webinar. They'll be sharing their experience with [Topic].\n\nRegister here: [Link]\n\nBest,\n{{senderName}}" },
  { id: 's4-4', userId: 'system', category: 'Follow-up', name: 'Webinar: Follow-up 3 (Last Chance)', subject: 'Last chance to register for our webinar', body: "Hi {{firstName}},\n\nOur webinar is tomorrow! This is your last chance to register and join the conversation.\n\nRegister now: [Link]\n\nBest,\n{{senderName}}" },
  { id: 's4-5', userId: 'system', category: 'Follow-up', name: 'Webinar: Follow-up 4 (Recording)', subject: 'In case you missed it: Webinar Recording', body: "Hi {{firstName}},\n\nSorry you couldn't make it to our webinar. Here's the recording so you can watch it at your convenience.\n\nWatch Recording: [Link]\n\nBest,\n{{senderName}}" },

  // --- SEQUENCE 5: Job/Career Outreach ---
  { id: 's5-1', userId: 'system', category: 'Work', name: 'Job: Initial Outreach', subject: 'Interested in the {{position}} role at {{company}}', body: "Hi {{firstName}},\n\nI'm writing to express my strong interest in the {{position}} role at {{company}}. I've been following your work and I'm impressed with [Specific Project/Achievement].\n\nI've attached my resume for your review.\n\nBest,\n{{senderName}}" },
  { id: 's5-2', userId: 'system', category: 'Follow-up', name: 'Job: Follow-up 1 (The Bump)', subject: 'Re: Interested in the {{position}} role', body: "Hi {{firstName}},\n\nJust wanted to follow up on my application for the {{position}} role. I'm still very interested and would love to chat.\n\nBest,\n{{senderName}}" },
  { id: 's5-3', userId: 'system', category: 'Follow-up', name: 'Job: Follow-up 2 (Portfolio Highlight)', subject: 'A few examples of my work relevant to {{company}}', body: "Hi {{firstName}},\n\nI wanted to share a few specific examples of my work that I think are particularly relevant to the challenges you're facing at {{company}}.\n\nPortfolio: [Link]\n\nBest,\n{{senderName}}" },
  { id: 's5-4', userId: 'system', category: 'Follow-up', name: 'Job: Follow-up 3 (Reference)', subject: 'A quick note from a former colleague', body: "Hi {{firstName}},\n\nI've attached a brief recommendation from a former colleague that speaks to my experience with [Skill]. I hope this is helpful.\n\nBest,\n{{senderName}}" },
  { id: 's5-5', userId: 'system', category: 'Follow-up', name: 'Job: Follow-up 4 (The Breakup)', subject: 'Thank you for your time', body: "Hi {{firstName}},\n\nI haven't heard back, so I'll assume you've moved forward with other candidates. Thank you for your time and consideration.\n\nBest,\n{{senderName}}" },

  // --- NEWSLETTER ---
  { id: 'n1', userId: 'system', category: 'Newsletter', name: 'Weekly Insights', subject: 'Weekly Insights: The State of AI Outreach', body: "Hi {{firstName}},\n\nHere's your weekly roundup of the best outreach strategies and AI news.\n\n1. [Article 1 Title]\n2. [Article 2 Title]\n3. [Article 3 Title]\n\nRead more: [Link]\n\nBest,\n{{senderName}}" },
  { id: 'n2', userId: 'system', category: 'Newsletter', name: 'Product Update', subject: 'Everything you missed in {{month}}', body: "Hi {{firstName}},\n\nIt's been a busy month at InboxAI. Here are the highlights and top content from our community.\n\n[Summary of events]\n\nCheck it out: [Link]\n\nBest,\n{{senderName}}" },
  { id: 'n3', userId: 'system', category: 'Newsletter', name: 'Curated Tools', subject: '5 Tools to boost your productivity', body: "Hi {{firstName}},\n\nThis week we're sharing our favorite tools for staying productive while scaling your business.\n\n[Tool 1]\n[Tool 2]\n[Tool 3]\n\nFull list: [Link]\n\nBest,\n{{senderName}}" },
  { id: 'n4', userId: 'system', category: 'Newsletter', name: 'Industry Trends', subject: 'The future of B2B sales is here', body: "Hi {{firstName}},\n\nA new report just dropped on the impact of AI in sales. Here's what you need to know.\n\n[Key takeaway 1]\n[Key takeaway 2]\n\nRead the full report: [Link]\n\nBest,\n{{senderName}}" },
  { id: 'n5', userId: 'system', category: 'Newsletter', name: 'Community Spotlight', subject: 'Meet the founder: {{name}}', body: "Hi {{firstName}},\n\nThis week we're highlighting {{name}}, who used InboxAI to build a $1M agency.\n\nRead the interview: [Link]\n\nBest,\n{{senderName}}" },

  // --- TRANSACTIONAL ---
  { id: 't1', userId: 'system', category: 'Transactional', name: 'Verification Code', subject: 'Your Verification Code: {{code}}', body: "Hi {{firstName}},\n\nYour verification code for InboxAI is: {{code}}\n\nThis code will expire in 10 minutes.\n\nBest,\nThe InboxAI Team" },
  { id: 't2', userId: 'system', category: 'Transactional', name: 'Invoice Receipt', subject: 'Invoice for your InboxAI Subscription', body: "Hi {{firstName}},\n\nThank you for your payment. Your invoice for the period of {{period}} is now available.\n\nDownload Invoice: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 't3', userId: 'system', category: 'Transactional', name: 'Order Confirmed', subject: 'Order Confirmed: {{orderNumber}}', body: "Hi {{firstName}},\n\nYour order has been confirmed. We're processing it now and will let you know when it's ready.\n\nOrder Details: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 't4', userId: 'system', category: 'Transactional', name: 'Password Reset', subject: 'Reset your InboxAI Password', body: "Hi {{firstName}},\n\nWe received a request to reset your password. Click the link below to set a new one.\n\nReset Password: [Link]\n\nIf you didn't request this, please ignore this email.\n\nBest,\nThe InboxAI Team" },
  { id: 't5', userId: 'system', category: 'Transactional', name: 'Security Alert', subject: 'Security Alert: New Login Detected', body: "Hi {{firstName}},\n\nA new login was detected on your InboxAI account from {{location}} using {{device}}.\n\nIf this was you, you can ignore this. If not, please change your password immediately.\n\nBest,\nThe InboxAI Team" },

  // --- SUPPORT ---
  { id: 'su1', userId: 'system', category: 'Support', name: 'Ticket Received', subject: 'We\'ve received your support request ({{ticketId}})', body: "Hi {{firstName}},\n\nThank you for reaching out. We've received your request regarding {{issue}} and our team is looking into it.\n\nWe'll get back to you within 24 hours.\n\nBest,\nThe InboxAI Support Team" },
  { id: 'su2', userId: 'system', category: 'Support', name: 'Ticket Resolved', subject: 'Your issue has been resolved ({{ticketId}})', body: "Hi {{firstName}},\n\nGood news! We've resolved the issue you reported regarding {{issue}}. Everything should be working correctly now.\n\nPlease let us know if you need anything else.\n\nBest,\nThe InboxAI Support Team" },
  { id: 'su3', userId: 'system', category: 'Support', name: 'Feedback Survey', subject: 'How did we do? ({{ticketId}})', body: "Hi {{firstName}},\n\nWe'd love to hear about your experience with our support team. Could you take 30 seconds to rate our service?\n\nRate here: [Link]\n\nBest,\nThe InboxAI Support Team" },
  { id: 'su4', userId: 'system', category: 'Support', name: 'Proactive Help', subject: 'Need help with {{feature}}?', body: "Hi {{firstName}},\n\nI noticed you've been using {{feature}} recently. Here are a few tips to help you get the most out of it.\n\n[Tip 1]\n[Tip 2]\n\nBest,\nThe InboxAI Support Team" },
  { id: 'su5', userId: 'system', category: 'Support', name: 'Service Interruption', subject: 'Scheduled Maintenance: {{date}}', body: "Hi {{firstName}},\n\nWe'll be performing scheduled maintenance on {{date}} from {{startTime}} to {{endTime}}. During this time, InboxAI may be temporarily unavailable.\n\nWe apologize for any inconvenience.\n\nBest,\nThe InboxAI Team" },

  // --- WELCOME ---
  { id: 'we1', userId: 'system', category: 'Welcome', name: 'Welcome Email', subject: 'Welcome to InboxAI, {{firstName}}!', body: "Hi {{firstName}},\n\nWe're thrilled to have you on board! InboxAI is here to help you scale your outreach and grow your business.\n\nGet started here: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'we2', userId: 'system', category: 'Welcome', name: 'Onboarding 1: Connect', subject: 'Step 1: Connect your Gmail account', body: "Hi {{firstName}},\n\nThe first step to success with InboxAI is connecting your Gmail account. This allows us to send personalized emails on your behalf.\n\nConnect now: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'we3', userId: 'system', category: 'Welcome', name: 'Onboarding 2: Upload', subject: 'Step 2: Upload your first lead list', body: "Hi {{firstName}},\n\nNow that your account is connected, it's time to upload your first list of leads. Our AI will start researching them immediately.\n\nUpload leads: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'we4', userId: 'system', category: 'Welcome', name: 'Onboarding 3: Launch', subject: 'Step 3: Send your first campaign', body: "Hi {{firstName}},\n\nYou're almost there! Your leads are researched and your templates are ready. It's time to launch your first campaign.\n\nLaunch campaign: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'we5', userId: 'system', category: 'Welcome', name: 'CEO Welcome', subject: 'A personal welcome from our CEO', body: "Hi {{firstName}},\n\nI'm the CEO of InboxAI, and I wanted to personally welcome you to our community. We're here to help you succeed.\n\nIf you have any questions, just reply to this email.\n\nBest,\n{{ceoName}}" },

  // --- NOTIFICATION ---
  { id: 'no1', userId: 'system', category: 'Notification', name: 'Campaign Started', subject: 'Your campaign "{{campaignName}}" has started', body: "Hi {{firstName}},\n\nGood news! Your outreach campaign \"{{campaignName}}\" is now live and sending emails.\n\nView Progress: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'no2', userId: 'system', category: 'Notification', name: 'New Reply', subject: 'New Reply from {{contactName}}!', body: "Hi {{firstName}},\n\nYou've received a new reply from {{contactName}} in your \"{{campaignName}}\" campaign.\n\nRead Reply: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'no3', userId: 'system', category: 'Notification', name: 'Credits Low', subject: 'Action Required: Your AI credits are low', body: "Hi {{firstName}},\n\nYou have less than 50 AI credits remaining. Top up now to ensure your campaigns keep running smoothly.\n\nTop Up: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'no4', userId: 'system', category: 'Notification', name: 'Weekly Report', subject: 'Your Weekly Performance Report', body: "Hi {{firstName}},\n\nHere's how your campaigns performed this week:\n\n- Emails Sent: {{sentCount}}\n- Open Rate: {{openRate}}%\n- Reply Rate: {{replyRate}}%\n\nFull Report: [Link]\n\nBest,\nThe InboxAI Team" },
  { id: 'no5', userId: 'system', category: 'Notification', name: 'Milestone Reached', subject: 'Congratulations! You\'ve sent 1,000 emails', body: "Hi {{firstName}},\n\nYou've just reached a major milestone: 1,000 AI-personalized emails sent with InboxAI!\n\nKeep up the great work.\n\nBest,\nThe InboxAI Team" },

  // --- NETWORKING ---
  { id: 'ne1', userId: 'system', category: 'Networking', name: 'Networking: Intro Request', subject: 'I\'d love to connect, {{firstName}}', body: "Hi {{firstName}},\n\nI've been following your work in {{industry}} and would love to connect and learn more about what you're building.\n\nAre you open to a quick virtual coffee?\n\nBest,\n{{senderName}}" },
  { id: 'ne2', userId: 'system', category: 'Networking', name: 'Collaboration Idea', subject: 'Collaboration idea for {{company}}', body: "Hi {{firstName}},\n\nI have an idea for a potential collaboration between our two companies that I think could be mutually beneficial.\n\nWorth a quick chat?\n\nBest,\n{{senderName}}" },
  { id: 'ne3', userId: 'system', category: 'Networking', name: 'Introduction', subject: 'Introduction: {{name1}} <> {{name2}}', body: "Hi {{firstName}},\n\nI'd like to introduce you to {{name2}}, who is doing some amazing work in {{field}}. I think you two would have a lot to talk about.\n\nI'll let you two take it from here!\n\nBest,\n{{senderName}}" },
  { id: 'ne4', userId: 'system', category: 'Networking', name: 'Event Follow-up', subject: 'Great meeting you at {{event}}!', body: "Hi {{firstName}},\n\nIt was great meeting you at {{event}} yesterday. I really enjoyed our conversation about {{topic}}.\n\nLet's stay in touch!\n\nBest,\n{{senderName}}" },
  { id: 'ne5', userId: 'system', category: 'Networking', name: 'Advice Request', subject: 'Quick question about your experience with {{topic}}', body: "Hi {{firstName}},\n\nI'm currently working on {{project}} and was hoping to get your expert advice on {{topic}}.\n\nDo you have 5 minutes to share your thoughts?\n\nBest,\n{{senderName}}" }
];

// Get template by ID - searches through SYSTEM_TEMPLATES and Firestore
async function getTemplateById(templateId: string): Promise<any> {
  console.log(`!!! getTemplateById called with: "${templateId}" !!!`);
  
  // Search through SYSTEM_TEMPLATES array first
  const systemTemplate = SYSTEM_TEMPLATES.find(t => t.id === templateId);
  if (systemTemplate) {
    console.log(`!!! Found SYSTEM template: ${systemTemplate.name} !!!`);
    return systemTemplate;
  }
  
  console.log(`!!! Template not found in SYSTEM_TEMPLATES, searching Firestore... !!!`);
  
  // If not found in system templates, try to find in Firestore (user-created templates)
  if (db) {
    try {
      console.log(`!!! db object exists, attempting Firestore lookup !!!`);
      
      // First try direct document lookup
      const templateDoc = await db.collection('templates').doc(templateId).get();
      console.log(`!!! Direct doc lookup result: exists=${templateDoc.exists}, id=${templateDoc.id} !!!`);
      
      if (templateDoc.exists) {
        const templateData = templateDoc.data();
        console.log(`!!! Found USER template in Firestore: ${templateData?.name} !!!`);
        return {
          id: templateDoc.id,
          name: templateData?.name || 'Custom Template',
          subject: templateData?.subject || '',
          body: templateData?.body || '',
          category: templateData?.category || 'Custom'
        };
      }
      
      // If direct lookup fails, try querying all templates and match by ID
      console.log(`!!! Direct lookup failed (doc doesn't exist), trying query for template ID: ${templateId} !!!`);
      const templatesSnapshot = await db.collection('templates').get();
      console.log(`!!! Query returned ${templatesSnapshot.size} templates !!!`);
      
      for (const doc of templatesSnapshot.docs) {
        console.log(`!!! Checking template doc: ${doc.id} (looking for ${templateId}) !!!`);
        if (doc.id === templateId) {
          const templateData = doc.data();
          console.log(`!!! Found USER template via query: ${templateData?.name} !!!`);
          return {
            id: doc.id,
            name: templateData?.name || 'Custom Template',
            subject: templateData?.subject || '',
            body: templateData?.body || '',
            category: templateData?.category || 'Custom'
          };
        }
      }
      
      console.log(`!!! User template not found in Firestore: "${templateId}" !!!`);
    } catch (error) {
      console.log(`!!! Error fetching user template: ${error} !!!`);
    }
  } else {
    console.log(`!!! WARNING: db is not initialized! Cannot search Firestore for user templates !!!`);
  }
  
  console.log(`!!! Template not found: "${templateId}" !!!`);
  return null;
}

// --- GOOGLE OAUTH CONFIG ---
const getOAuth2Client = (req?: express.Request) => {
  let redirectUri: string;
  
  const isLocal = req && (req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1'));
  
  if (isLocal) {
    redirectUri = "http://localhost:3000/api/auth/google/callback";
  } else if (process.env.APP_URL) {
    redirectUri = `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  } else {
    redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Gmail OAuth will not work.");
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  
  
];

// --- GEMINI CONFIG ---
let genAI: any;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will not work.");
      return null;
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// --- REPLY TRACKING ---
const AUTO_RESPONSE_KEYWORDS = [
  'out of office', 'out of the office', 'ooo', 'away', 'vacation',
  'auto reply', 'auto-response', 'automatic reply', 'received your email',
  'thank you for your email', 'acknowledgment', 'confirmed',
  'thank you for contacting', 'mail delivery failed', 'undelivered',
  'bounce', 'mailer-daemon', 'noreply', 'no-reply', 'donotreply', 'do not reply'
];

export async function checkForReplies() {
  if (!db) return;
  
  console.log("Reply Tracker: Checking for replies...");
  let totalRepliesFound = 0;
  let usersScanned = 0;
  let threadsChecked = 0;
  let errorsEncountered = 0;
  
  try {
    const usersSnapshot = await db.collection('users').where('googleTokens', '!=', null).get();
    
    console.log(`Reply Tracker: Found ${usersSnapshot.docs.length} users with Google tokens`);
    
    for (const userDoc of usersSnapshot.docs) {
      usersScanned++;
      const userData = userDoc.data();
      if (!userData.googleTokens) continue;
      
      console.log(`Reply Tracker: Processing user ${userDoc.id} - email: ${userData.email}`);
      
      const client = getOAuth2Client();
      client.setCredentials(userData.googleTokens);
      const gmail = google.gmail({ version: 'v1', auth: client });
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:sent',
        maxResults: 100
      });
      
      const messages = response.data.messages || [];
      console.log(`Reply Tracker: Found ${messages.length} sent messages to check`);
      
      for (const msg of messages) {
        try {
          threadsChecked++;
          const msgDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!
          });
          
          const threadId = msgDetail.data.threadId;
          if (threadId) {
            const thread = await gmail.users.threads.get({
              userId: 'me',
              id: threadId
            });
            
            if (thread.data.messages && thread.data.messages.length > 1) {
              const lastMsg = thread.data.messages[thread.data.messages.length - 1];
              const fromHeader = lastMsg.payload?.headers?.find(h => h.name === 'From');
              const subjectHeader = msgDetail.data.payload?.headers?.find(h => h.name === 'Subject');
              const toHeader = msgDetail.data.payload?.headers?.find(h => h.name === 'To');
              
              const fromEmailMatch = fromHeader?.value?.match(/<([^>]+)>/) || fromHeader?.value?.match(/^([^<]+)/);
              const fromEmail = fromEmailMatch ? fromEmailMatch[1].trim().toLowerCase() : '';
              
              if (!fromEmail || fromEmail === userData.email || !toHeader) continue;
              
              const replyEmail = fromHeader.value;
              const emailMatch = replyEmail.match(/<([^>]+)>/) || replyEmail.match(/^([^<]+)/);
              const replyToEmail = emailMatch ? emailMatch[1].trim().toLowerCase() : '';
              
              const subjectLower = (subjectHeader?.value || '').toLowerCase();
              const isAutoResponse = AUTO_RESPONSE_KEYWORDS.some(keyword => 
                subjectLower.includes(keyword) || 
                (fromHeader.value && fromHeader.value.toLowerCase().includes(keyword))
              );
              
              if (isAutoResponse) continue;
              
              const toEmailMatch = toHeader?.value?.match(/<([^>]+)>/) || toHeader?.value?.match(/^([^<]+)/);
              const originalRecipientEmail = toEmailMatch ? toEmailMatch[1].trim().toLowerCase() : '';
              
              console.log(`Reply Tracker: Thread ${threadId} has ${thread.data.messages.length} messages. Reply from: ${replyToEmail}, Original to: ${originalRecipientEmail}`);
              
              const campaignsSnapshot = await db.collection('campaigns').get();
              const normalizedReplySubject = (subjectHeader?.value || '').replace(/^Re:\s*/i, '').trim();
              
              for (const campaignDoc of campaignsSnapshot.docs) {
                const campaignData = campaignDoc.data();
                const campaignSubject = campaignData.subject || '';
                const normalizedCampaignSubject = campaignSubject.trim();
                
                console.log(`Reply Tracker: Checking campaign ${campaignDoc.id}: subject "${normalizedCampaignSubject}" vs reply subject "${normalizedReplySubject}"`);
                
                if (normalizedReplySubject.toLowerCase() === normalizedCampaignSubject.toLowerCase()) {
                  const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`)
                    .where('status', '==', 'sent')
                    .get();
                  
                  for (const contactDoc of contactsSnapshot.docs) {
                    const contact = contactDoc.data();
                    const contactEmail = contact.email?.toLowerCase().trim();
                    
                    if (contact.status === 'sent' && !contact.replied && 
                        contactEmail && originalRecipientEmail && 
                        (contactEmail === originalRecipientEmail || 
                         contactEmail.includes(originalRecipientEmail) || 
                         originalRecipientEmail.includes(contactEmail))) {
                      
                      await contactDoc.ref.update({
                        replied: true,
                        repliedAt: FieldValue.serverTimestamp()
                      });
                      console.log(`✓ Tracked reply for contact ${contact.email} in campaign ${campaignDoc.id}`);
                      totalRepliesFound++;
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (innerError: any) {
          console.error(`Reply Tracker: Error processing message ${msg.id}:`, innerError.message);
          errorsEncountered++;
        }
      }
    }
    console.log(`Reply Tracker: Finished - Users scanned: ${usersScanned}, Threads checked: ${threadsChecked}, Replies found: ${totalRepliesFound}, Errors: ${errorsEncountered}`);
  } catch (error: any) {
    // Handle quota exceeded errors gracefully
    if (error.code === 8 || (error.details && error.details.includes('Quota exceeded'))) {
      console.error("Reply tracking error: Firestore quota exceeded. Will retry on next interval.");
      // Set quota exceeded flag for user-facing messages
      (global as any).quotaExceeded = true;
      (global as any).quotaExceededAt = Date.now();
    } else {
      console.error("Reply tracking error:", error);
    }
  }
}

// --- AUTOMATION ENGINE ---
export async function processCampaigns() {
  if (!db) {
    console.log("Automation Engine: Firestore not initialized, skipping...");
    return;
  }
  
  console.log("Automation Engine: Checking for pending emails...");
  
  try {
    const campaignsSnapshot = await db.collection('campaigns')
      .where('status', '==', 'sending')
      .get();

    for (const campaignDoc of campaignsSnapshot.docs) {
      const campaign = campaignDoc.data();
      const { schedule, userId, templateId, enrichmentEnabled } = campaign;
      
      console.log(`=== Processing campaign: ${campaign.name} ===`);
      console.log(`Campaign data keys:`, Object.keys(campaign));
      console.log(`templateId value: "${templateId}" (type: ${typeof templateId})`);
      console.log(`Full campaign object:`, JSON.stringify({ name: campaign.name, templateId: campaign.templateId, status: campaign.status, template: campaign.template ? 'exists' : 'none' }));
      
      // Check email limit
      const limitCheck = await canSendEmail(userId);
      if (!limitCheck.allowed) {
        console.log(`User ${userId} reached free email limit. Pausing campaign ${campaign.name}`);
        await campaignDoc.ref.update({ 
          status: 'paused',
          pauseReason: 'free_limit_reached'
        });
        continue;
      }

      // Check schedule
      const forceRun = campaign.forceRun || false;
      if (!forceRun && schedule) {
        const now = new Date();
        const userTimezone = schedule.timezone || 'UTC';
        const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Parse start and end times (handle formats like "9:00" vs "09:00")
        const parseTime = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m; // Convert to minutes for comparison
        };
        
        const currentMinutes = currentHour * 60 + currentMinute;
        const startMinutes = parseTime(schedule.startTime);
        const endMinutes = parseTime(schedule.endTime);

        console.log(`Schedule check for '${campaign.name}': Current=${currentTimeStr} (${currentMinutes}min), Window=${schedule.startTime}-${schedule.endTime} (${startMinutes}-${endMinutes}min), Timezone=${userTimezone}`);

        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
          console.log(`⏰ Campaign '${campaign.name}' is outside its scheduled window (${currentTimeStr} not in ${schedule.startTime}-${schedule.endTime}). Skipping this run.`);
          continue;
        }
        console.log(`✅ Campaign '${campaign.name}' is within scheduled window. Processing...`);
      } else if (forceRun) {
        console.log(`⚡ Campaign '${campaign.name}' running in forced mode (forceRun=true)`);
      }

      // Get pending contacts
      const batchSize = schedule?.batchSize || 10;
      const contactSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`)
        .where('status', '==', 'pending')
        .limit(batchSize)
        .get();

      console.log(`=== DEBUG: Campaign '${campaign.name}' - Found ${contactSnapshot.size} pending contacts (batch size: ${batchSize}) ===`);
      
      if (contactSnapshot.empty) {
        console.log(`Campaign ${campaign.name} has no more pending contacts. Marking as completed.`);
        await campaignDoc.ref.update({ 
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        console.log(`✓ Campaign '${campaign.name}' marked as COMPLETED!`);
        continue;
      }

      for (const contactDoc of contactSnapshot.docs) {
        const contact = contactDoc.data();
        console.log(`=== DEBUG: Processing contact: ${contact.email}, current status: ${contact.status} ===`);
        
        // Get template FIRST - this is critical
        let template: any = null;
        let emailSubject = '';
        let emailBody = '';
        
        // Check if campaign has template data stored directly - use this FIRST before any other lookup
        if (campaign.template && typeof campaign.template === 'object') {
          console.log(`!!! Using inline template from campaign: ${campaign.template.name} !!!`);
          emailSubject = campaign.template.subject || '';
          emailBody = campaign.template.body || '';
          console.log(`Loaded inline template successfully`);
        } else {
        
        // Check if using AI-generated template
        const isAIGenerated = templateId === 'ai-generated';
        
        if (isAIGenerated) {
          console.log(`AI-generated campaign for ${contact.email}`);
          // Check if AI email already exists
          if (contact.aiGeneratedEmail) {
            emailSubject = contact.aiGeneratedEmail.subject || '';
            emailBody = contact.aiGeneratedEmail.body || '';
            console.log('Using existing AI-generated email');
          } else if (contact.personalization?.subject && contact.personalization?.body) {
            emailSubject = contact.personalization.subject;
            emailBody = contact.personalization.body;
            console.log('Using existing personalization');
          } else {
            // Generate AI email
            const ai = getGenAI();
            if (ai) {
              try {
                const response = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: `
                    Create a personalized cold outreach email.
                    
                    LEAD INFO:
                    Name: ${contact.firstName || ''} ${contact.lastName || ''}
                    Company: ${contact.company || ''}
                    Website: ${contact.website || ''}
                    
                    Create a compelling, personalized cold outreach email.
                    Make it sound human, not AI-generated.
                    Keep it concise (3-4 short paragraphs).
                    Include a clear call-to-action.
                    
                    Return as JSON: {"subject": "...", "body": "..."}
                  `,
                  config: { responseMimeType: "application/json" }
                });
                
                const personalized = JSON.parse(response.text || "{}");
                emailSubject = personalized.subject || 'Quick question';
                emailBody = personalized.body || `Hi ${contact.firstName || 'there'},\n\nI'd love to connect.\n\nBest regards`;
                
                // Store the generated email
                await contactDoc.ref.update({ 
                  aiGeneratedEmail: { subject: emailSubject, body: emailBody },
                  personalization: { subject: emailSubject, body: emailBody }
                });
              } catch (err) {
                console.error(`AI generation failed:`, err);
                emailSubject = 'Quick question';
                emailBody = `Hi ${contact.firstName || 'there'},\n\nI'd love to connect with you.\n\nBest regards`;
              }
            } else {
              emailSubject = 'Quick question';
              emailBody = `Hi ${contact.firstName || 'there'},\n\nI'd love to connect with you.\n\nBest regards`;
            }
          }
        } else {
          // Get template from database for non-AI campaigns
          console.log(`Template ID being used: "${templateId}"`);
          if (templateId && templateId !== 'ai-generated') {
            template = await getTemplateById(templateId);
            console.log(`Template search result:`, template ? `Found: ${template.name}` : 'NOT FOUND');
            if (template) {
              emailSubject = template.subject || '';
              emailBody = template.body || '';
              console.log(`Loaded template: ${template.name || templateId}`);
            } else {
              console.log(`Template "${templateId}" not found, using fallback`);
              // Try to find in system templates as last resort
              const systemTemplate = SYSTEM_TEMPLATES.find(t => t.id === templateId);
              if (systemTemplate) {
                emailSubject = systemTemplate.subject;
                emailBody = systemTemplate.body;
                console.log(`Found system template: ${systemTemplate.name}`);
              } else {
                emailSubject = 'Quick question about your company';
                emailBody = `Hi {{firstName}},\n\nI noticed what {{company}} is doing and thought I'd reach out.\n\nWould you be open to a quick chat?\n\nBest,\n{{senderName}}`;
              }
            }
          } else {
            // No template ID or AI-generated, use fallback
            console.log('No template ID found, using fallback');
            emailSubject = 'Quick question about your company';
            emailBody = `Hi {{firstName}},\n\nI noticed what {{company}} is doing and thought I'd reach out.\n\nWould you be open to a quick chat?\n\nBest,\n{{senderName}}`;
          }
          
          } // End else for inline template check
          
          // Only override with personalization if it exists AND is not the default/generic message
          // This ensures the selected template is used as the base
          const hasMeaningfulPersonalization = contact.personalization?.body && 
            contact.personalization.body.trim().length > 50 &&
            !contact.personalization.body.includes('I noticed what');
            
          if (hasMeaningfulPersonalization) {
            console.log('Using personalized email content');
            if (contact.personalization?.subject) {
              emailSubject = contact.personalization.subject;
            }
            emailBody = contact.personalization.body;
          } else {
            console.log('Using template (no meaningful personalization found)');
          }
        }
        
        // Replace placeholders with contact data from CSV
        emailSubject = emailSubject
          .replace(/\{\{firstName\}\}/g, contact.firstName || '')
          .replace(/\{\{lastName\}\}/g, contact.lastName || '')
          .replace(/\{\{company\}\}/g, contact.company || '')
          .replace(/\{\{name\}\}/g, contact.name || contact.firstName || '')
          .replace(/\{\{email\}\}/g, contact.email || '')
          .replace(/\{\{industry\}\}/g, contact.industry || '')
          .replace(/\{\{service\}\}/g, contact.service || '')
          .replace(/\{\{position\}\}/g, contact.position || '')
          .replace(/\{\{location\}\}/g, contact.location || '')
          .replace(/\{\{event\}\}/g, contact.event || '')
          .replace(/\{\{topic\}\}/g, contact.topic || '')
          .replace(/\{\{project\}\}/g, contact.project || '')
          .replace(/\{\{competitor\}\}/g, contact.competitor || '');
        
        emailBody = emailBody
          .replace(/\{\{firstName\}\}/g, contact.firstName || '')
          .replace(/\{\{lastName\}\}/g, contact.lastName || '')
          .replace(/\{\{company\}\}/g, contact.company || '')
          .replace(/\{\{name\}\}/g, contact.name || contact.firstName || '')
          .replace(/\{\{email\}\}/g, contact.email || '')
          .replace(/\{\{industry\}\}/g, contact.industry || '')
          .replace(/\{\{service\}\}/g, contact.service || '')
          .replace(/\{\{position\}\}/g, contact.position || '')
          .replace(/\{\{location\}\}/g, contact.location || '')
          .replace(/\{\{event\}\}/g, contact.event || '')
          .replace(/\{\{topic\}\}/g, contact.topic || '')
          .replace(/\{\{project\}\}/g, contact.project || '')
          .replace(/\{\{competitor\}\}/g, contact.competitor || '');
        
        // Get user data for sender info
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const senderName = userData?.displayName || userData?.smtpSettings?.fromName || userData?.name || 'Your Name';
        
        // DEBUG: Log user authentication method
        console.log(`=== DEBUG: Email sending auth check for user ${userId} ===`);
        console.log(`userData exists: ${!!userData}`);
        console.log(`userData.smtpSettings exists: ${!!userData?.smtpSettings}`);
        console.log(`userData.googleTokens exists: ${!!userData?.googleTokens}`);
        if (userData?.smtpSettings) {
          console.log(`SMTP host: ${userData.smtpSettings.host}:${userData.smtpSettings.port}`);
        }
        if (userData?.googleTokens) {
          console.log(`Google tokens: access_token exists = ${!!userData.googleTokens.access_token}`);
        }
        if (!userData?.smtpSettings && !userData?.googleTokens) {
          console.log(`⚠️ WARNING: User has NO email sending method configured! Neither SMTP nor Gmail connected.`);
        }
        
        emailBody = emailBody.replace(/\{\{senderName\}\}/g, senderName);
        
        // Add sender name if not present
        if (!emailBody.includes(senderName) && !emailBody.includes('{{senderName}}')) {
          emailBody = emailBody + '\n\n' + senderName;
        }
        
        // Add tracking pixel
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const trackingPixel = `<img src="${appUrl}/api/track/open?campaignId=${campaignDoc.id}&contactId=${contactDoc.id}" width="1" height="1" style="display:none" />`;
        const htmlBody = `<html><body><pre style="font-family: sans-serif;">${emailBody}</pre>${trackingPixel}</body></html>`;
        
        let sent = false;
        
        // Send email
        console.log(`=== DEBUG: Attempting to send email to ${contact.email} ===`);
        if (userData?.smtpSettings) {
          console.log(`Using SMTP to send`);
          try {
            const transporter = nodemailer.createTransport({
              host: userData.smtpSettings.host,
              port: userData.smtpSettings.port,
              secure: userData.smtpSettings.secure,
              auth: {
                user: userData.smtpSettings.user,
                pass: userData.smtpSettings.pass
              }
            });
            
            await transporter.sendMail({
              from: `"${userData.smtpSettings.fromName || senderName}" <${userData.smtpSettings.fromEmail}>`,
              to: contact.email,
              subject: emailSubject,
              text: emailBody,
              html: htmlBody
            });
            sent = true;
            console.log(`✓ SMTP email sent successfully!`);
          } catch (err) {
            console.error(`SMTP sending failed:`, err);
          }
        } else if (userData?.googleTokens) {
          console.log(`Using Gmail API to send`);
          try {
            const client = getOAuth2Client();
            client.setCredentials(userData.googleTokens);
            const gmail = google.gmail({ version: 'v1', auth: client });
            
            const utf8Subject = `=?utf-8?B?${Buffer.from(emailSubject).toString('base64')}?=`;
            const messageParts = [
              `From: ${userData.email}`,
              `To: ${contact.email}`,
              `Content-Type: text/html; charset=utf-8`,
              `MIME-Version: 1.0`,
              `Subject: ${utf8Subject}`,
              ``,
              htmlBody,
            ];
            const message = messageParts.join('\n');
            const encodedMessage = Buffer.from(message)
              .toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');
            
            await gmail.users.messages.send({
              userId: 'me',
              requestBody: { raw: encodedMessage }
            });
            sent = true;
            console.log(`✓ Gmail API email sent successfully!`);
          } catch (err) {
            console.error(`Gmail sending failed:`, err);
          }
        } else {
          console.log(`⚠️ Cannot send: No SMTP or Gmail credentials configured for this user`);
        }
        
        if (sent) {
          // CRITICAL: Increment email count for freemium tracking
          await incrementEmailCount(userId);
          
          // Update contact status
          await contactDoc.ref.update({
            status: 'sent',
            sentAt: FieldValue.serverTimestamp()
          });
          
          console.log(`✓ Email sent to ${contact.email} using ${templateId === 'ai-generated' ? 'AI-generated' : 'template'} content`);
        } else {
          console.error(`Failed to send email to ${contact.email}`);
        }
      }
      
      // After processing this batch, check if there are more pending contacts
      const remainingContacts = await db.collection(`campaigns/${campaignDoc.id}/contacts`)
        .where('status', '==', 'pending')
        .count()
        .get();
      const remainingCount = remainingContacts.data().count;
      
      if (remainingCount === 0) {
        console.log(`All emails sent! Marking campaign '${campaign.name}' as COMPLETED.`);
        await campaignDoc.ref.update({ 
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      }
    }
  } catch (error: any) {
    // Handle quota exceeded errors gracefully
    if (error.code === 8 || (error.details && error.details.includes('Quota exceeded'))) {
      console.error("Automation Engine Error: Firestore quota exceeded. Will retry on next interval.");
      // Set quota exceeded flag for user-facing messages
      (global as any).quotaExceeded = true;
      (global as any).quotaExceededAt = Date.now();
    } else {
      console.error("Automation Engine Error:", error);
    }
  }
}

// --- API ROUTES ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Quota status check - for user-facing messages
app.get("/api/quota-status", (req, res) => {
  const quotaExceeded = (global as any).quotaExceeded;
  const quotaExceededAt = (global as any).quotaExceededAt;
  
  // Clear quota flag after 1 hour
  if (quotaExceededAt && Date.now() - quotaExceededAt > 3600000) {
    (global as any).quotaExceeded = false;
    (global as any).quotaExceededAt = null;
    return res.json({ 
      quotaExceeded: false, 
      message: "",
      nextRetry: null
    });
  }
  
  // Calculate next retry time (every 5 minutes)
  const nextRetry = quotaExceededAt 
    ? new Date(quotaExceededAt + 300000).toISOString()
    : null;
  
  res.json({ 
    quotaExceeded: quotaExceeded || false, 
    message: quotaExceeded 
      ? "⚠️ Daily email limit reached. The automation will resume when your quota resets (typically at midnight UTC)." 
      : "",
    nextRetry: nextRetry,
    exceededAt: quotaExceededAt ? new Date(quotaExceededAt).toISOString() : null
  });
});

// Get user subscription status and email limits
app.get("/api/user/limit", async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const isPremium = userData.subscriptionStatus === 'premium';
    const emailsSent = userData.emailsSent || 0;
    const remaining = Math.max(0, FREE_EMAIL_LIMIT - emailsSent);
    
    // Check if quota is exceeded
    const quotaExceeded = (global as any).quotaExceeded;
    const quotaExceededAt = (global as any).quotaExceededAt;
    const quotaMessage = quotaExceeded 
      ? "⚠️ Daily email limit reached. The automation will resume when your quota resets (typically at midnight UTC)."
      : "";
    
    res.json({
      isPremium,
      emailsSent,
      freeLimit: FREE_EMAIL_LIMIT,
      remaining: isPremium ? -1 : remaining,
      canSendEmail: isPremium || emailsSent < FREE_EMAIL_LIMIT,
      quotaExceeded: quotaExceeded || false,
      quotaMessage: quotaMessage,
      nextRetry: quotaExceededAt ? new Date(quotaExceededAt + 300000).toISOString() : null
    });
  } catch (error: any) {
    console.error("Error getting user limit:", error);
    
    // Check if quota exceeded
    if (error.code === 8 || (error.message && error.message.includes('Quota exceeded'))) {
      return res.status(503).json({ 
        error: "Service temporarily unavailable",
        quotaExceeded: true,
        quotaMessage: "⚠️ Freemium limit reached! You've used your 100 free emails. Upgrade to Pro for unlimited emails.",
        canSendEmail: false
      });
    }
    
    res.status(500).json({ error: "Failed to get user limit" });
  }
});

// Admin endpoint to set user subscription status
app.post("/api/admin/set-subscription", async (req, res) => {
  const { userId, subscriptionStatus } = req.body;
  const adminKey = req.headers['x-admin-key'] as string;
  
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key') {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  if (!userId || !subscriptionStatus) {
    return res.status(400).json({ error: "userId and subscriptionStatus are required" });
  }
  
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    await db.collection('users').doc(userId).update({
      subscriptionStatus,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: `User subscription set to ${subscriptionStatus}` });
  } catch (error) {
    console.error("Error setting subscription:", error);
    res.status(500).json({ error: "Failed to set subscription" });
  }
});

// Google Auth URL
app.get("/api/auth/google/url", (req, res) => {
  const { userId, reconnect } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ 
      error: "Google OAuth credentials missing",
      message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables."
    });
  }
  
  const client = getOAuth2Client(req);
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: reconnect === "true" ? "consent select_account" : "consent",
    state: userId as string,
  });
  res.json({ url });
});

// Google Auth Callback
app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state: userId } = req.query;
  
  if (!code) {
    return res.status(400).send("Missing authorization code");
  }
  
  try {
    const client = getOAuth2Client(req);
    const { tokens } = await client.getToken(code as string);
    
    if (db && userId) {
      const userRef = db.collection('users').doc(userId as string);
      await userRef.set({
        googleTokens: tokens,
        gmailConnected: true,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful! You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed.");
  }
});

// Get all templates (for frontend)
app.get("/api/templates", async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const templatesSnapshot = await db.collection('templates').get();
    const templates = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Create template
app.post("/api/templates", async (req, res) => {
  const { name, subject, body, category, userId } = req.body;
  
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  if (!name || !subject || !body) {
    return res.status(400).json({ error: "Name, subject, and body are required" });
  }
  
  try {
    const templateRef = db.collection('templates').doc();
    await templateRef.set({
      name,
      subject,
      body,
      category: category || 'Custom',
      userId,
      createdAt: FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, id: templateRef.id });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Scraping & Enrichment Route
app.post("/api/enrich", async (req, res) => {
  const { website, linkedinUrl } = req.body;
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId || !(await canUsePremiumFeature(userId))) {
    return res.status(403).json({ 
      success: false, 
      error: 'Premium feature. Website and LinkedIn scraping requires a premium subscription.' 
    });
  }
  
  let enrichedData: any = {};
  
  try {
    if (website) {
      const response = await axios.get(website, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      
      // 1. Basic Meta Information
      enrichedData.meta = {
        title: $("title").text().trim(),
        description: $('meta[name="description"]').attr("content") || 
                     $('meta[property="og:description"]').attr("content") || "",
        keywords: $('meta[name="keywords"]').attr("content") || "",
        author: $('meta[name="author"]').attr("content") || ""
      };
      
      // 2. Open Graph / Social Media Tags
      enrichedData.social = {
        ogTitle: $('meta[property="og:title"]').attr("content") || "",
        ogDescription: $('meta[property="og:description"]').attr("content") || "",
        ogImage: $('meta[property="og:image"]').attr("content") || "",
        ogUrl: $('meta[property="og:url"]').attr("content") || "",
        twitterCard: $('meta[name="twitter:card"]').attr("content") || ""
      };
      
      // 3. Main Heading Tags
      enrichedData.headings = {
        h1: $("h1").map((i, el) => $(el).text().trim()).get(),
        h2: $("h2").map((i, el) => $(el).text().trim()).get().slice(0, 10),
        h3: $("h3").map((i, el) => $(el).text().trim()).get().slice(0, 10)
      };
      
      // 4. Extract Contact Information
      const pageText = $("body").text();
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
      
      enrichedData.contact = {
        emails: [...new Set(pageText.match(emailRegex) || [])].slice(0, 5),
        phones: [...new Set(pageText.match(phoneRegex) || [])].filter(p => p.length > 7).slice(0, 5)
      };
      
      // 5. Social Media Links
      enrichedData.socialLinks = {
        facebook: $("a[href*='facebook.com'], a[href*='fb.com']").map((i, el) => $(el).attr("href")).get().slice(0, 3),
        twitter: $("a[href*='twitter.com'], a[href*='x.com']").map((i, el) => $(el).attr("href")).get().slice(0, 3),
        linkedin: $("a[href*='linkedin.com']").map((i, el) => $(el).attr("href")).get().slice(0, 3),
        instagram: $("a[href*='instagram.com']").map((i, el) => $(el).attr("href")).get().slice(0, 3),
        youtube: $("a[href*='youtube.com']").map((i, el) => $(el).attr("href")).get().slice(0, 3)
      };
      
      // 6. Navigation & About Page Links
      enrichedData.navigation = $("nav a, .nav a, .menu a, header a").map((i, el) => $(el).text().trim()).get().slice(0, 20);
      
      // 7. Main Content Extraction - find what the company does
      const mainContent: string[] = [];
      
      // Hero sections
      $(".hero, .hero-section, .hero-content, [class*='hero']").each((i, el) => {
        mainContent.push($(el).text().trim().substring(0, 500));
      });
      
      // About sections
      $("[class*='about'], #about, [id*='about']").each((i, el) => {
        mainContent.push($(el).text().trim().substring(0, 500));
      });
      
      // Services/Products sections
      $("[class*='service'], [class*='product'], #services, #products, [class*='features']").each((i, el) => {
        mainContent.push($(el).text().trim().substring(0, 500));
      });
      
      enrichedData.mainContent = mainContent.filter(c => c.length > 20).slice(0, 5);
      
      // 8. Extract pricing information if available
      const priceElements: string[] = [];
      $("[class*='price'], [class*='pricing'], .price-tag, [class*='cost']").each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length < 50) {
          priceElements.push(text);
        }
      });
      enrichedData.pricing = priceElements.slice(0, 10);
      
      // 9. Company tagline/slogan
      enrichedData.tagline = $("[class*='tagline'], .subtitle, .lead-text, [class*='hero'] p").first().text().trim().substring(0, 200);
      
      // 10. Raw HTML snippet for AI to parse (optional - for advanced parsing)
      enrichedData.rawHtml = $("body").html()?.substring(0, 5000) || "";
      
      // 11. Structured snippet - key sentences about the company
      const paragraphs = $("p").map((i, el) => $(el).text().trim()).get().filter(p => p.length > 50 && p.length < 500);
      enrichedData.snippets = paragraphs.slice(0, 10);
      
      // 12. Industry/Category detection from meta tags and content
      enrichedData.industry = $('meta[name="keywords"]').attr("content")?.split(",").slice(0, 5) || [];
      
      // 13. Location information
      enrichedData.location = {
        address: $("[class*='address'], [itemprop='address']").map((i, el) => $(el).text().trim()).get().slice(0, 3),
        city: $("[class*='city'], [itemprop='addressLocality']").map((i, el) => $(el).text().trim()).get().slice(0, 3),
        country: $("[class*='country'], [itemprop='addressCountry']").map((i, el) => $(el).text().trim()).get().slice(0, 3)
      };
      
      // 14. Store the source URL
      enrichedData.sourceUrl = website;
      enrichedData.scrapedAt = new Date().toISOString();
    }
    
    if (linkedinUrl) {
      // Comprehensive Google-based person research
      // Scrapes ALL available information about a person from Google
      const apiKey = process.env.OUTSCRAPER_API_KEY;
      
      if (!apiKey) {
        enrichedData.linkedin = {
          url: linkedinUrl,
          error: "Outscraper API key not configured. Set OUTSCRAPER_API_KEY in environment.",
          suggestion: "Get an API key from https://outscraper.com/",
          scrapedAt: new Date().toISOString()
        };
      } else {
        try {
          // Extract name from LinkedIn URL or use search term
          let personName = linkedinUrl;
          let companyName = '';
          
          // Try to extract company from LinkedIn URL
          if (linkedinUrl.includes('/company/')) {
            const companyMatch = linkedinUrl.match(/\.com\/company\/([^/?]+)/);
            if (companyMatch) {
              companyName = decodeURIComponent(companyMatch[1].replace(/-/g, ' '));
            }
            personName = companyName;
          } else {
            // For profiles, try to extract name or use as-is
            const profileMatch = linkedinUrl.match(/\.com\/in\/([^/?]+)/);
            if (profileMatch) {
              const handle = decodeURIComponent(profileMatch[1].replace(/-/g, ' '));
              personName = handle;
            }
          }
          
          // Multiple search queries to get comprehensive data
          const searchQueries = [
            personName,  // Basic name search
            `${personName} LinkedIn`,
            `${personName} profile`,
            `${personName} ${companyName}`.trim(),
            `${personName} founder`,
            `${personName} CEO`,
            `${personName} author`,
            `${personName} speaker`
          ].filter(q => q.length > 2);
          
          // Execute searches for person data
          const searchResults: any = {};
          
          // Main profile search
          const mainSearch = await axios.get(
            `https://api.outscraper.cloud/google-search`,
            {
              params: {
                query: [personName],
                async: false,
                fields: 'query,organic_results.link,organic_results.title,organic_results.description,organic_results.snippet'
              },
              headers: { 'X-API-KEY': apiKey },
              timeout: 30000
            }
          );
          
          const mainData = mainSearch.data?.data?.[0] || {};
          searchResults.main = mainData.organic_results || [];
          
          // LinkedIn specific search
          const linkedinSearch = await axios.get(
            `https://api.outscraper.cloud/google-search`,
            {
              params: {
                query: [`${personName} LinkedIn`],
                async: false,
                fields: 'query,organic_results.link,organic_results.title,organic_results.description'
              },
              headers: { 'X-API-KEY': apiKey },
              timeout: 30000
            }
          );
          
          const linkedinData = linkedinSearch.data?.data?.[0] || {};
          searchResults.linkedin = linkedinData.organic_results || [];
          
          // Social media search (Twitter, Facebook, Instagram)
          const socialSearch = await axios.get(
            `https://api.outscraper.cloud/google-search`,
            {
              params: {
                query: [`${personName} Twitter`, `${personName} Facebook`, `${personName} Instagram`],
                async: false,
                fields: 'query,organic_results.link,organic_results.title,organic_results.description'
              },
              headers: { 'X-API-KEY': apiKey },
              timeout: 30000
            }
          );
          
          const socialData = socialSearch.data?.data || [];
          searchResults.social = socialData.flatMap((d: any) => d.organic_results || []);
          
          // News and articles search
          const newsSearch = await axios.get(
            `https://api.outscraper.cloud/google-search`,
            {
              params: {
                query: [`${personName} news`, `${personName} article`, `${personName} blog`],
                tbs: 'qdr:w',  // Past week
                async: false,
                fields: 'query,organic_results.link,organic_results.title,organic_results.description,organic_results.date'
              },
              headers: { 'X-API-KEY': apiKey },
              timeout: 30000
            }
          );
          
          const newsData = newsSearch.data?.data || [];
          searchResults.news = newsData.flatMap((d: any) => d.organic_results || []);
          
          // Company/Professional info search
          const companySearch = await axios.get(
            `https://api.outscraper.cloud/google-search`,
            {
              params: {
                query: [`${personName} CEO`, `${personName} founder`, `${personName} director`],
                async: false,
                fields: 'query,organic_results.link,organic_results.title,organic_results.description'
              },
              headers: { 'X-API-KEY': apiKey },
              timeout: 30000
            }
          );
          
          const companyData = companySearch.data?.data || [];
          searchResults.professional = companyData.flatMap((d: any) => d.organic_results || []);
          
          // Process and categorize all results
          const categorizeResults = (results: any[]) => {
            return results.map((r: any) => ({
              title: r.title || '',
              description: r.description || r.snippet || '',
              link: r.link || '',
              date: r.date || null
            })).slice(0, 15);
          };
          
          // Find specific profiles
          const findProfile = (results: any[], pattern: string) => {
            const found = results.find((r: any) => r.link?.includes(pattern));
            return found ? {
              title: found.title,
              description: found.description,
              link: found.link
            } : null;
          };
          
          const allResults = [
            ...(searchResults.main || []),
            ...(searchResults.linkedin || []),
            ...(searchResults.social || [])
          ];
          
          // Build comprehensive person profile
          enrichedData.linkedin = {
            url: linkedinUrl,
            searchQuery: personName,
            
            // All search results categorized
            allResults: {
              profile: categorizeResults(searchResults.main),
              linkedinProfiles: categorizeResults(searchResults.linkedin),
              socialMedia: categorizeResults(searchResults.social),
              news: categorizeResults(searchResults.news),
              professional: categorizeResults(searchResults.professional)
            },
            
            // Specific profile links found
            profiles: {
              linkedin: findProfile(allResults, 'linkedin.com'),
              twitter: findProfile(allResults, 'twitter.com') || findProfile(allResults, 'x.com'),
              facebook: findProfile(allResults, 'facebook.com'),
              instagram: findProfile(allResults, 'instagram.com'),
              youtube: findProfile(allResults, 'youtube.com'),
              medium: findProfile(allResults, 'medium.com'),
              github: findProfile(allResults, 'github.com'),
              crunchbase: findProfile(allResults, 'crunchbase.com')
            },
            
            // Recent news about this person
            recentNews: categorizeResults(searchResults.news).slice(0, 5),
            
            // Company info if found
            companyInfo: companyName ? {
              name: companyName,
              searchResults: categorizeResults(searchResults.professional)
            } : null,
            
            // Stats
            stats: {
              totalResults: allResults.length,
              linkedInFound: !!findProfile(allResults, 'linkedin.com'),
              twitterFound: !!(findProfile(allResults, 'twitter.com') || findProfile(allResults, 'x.com')),
              newsArticles: searchResults.news?.length || 0
            },
            
            scrapedAt: new Date().toISOString()
          };
          
        } catch (liError: any) {
          console.error("Person research error:", liError.message);
          enrichedData.linkedin = {
            url: linkedinUrl,
            error: liError.message || "Failed to research person",
            scrapedAt: new Date().toISOString()
          };
        }
      }
    }
    
    res.json({ success: true, data: enrichedData });
  } catch (error) {
    console.error("Enrichment error:", error);
    res.status(500).json({ success: false, error: "Failed to enrich lead data" });
  }
});

// AI Personalization Route
app.post("/api/personalize", async (req, res) => {
  const { lead, template, enrichment } = req.body;
  
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({ success: false, error: "AI service not configured" });
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are an expert sales copywriter. Write a highly personalized email for the following lead.
        
        Lead Name: ${lead.firstName} ${lead.lastName}
        Company: ${lead.company}
        Template Subject: ${template.subject}
        Template Body: ${template.body}
        
        Enriched Data: ${JSON.stringify(enrichment)}
        
        Instructions:
        1. Use the enriched data to make the email feel personal and researched.
        2. Mention something specific from their website or LinkedIn if available.
        3. Keep the tone professional but conversational.
        4. Output only the final Subject and Body in JSON format.
      `,
      config: { responseMimeType: "application/json" }
    });
    
    const personalized = JSON.parse(response.text || "{}");
    res.json({ success: true, personalized });
  } catch (error) {
    console.error("Personalization error:", error);
    res.status(500).json({ success: false, error: "Failed to generate personalized email" });
  }
});

// Generate Email Route
app.post("/api/generate-email", async (req, res) => {
  const { firstName, company, websiteData, type, followUpNumber, previousSubject, previousBody, daysAfter } = req.body;
  
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({ error: "AI service not configured" });
    }
    
    let prompt = '';
    
    if (type === 'followup') {
      const followUpNumberText = ['First', 'Second', 'Third', 'Fourth', 'Fifth'][followUpNumber - 1] || 'Follow-up';
      
      prompt = `
        Write a ${followUpNumberText} follow-up email.
        
        Recipient: ${firstName}
        Company: ${company}
        Previous subject: ${previousSubject}
        Previous body: ${previousBody}
        Days after: ${daysAfter}
        
        Make it short (2-3 sentences) and compelling.
        Return as JSON: {"subject": "...", "body": "..."}
      `;
    } else {
      prompt = `
        Write a short cold outreach email.
        
        Recipient: ${firstName}
        Company: ${company}
        Website info: ${JSON.stringify(websiteData)}
        
        Keep it short (3-4 sentences).
        Return as JSON: {"subject": "...", "body": "..."}
      `;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("Generate email error:", error);
    res.status(500).json({ error: "Failed to generate email" });
  }
});

// SMTP Test Route
app.post("/api/auth/smtp/test", async (req, res) => {
  const { host, port, secure, user, pass, fromEmail } = req.body;
  
  if (!host || !port || !user || !pass || !fromEmail) {
    return res.status(400).json({ success: false, error: "Missing SMTP configuration fields" });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: secure === true || port === 465,
      auth: { user, pass },
    } as any);
    
    await transporter.verify();
    res.json({ success: true, message: "SMTP connection successful" });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to connect to SMTP server" 
    });
  }
});

// Email Open Tracking Endpoint
app.get("/api/track/open", async (req, res) => {
  const { campaignId, contactId } = req.query;
  
  if (db && campaignId && contactId) {
    try {
      const contactRef = db.doc(`campaigns/${campaignId}/contacts/${contactId}`);
      await contactRef.update({
        opened: true,
        openedAt: FieldValue.serverTimestamp()
      });
      console.log(`Tracked open for contact ${contactId}`);
    } catch (error) {
      console.error("Error tracking open:", error);
    }
  }
  
  // Return 1x1 transparent pixel
  res.set('Content-Type', 'image/gif');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

// Start Campaign
app.post("/api/campaigns/:campaignId/start", async (req, res) => {
  const { campaignId } = req.params;
  const { userId } = req.body;
  
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const campaignRef = db.doc(`campaigns/${campaignId}`);
    await campaignRef.update({
      status: 'sending',
      forceRun: true,
      startedAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true, message: "Campaign started!" });
  } catch (error) {
    console.error("Start campaign error:", error);
    res.status(500).json({ error: "Failed to start campaign" });
  }
});

// Stop/Pause Campaign
app.post("/api/campaigns/:campaignId/stop", async (req, res) => {
  const { campaignId } = req.params;
  
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const campaignRef = db.doc(`campaigns/${campaignId}`);
    await campaignRef.update({
      status: 'paused',
      forceRun: false,
      stoppedAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true, message: "Campaign paused!" });
  } catch (error) {
    console.error("Stop campaign error:", error);
    res.status(500).json({ error: "Failed to stop campaign" });
  }
});

// Complete Campaign
app.post("/api/campaigns/:campaignId/complete", async (req, res) => {
  const { campaignId } = req.params;
  
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const campaignRef = db.doc(`campaigns/${campaignId}`);
    await campaignRef.update({
      status: 'completed',
      forceRun: false,
      completedAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true, message: "Campaign completed!" });
  } catch (error) {
    console.error("Complete campaign error:", error);
    res.status(500).json({ error: "Failed to complete campaign" });
  }
});

// Reset reply tracking
app.post("/api/admin/reset-replies", async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const campaignsSnapshot = await db.collection('campaigns').get();
    let totalReset = 0;
    
    for (const campaignDoc of campaignsSnapshot.docs) {
      const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`).get();
      
      for (const contactDoc of contactsSnapshot.docs) {
        const contact = contactDoc.data();
        if (contact.replied === true) {
          await contactDoc.ref.update({
            replied: false,
            repliedAt: FieldValue.delete()
          });
          totalReset++;
        }
      }
    }
    
    res.json({ success: true, message: `Reset ${totalReset} contacts` });
  } catch (error) {
    console.error("Error resetting replies:", error);
    res.status(500).json({ error: "Failed to reset replies" });
  }
});

// Reset open tracking
app.post("/api/admin/reset-opens", async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  
  try {
    const campaignsSnapshot = await db.collection('campaigns').get();
    let totalReset = 0;
    
    for (const campaignDoc of campaignsSnapshot.docs) {
      const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`).get();
      
      for (const contactDoc of contactsSnapshot.docs) {
        const contact = contactDoc.data();
        if (contact.opened === true) {
          await contactDoc.ref.update({
            opened: false,
            openedAt: FieldValue.delete()
          });
          totalReset++;
        }
      }
    }
    
    res.json({ success: true, message: `Reset ${totalReset} contacts` });
  } catch (error) {
    console.error("Error resetting opens:", error);
    res.status(500).json({ error: "Failed to reset opens" });
  }
});

// Get user stats
app.get("/api/user/stats", async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId || !db) {
    return res.status(400).json({ error: "userId required or DB not initialized" });
  }
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const emailsSent = userData?.emailsSent || 0;
    const isPremium = userData?.subscriptionStatus === 'premium';
    
    // Get campaign stats
    const campaignsSnapshot = await db.collection('campaigns')
      .where('userId', '==', userId)
      .get();
    
    let totalSent = 0;
    let totalOpened = 0;
    let totalReplied = 0;
    
    for (const campaignDoc of campaignsSnapshot.docs) {
      const contactsSnapshot = await db.collection(`campaigns/${campaignDoc.id}/contacts`).get();
      
      for (const contactDoc of contactsSnapshot.docs) {
        const contact = contactDoc.data();
        if (contact.status === 'sent') totalSent++;
        if (contact.opened) totalOpened++;
        if (contact.replied) totalReplied++;
      }
    }
    
    res.json({
      emailsSent,
      freeLimit: FREE_EMAIL_LIMIT,
      remaining: isPremium ? -1 : Math.max(0, FREE_EMAIL_LIMIT - emailsSent),
      isPremium,
      campaignStats: {
        totalSent,
        totalOpened,
        totalReplied,
        openRate: totalSent > 0 ? (totalOpened / totalSent * 100).toFixed(1) : 0,
        replyRate: totalSent > 0 ? (totalReplied / totalSent * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ error: "Failed to get user stats" });
  }
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  console.log("Starting server...");
  
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized.");
    } else {
      const distPath = path.join(process.cwd(), "dist");
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }
    }
    
    // Start automation engine (reduced frequency to save Firestore quota)
    setInterval(processCampaigns, 300000); // Every 5 minutes for sending emails
    setInterval(checkForReplies, 3600000);  // Every 1 hour for reply tracking
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Freemium limit: ${FREE_EMAIL_LIMIT} free emails per user`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();