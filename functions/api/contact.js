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
Phone: ${formData.phone || 'Not provided'}
Interested In: ${tierLabels[formData.tier] || formData.tier}

Message:
${formData.message}

---
Submitted at: ${new Date().toISOString()}
    `.trim();

    // Send email via SendGrid
    if (env.SENDGRID_API_KEY) {
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: env.RECIPIENT_EMAIL || 'lana@genaiqueen.com' }],
            subject: `New GEO Inquiry from ${formData.name}`,
          }],
          from: {
            email: 'noreply@genaiqueen.com',
            name: 'genaiqueen.com'
          },
          reply_to: {
            email: formData.email,
            name: formData.name
          },
          content: [{
            type: 'text/plain',
            value: emailBody,
          }],
        }),
      });

      if (!sendGridResponse.ok) {
        const errorText = await sendGridResponse.text();
        console.error('SendGrid error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error('SENDGRID_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
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
