import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Firebase Admin Setup
const serviceAccount = {
  type: "service_account",
  project_id: "inboxai-ecb3a",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: "106590958217622410419",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40inboxai-ecb3a.iam.gserviceaccount.com",
};

let db: FirebaseFirestore.Firestore;

try {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
  db = getFirestore();
} catch (error) {
  console.log("Firebase app initialization:", error instanceof Error ? error.message : "Already initialized");
  db = getFirestore();
}

// Get OAuth2 client
function getOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "https://automailor.vercel.app/api/auth/google/callback"
  );
}

// Auto-response keywords to exclude
const AUTO_RESPONSE_KEYWORDS = [
  'auto response', 'automated response', 'out of office', 'out of the office',
  'away until', 'on vacation', 'will be out', 'currently away',
  'auto-reply', 'auto reply', 'mailer-daemon', 'noreply', 'no-reply',
  'unsubscribe', 'bounced', 'undelivered', 'delivery status',
  'postmaster', ' mailing-list', 'list-manager'
];

// Manual reply check endpoint - can be triggered on demand
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  console.log("Manual reply check triggered via API!");

  try {
    const usersSnapshot = await db.collection('users').where('googleTokens', '!=', null).get();
    
    console.log(`Found ${usersSnapshot.docs.length} users with Google tokens`);
    
    let totalRepliesFound = 0;
    let usersScanned = 0;

    for (const userDoc of usersSnapshot.docs) {
      usersScanned++;
      const userData = userDoc.data();
      if (!userData.googleTokens) continue;
      
      console.log(`Processing user ${userDoc.id} - email: ${userData.email}`);
      
      const client = getOAuth2Client();
      client.setCredentials(userData.googleTokens);
      const gmail = google.gmail({ version: 'v1', auth: client });
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:sent',
        maxResults: 100
      });
      
      const messages = response.data.messages || [];
      console.log(`Found ${messages.length} sent messages to check`);
      
      for (const msg of messages) {
        try {
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
              
              console.log(`Thread ${threadId} - Reply from: ${replyToEmail}, Original to: ${originalRecipientEmail}`);
              
              const campaignsSnapshot = await db.collection('campaigns').get();
              const normalizedReplySubject = (subjectHeader?.value || '').replace(/^Re:\s*/i, '').trim();
              
              for (const campaignDoc of campaignsSnapshot.docs) {
                const campaignData = campaignDoc.data();
                const campaignSubject = campaignData.subject || '';
                const normalizedCampaignSubject = campaignSubject.trim();
                
                console.log(`Checking campaign ${campaignDoc.id}: "${normalizedCampaignSubject}" vs "${normalizedReplySubject}"`);
                
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
                        repliedAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                      console.log(`✓ TRACKED REPLY for contact ${contact.email} in campaign ${campaignDoc.id}`);
                      totalRepliesFound++;
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (innerError: any) {
          console.error(`Error processing message ${msg.id}:`, innerError.message);
        }
      }
    }

    console.log(`=== REPLY CHECK COMPLETE ===`);
    console.log(`Users scanned: ${usersScanned}`);
    console.log(`Replies found: ${totalRepliesFound}`);
    
    return res.status(200).json({ 
      success: true, 
      usersScanned,
      repliesFound: totalRepliesFound,
      message: `Scanned ${usersScanned} users, found ${totalRepliesFound} replies`
    });

  } catch (error: any) {
    console.error("Reply check error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to check replies' 
    });
  }
}