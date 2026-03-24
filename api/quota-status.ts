import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

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
try {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
} catch (error) {
  // Firebase may already be initialized
  console.log("Firebase app initialization:", error instanceof Error ? error.message : "Already initialized");
}

// Quota status check - for user-facing messages
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

  try {
    const quotaExceeded = (global as any).quotaExceeded;
    const quotaExceededAt = (global as any).quotaExceededAt;

    // Clear quota flag after 1 hour
    if (quotaExceededAt && Date.now() - quotaExceededAt > 3600000) {
      (global as any).quotaExceeded = false;
      (global as any).quotaExceededAt = null;
      res.json({
        quotaExceeded: false,
        message: "",
        nextRetry: null,
      });
      return;
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
      exceededAt: quotaExceededAt ? new Date(quotaExceededAt).toISOString() : null,
    });
  } catch (error) {
    console.error("Error in quota-status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
