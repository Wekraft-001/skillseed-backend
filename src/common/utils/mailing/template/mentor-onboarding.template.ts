import { wrapInLayout } from './base-layout.template';

export function mentorOnboardingTemplate(
  firstName: string,
  email: string,
  password: string,
): string {
  const body = `
    <span class="badge">🎓 Mentor Account</span>
    <p>Hi ${firstName},</p>
    <p>Welcome to <strong>Skillseed</strong>! We're thrilled to have you join our mentorship network 🎉</p>
    <p>Here are your login credentials:</p>
    <div class="credential-box">
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <p>You'll be prompted to reset your password the first time you log in to keep your account secure.</p>
    <a href="https://mentor.wekraft.co" class="btn btn-primary">Go to Mentor Dashboard →</a>
    <hr class="divider" />
    <p>As a mentor, you play a key role in shaping the experience of learners and supporting their growth.
       We're excited to see the impact you'll make!</p>
    <p>If you need any help getting started, reach out at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Let's make learning meaningful,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(body, `Welcome to Skillseed, ${firstName}!`);
}
