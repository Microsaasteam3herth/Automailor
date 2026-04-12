import { processCampaigns } from '../../server';

// Cron job for sending emails - can be triggered on a schedule
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    console.log("Cron job: Email sending triggered");
    await processCampaigns();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email processing completed successfully' 
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process emails' 
    });
  }
}