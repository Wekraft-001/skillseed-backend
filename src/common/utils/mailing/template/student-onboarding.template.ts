import { wrapInLayout } from './base-layout.template';

export function studentOnboardingParentTemplate(
  studentName: string,
  username: string,
  password: string,
  dashboardUrl: string,
): string {
  const body = `
    <span class="badge">🌱 Child Account Created</span>
    <p>Hi there,</p>
    <p>
      Your child <strong>${studentName}</strong> has been successfully registered on
      <strong>Skillseed</strong> and is ready to start their learning journey! 🎉
    </p>
    <p>Here are the login details for ${studentName}'s account:</p>
    <div class="credential-box">
      <p><strong>Dashboard:</strong> <a href="${dashboardUrl}" style="color:#4F46E5;">${dashboardUrl}</a></p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <p>We recommend that ${studentName} updates this password after their first login for security.</p>
    <a href="${dashboardUrl}" class="btn btn-primary">Open ${studentName}'s Dashboard →</a>
    <hr class="divider" />
    <p>As a parent, you can track ${studentName}'s progress, career interests, badges, and learning
       activities directly from your parent dashboard.</p>
    <p>We're excited to have ${studentName} onboard and can't wait to see their learning journey grow 🚀</p>
    <p>Best regards,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(body, `${studentName}'s Skillseed account is ready!`);
}

export function studentOnboardingSchoolTemplate(
  studentName: string,
  username: string,
  password: string,
  dashboardUrl: string,
): string {
  const body = `
    <span class="badge">🌱 New Student Registered</span>
    <p>Hi there,</p>
    <p>
      <strong>${studentName}</strong> has been successfully registered on <strong>Skillseed</strong> 🎉
    </p>
    <p>Here are the student's login details:</p>
    <div class="credential-box">
      <p><strong>Dashboard:</strong> <a href="${dashboardUrl}" style="color:#4F46E5;">${dashboardUrl}</a></p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <p>The student should update their password after their first login for security.</p>
    <a href="${dashboardUrl}" class="btn btn-primary">View Student Dashboard →</a>
    <hr class="divider" />
    <p>We're excited to have ${studentName} onboard and look forward to seeing their growth on the platform 🚀</p>
    <p>Best regards,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(body, `${studentName} has been registered on Skillseed.`);
}
