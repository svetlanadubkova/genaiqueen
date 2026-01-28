export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.json();

    // Validate required fields
    const required = ['name', 'email', 'business', 'tier', 'message'];
    for (const field of required) {
      if (!formData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format the email content
    const tierLabels = {
      'tier1': 'Tier 1: Traditional Visibility ($1,500)',
      'tier2': 'Tier 2: AI Recommendation ($3,000)',
      'tier3': 'Tier 3: Omnipresence ($5,000)',
      'not-sure': 'Not sure yet',
    };

    const emailBody = `
New GEO inquiry from genaiqueen.com

Name: ${formData.name}
Email: ${formData.email}
Business/Website: ${formData.business}
Interested In: ${tierLabels[formData.tier] || formData.tier}

Message:
${formData.message}

---
Submitted at: ${new Date().toISOString()}
    `.trim();

    // Send email via MailChannels (free with Cloudflare Workers)
    const mailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: 'lana@genaiqueen.com', name: 'Lana' }],
          },
        ],
        from: {
          email: 'noreply@genaiqueen.com',
          name: 'genaiqueen.com',
        },
        reply_to: {
          email: formData.email,
          name: formData.name,
        },
        subject: `New GEO Inquiry from ${formData.name}`,
        content: [
          {
            type: 'text/plain',
            value: emailBody,
          },
        ],
      }),
    });

    if (!mailResponse.ok) {
      const errorText = await mailResponse.text();
      console.error('MailChannels error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Form submitted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process form submission' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
