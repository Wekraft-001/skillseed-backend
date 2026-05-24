export function contactFormTemplate(data: {
  senderName: string;
  senderEmail: string;
  phoneNumber?: string;
  question: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Submission – Wekraft</title>
  <style>
    body { margin:0; padding:0; background-color:#f4f6fb; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { width:100%; background-color:#f4f6fb; padding:40px 0; }
    .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }

    /* Header */
    .header { background-color:#0D1B2A; padding:36px 40px; text-align:center; }
    .header-logo { font-size:28px; font-weight:900; color:#FAB548; letter-spacing:2px; margin:0 0 4px; }
    .header-sub { font-size:13px; color:#7B8FA3; letter-spacing:1px; text-transform:uppercase; margin:0; }

    /* Badge */
    .badge-wrap { padding:28px 40px 0; }
    .badge { display:inline-block; background:#FAB548; color:#0D1B2A; font-size:12px; font-weight:700;
             padding:5px 14px; border-radius:100px; letter-spacing:0.5px; text-transform:uppercase; }

    /* Body */
    .body { padding:20px 40px 32px; color:#1E293B; font-size:15px; line-height:1.7; }
    .body p { margin:0 0 14px; }

    /* Info box */
    .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
                padding:18px 22px; margin:16px 0; }
    .info-box p { margin:6px 0; font-size:14px; color:#334155; }
    .info-box strong { color:#0D1B2A; }
    .info-box a { color:#3C7FBF; text-decoration:none; }

    /* Question box */
    .question-box { background:#f8fafc; border-left:4px solid #FAB548;
                    border-radius:0 10px 10px 0; padding:16px 20px; margin:16px 0; }
    .question-box p { margin:0; font-size:15px; color:#1E293B; white-space:pre-wrap; line-height:1.8; }

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

      <div class="header">
        <p class="header-logo">WEKRAFT</p>
        <p class="header-sub">Contact Form Notification</p>
      </div>

      <div class="badge-wrap">
        <span class="badge">📬 New Message</span>
      </div>

      <div class="body">
        <p>You have received a new message through the Wekraft website contact form.</p>

        <div class="info-box">
          <p><strong>Name:</strong> ${data.senderName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.senderEmail}">${data.senderEmail}</a></p>
          ${data.phoneNumber ? `<p><strong>Phone:</strong> ${data.phoneNumber}</p>` : ''}
        </div>

        <p><strong>Their question:</strong></p>
        <div class="question-box">
          <p>${data.question}</p>
        </div>

        <hr />
        <p style="font-size:13px;color:#94a3b8;margin:0;">
          Reply directly to <a href="mailto:${data.senderEmail}" style="color:#3C7FBF;">${data.senderEmail}</a> to respond to ${data.senderName}.
        </p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Wekraft Ltd · Norsken House, Kigali, Rwanda</p>
        <p><a href="https://wekraft.co">wekraft.co</a> &nbsp;·&nbsp; <a href="mailto:skillseed@wekraft.co">skillseed@wekraft.co</a></p>
      </div>

    </div>
  </div>
</body>
</html>`;
}
