export function contactAutoReplyTemplate(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We received your message – Wekraft</title>
  <style>
    body { margin:0; padding:0; background-color:#f4f6fb; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { width:100%; background-color:#f4f6fb; padding:40px 0; }
    .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }

    /* Header */
    .header { background-color:#0D1B2A; padding:40px; text-align:center; }
    .header-logo { font-size:30px; font-weight:900; color:#FAB548; letter-spacing:3px; margin:0 0 6px; }
    .header-tagline { font-size:13px; color:#7B8FA3; margin:0; letter-spacing:0.5px; }

    /* Hero strip */
    .hero { background:linear-gradient(135deg,#3C7FBF 0%,#0D1B2A 100%);
            padding:28px 40px; text-align:center; }
    .hero-icon { font-size:40px; margin:0 0 8px; }
    .hero-title { font-size:20px; font-weight:700; color:#FAB548; margin:0; letter-spacing:0.5px; }

    /* Body */
    .body { padding:32px 40px; color:#1E293B; font-size:15px; line-height:1.8; }
    .body p { margin:0 0 16px; }

    /* CTA button */
    .btn-wrap { text-align:center; margin:24px 0; }
    .btn { display:inline-block; background:#FAB548; color:#0D1B2A; font-size:15px; font-weight:700;
           padding:14px 36px; border-radius:100px; text-decoration:none; letter-spacing:0.3px; }

    /* What to expect box */
    .expect-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px 24px; margin:20px 0; }
    .expect-box p { margin:8px 0; font-size:14px; color:#334155; display:flex; align-items:flex-start; gap:8px; }

    /* Divider */
    hr { border:none; border-top:1px solid #e2e8f0; margin:24px 0; }

    /* Footer */
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 40px;
              text-align:center; color:#94a3b8; font-size:12px; line-height:1.6; }
    .footer a { color:#3C7FBF; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <p class="header-logo">WEKRAFT</p>
        <p class="header-tagline">Empowering the next generation</p>
      </div>

      <!-- Hero strip -->
      <div class="hero">
        <p class="hero-icon">🎈</p>
        <p class="hero-title">Message Received!</p>
      </div>

      <!-- Body -->
      <div class="body">
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>
          Thank you for reaching out to <strong>Skillseed by Wekraft</strong>.
          We have received your message and our team will get back to you as soon as possible.
        </p>

        <div class="expect-box">
          <p>⏱️ &nbsp;<strong>Response time:</strong> Within 1–2 business days</p>
          <p>📧 &nbsp;<strong>Reply to:</strong> skillseed@wekraft.co</p>
          <p>📍 &nbsp;<strong>Location:</strong> Norsken House, Kigali, Rwanda</p>
        </div>

        <p>
          While you wait, feel free to explore more about what Skillseed has to offer for children and families.
        </p>

        <div class="btn-wrap">
          <a href="https://wekraft.co" class="btn">Explore Wekraft →</a>
        </div>

        <hr />

        <p style="font-size:13px;color:#64748b;margin:0;">
          If your enquiry is urgent, contact us directly at
          <a href="mailto:skillseed@wekraft.co" style="color:#3C7FBF;">skillseed@wekraft.co</a>
          or call <strong>+250793177089</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© ${new Date().getFullYear()} Wekraft Ltd · All rights reserved</p>
        <p>
          <a href="https://wekraft.co">Website</a> &nbsp;·&nbsp;
          <a href="mailto:skillseed@wekraft.co">skillseed@wekraft.co</a> &nbsp;·&nbsp;
          Norsken House, Kigali, RW
        </p>
        <p style="margin-top:8px;color:#cbd5e1;">
          You're receiving this because you submitted a message through our contact form.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}
