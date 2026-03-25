import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin Setup - using type assertion to allow object credentials
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

// Initialize Firebase (with error handling for Vercel environment)
let db: FirebaseFirestore.Firestore;

try {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
  db = getFirestore();
} catch (error) {
  // Firebase may already be initialized
  console.log("Firebase app initialization:", error instanceof Error ? error.message : "Already initialized");
  db = getFirestore();
}

// Campaign start/stop handler
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, action } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    if (action !== 'start' && action !== 'stop') {
      return res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }

    // Get the campaign
    const campaignRef = db.collection('campaigns').doc(id);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();
    
    if (action === 'start') {
      // Check if already sending
      if (campaignData?.status === 'sending') {
        return res.status(400).json({ error: 'Campaign is already sending' });
      }
      
      // Update to sending status
      await campaignRef.update({
        status: 'sending',
        startedAt: new Date()
      });
      
    } else if (action === 'stop') {
      // Check if not currently sending
      if (campaignData?.status !== 'sending') {
        return res.status(400).json({ error: 'Campaign is not currently sending' });
      }
      
      // Update to paused status
      await campaignRef.update({
        status: 'paused',
        stoppedAt: new Date()
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Campaign ${action === 'start' ? 'started' : 'stopped'} successfully` 
    });

  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ error: error.message || 'Failed to update campaign' });
  }
}