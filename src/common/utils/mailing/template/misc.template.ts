import { wrapInLayout } from './base-layout.template';

// ── Credential approved ───────────────────────────────────────────────────
export function credentialApprovedTemplate(
  firstName: string,
  credentialType: string,
): string {
  const credentialName =
    credentialType === 'government_id'
      ? 'Government ID'
      : 'Professional Credentials';

  const body = `
    <span class="badge" style="background:#dcfce7;color:#166534;">✅ Credentials Approved</span>
    <p>Hi ${firstName},</p>
    <p>Great news! Your <strong>${credentialName}</strong> has been <strong>approved</strong> by our team.</p>
    <p>
      Your profile is now fully verified, which means you can access all mentor features on Skillseed.
    </p>
    <a href="https://mentor.wekraft.co" class="btn btn-primary">Go to Mentor Dashboard →</a>
    <hr class="divider" />
    <p>Thank you for your cooperation during the verification process.</p>
    <p>If you have any questions, contact us at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Best regards,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(body, `Your ${credentialName} has been approved!`);
}

// ── Credential rejected ───────────────────────────────────────────────────

export function credentialRejectedTemplate(
  firstName: string,
  credentialType: string,
  rejectionReason: string,
): string {
  const credentialName =
    credentialType === 'government_id'
      ? 'Government ID'
      : 'Professional Credentials';

  const body = `
    <span class="badge" style="background:#fee2e2;color:#991b1b;">❌ Credentials Not Approved</span>
    <p>Hi ${firstName},</p>
    <p>
      We've reviewed your <strong>${credentialName}</strong> and unfortunately were unable to
      approve it at this time.
    </p>
    <div class="credential-box" style="border-color:#fca5a5;">
      <p><strong>Reason:</strong></p>
      <p>${rejectionReason || 'The submitted credentials did not meet our verification requirements.'}</p>
    </div>
    <p>Please log in to your account and upload a new document that addresses the issue above.</p>
    <a href="https://mentor.wekraft.co" class="btn btn-primary">Update Credentials →</a>
    <hr class="divider" />
    <p>If you need clarification, contact our support team at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Thank you for your understanding.</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(body, `Action required: ${credentialName} not approved.`);
}

// ── Mentor suspended ─────────────────────────────────────────────────────

export function mentorSuspensionTemplate(firstName: string): string {
  const body = `
    <span class="badge" style="background:#fef3c7;color:#92400e;">⚠️ Account Suspended</span>
    <p>Hi ${firstName},</p>
    <p>
      We're writing to inform you that your Skillseed mentor account has been
      <strong>temporarily suspended</strong>.
    </p>
    <p>
      This may be due to a policy violation, credential verification issue, or administrative review.
    </p>
    <hr class="divider" />
    <p>
      If you believe this was taken in error or would like to discuss reinstatement,
      please contact our support team at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Thank you for your understanding.</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(
    body,
    'Your Skillseed mentor account has been suspended.',
  );
}

// ── Mentor reactivated ───────────────────────────────────────────────────

export function mentorReactivationTemplate(firstName: string): string {
  const body = `
    <span class="badge" style="background:#dcfce7;color:#166534;">✅ Account Reactivated</span>
    <p>Hi ${firstName},</p>
    <p>
      Great news — your Skillseed mentor account has been <strong>reactivated</strong>!
    </p>
    <p>You can now log in and resume all mentor activities on the platform.</p>
    <a href="https://mentor.wekraft.co" class="btn btn-primary">Go to Mentor Dashboard →</a>
    <hr class="divider" />
    <p>Thank you for your patience during this process.</p>
    <p>If you have any questions, contact us at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Best regards,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(
    body,
    'Your Skillseed mentor account has been reactivated.',
  );
}
