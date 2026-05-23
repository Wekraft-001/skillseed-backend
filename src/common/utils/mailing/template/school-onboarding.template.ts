import { wrapInLayout } from './base-layout.template';

export function schoolOnboardingTemplate(
  email: string,
  password: string,
): string {
  const body = `
    <span class="badge">🏫 New School Account</span>
    <p>Hi there,</p>
    <p>Your school has been successfully onboarded on <strong>Skillseed</strong> 🎉</p>
    <p>Here are your login credentials. Please keep them safe:</p>
    <div class="credential-box">
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <p>For your security, you'll be prompted to change this password the first time you log in.</p>
    <a href="https://school.wekraft.co" class="btn btn-primary">Go to Dashboard →</a>
    <hr class="divider" />
    <p>If you have any questions, our team is always happy to help at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Welcome aboard! 🚀</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(body, 'Your school has been onboarded on Skillseed.');
}
