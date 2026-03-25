// Simple test endpoint to debug Vercel routing
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  console.log('Test endpoint hit:', req.method, req.url);
  
  return res.status(200).json({ 
    success: true, 
    message: 'API is working',
    path: req.url,
    method: req.method
  });
}