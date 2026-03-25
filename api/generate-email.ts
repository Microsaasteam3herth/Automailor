// Email generation endpoint - uses AI to generate personalized email content

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      template, 
      contactName, 
      companyName, 
      customFields, 
      tone = 'professional',
      generateSubject = true 
    } = req.body;

    if (!template) {
      return res.status(400).json({ error: 'Template is required' });
    }

    if (!contactName) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    // Build the prompt for AI generation
    let prompt = `Generate a ${tone} email based on this template:\n\n${template}`;
    
    if (companyName) {
      prompt += `\n\nRecipient's company: ${companyName}`;
    }
    
    if (customFields) {
      Object.entries(customFields).forEach(([key, value]) => {
        prompt += `\n${key}: ${value}`;
      });
    }

    if (generateSubject) {
      prompt += `\n\nAlso generate a compelling subject line for this email.`;
    }

    // In production, this would call an AI service like OpenAI
    // For now, we'll generate a simple response
    let generatedBody = template
      .replace(/\{\{name\}\}/gi, contactName)
      .replace(/\{\{company\}\}/gi, companyName || '[Company]');
    
    // Replace any remaining template variables
    if (customFields) {
      Object.entries(customFields).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        generatedBody = generatedBody.replace(regex, value as string);
      });
    }

    // Add a simple greeting if not present
    if (!generatedBody.toLowerCase().includes('dear') && !generatedBody.toLowerCase().includes('hi') && !generatedBody.toLowerCase().includes('hello')) {
      generatedBody = `Hi ${contactName},\n\n${generatedBody}`;
    }

    // Generate subject if requested
    let subject = '';
    if (generateSubject) {
      // Simple subject generation based on template
      const words = template.split(' ').slice(0, 5).join(' ');
      subject = `Re: ${words}...`;
    }

    return res.status(200).json({
      success: true,
      email: {
        subject: subject || 'No subject',
        body: generatedBody
      }
    });

  } catch (error: any) {
    console.error('Error generating email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate email' 
    });
  }
}