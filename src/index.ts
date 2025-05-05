import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { Resend } from 'resend';

type Env = {
  RESEND_API: string;
  EMAIL_RECEIVER: string;
};

type ContactForm = {
  name: string;
  email: string;
  message: string;
};

const app = new Hono();
app.use('*', cors());

app.get('/', (c) => {
  return c.text('Worker Running');
});

app.post('/contact', async (c) => {
  const { RESEND_API, EMAIL_RECEIVER } = env<Env>(c);
  const resend = new Resend(RESEND_API);

  const body = await c.req.json<ContactForm>();
  const { name, email, message } = body;

  if (!name || !email || !message) {
    return c.json({ success: false, message: 'All fields are required' }, 400);
  }

  const html = `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f1f0f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e1e1e1;
    }
    h1 {
      color: #6a0dad;
      font-size: 28px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    p {
      font-size: 16px;
      color: #4f4f4f;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .highlight {
      font-weight: bold;
      color: #6a0dad;
    }
    .highlight-background {
      background-color: #f3e5f5;
      padding: 5px 10px;
      border-radius: 5px;
    }
    .message-box {
      background-color: #f4f4f4;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e1e1e1;
      margin-top: 10px;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      text-align: center;
      color: #b8b8b8;
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f0f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e1e1e1; padding: 20px;">
          <tr>
            <td>
              <h1>New Message from ${name}</h1>
              <p><span class="highlight">Name:</span> <span class="highlight-background">${name}</span></p>
              <p><span class="highlight">Email:</span> <span class="highlight-background">${email}</span></p>
              <p><span class="highlight">Message:</span></p>
              <div class="message-box">
                <p>${message}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

`;

  const { error: sendError } = await resend.emails.send({
    from: 'contact@easybits.xyz',
    to: EMAIL_RECEIVER,
    subject: `New Message from ${name}`,
    html: html,
  });

  if (sendError) {
    return c.json({ success: false, error: sendError.message }, 403);
  }

  return c.json({ success: true });
});

export default app;
