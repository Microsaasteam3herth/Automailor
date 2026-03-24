import { google } from "googleapis";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth.userinfo.email",
  "https://www.googleapis.com/auth.userinfo.profile",
];

function getOAuth2Client() {
  let redirectUri: string;
  
  // For serverless environment, always use production redirect
  if (process.env.APP_URL) {
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
}

// Google Auth URL endpoint
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

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { userId, reconnect } = req.query;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      res.status(500).json({ 
        error: "Google OAuth credentials missing",
        message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables."
      });
      return;
    }
    
    const client = getOAuth2Client();
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: reconnect === "true" ? "consent select_account" : "consent",
      state: userId as string,
    });
    res.json({ url });
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: "Failed to generate auth URL", message: error.message });
  }
}
