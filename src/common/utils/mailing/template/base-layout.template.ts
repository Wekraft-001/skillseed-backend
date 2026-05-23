export function wrapInLayout(bodyHtml: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Skillseed</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; }
    .email-wrapper { width: 100%; background-color: #f4f6fb; padding: 40px 0; }
    .email-card  { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .email-header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 36px 40px; text-align: center; }
    .email-header img { height: 40px; }
    .email-header h1 { color: #ffffff; font-size: 22px; margin: 16px 0 0; font-weight: 700; letter-spacing: -0.3px; }
    .email-body { padding: 40px; color: #1e293b; font-size: 15px; line-height: 1.7; }
    .email-body p { margin: 0 0 16px; }
    .email-body ul { padding-left: 20px; margin: 0 0 16px; }
    .email-body ul li { margin-bottom: 8px; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; margin: 8px 0 24px; }
    .btn-primary { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #ffffff; }
    .btn-danger  { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #ffffff; }
    .credential-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .credential-box p { margin: 6px 0; font-size: 14px; }
    .credential-box strong { color: #4F46E5; }
    .badge { display: inline-block; background: #ede9fe; color: #5b21b6; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 100px; margin-bottom: 16px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .email-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6; }
    .email-footer a { color: #4F46E5; text-decoration: none; }
  </style>
</head>
<body>
  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ''}
  <div class="email-wrapper">
    <div class="email-card">
      <div class="email-header">
        <div style="font-size:28px;">🌱</div>
        <h1>Skillseed</h1>
      </div>
      <div class="email-body">
        ${bodyHtml}
      </div>
      <div class="email-footer">
        <p>© ${new Date().getFullYear()} Skillseed. All rights reserved.</p>
        <p>
          <a href="https://wekraft.co">Website</a> &nbsp;·&nbsp;
          <a href="mailto:support@skillseed.com">Support</a> &nbsp;·&nbsp;
          <a href="https://wekraft.co/privacy">Privacy Policy</a>
        </p>
        <p style="margin-top:8px;color:#cbd5e1;">
          You're receiving this because you have a Skillseed account.<br/>
          If you didn't expect this email, please contact us.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
