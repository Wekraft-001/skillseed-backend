import { wrapInLayout } from './base-layout.template';

export function subscriptionExpiredTemplate(
  parentFirstName: string,
  studentName: string,
  renewUrl: string,
): string {
  const body = `
    <span class="badge" style="background:#fee2e2;color:#991b1b;">⚠️ Subscription Expired</span>
    <p>Hi ${parentFirstName},</p>
    <p>
      We're writing to let you know that <strong>${studentName}</strong>'s Skillseed subscription
      has <strong>expired</strong>.
    </p>
    <p>
      As a result, <strong>${studentName} is temporarily unable to log in</strong> to the platform
      until the subscription is renewed.
    </p>
    <p>To restore access, simply renew the subscription from your parent dashboard:</p>
    <a href="${renewUrl}" class="btn btn-danger">Renew Subscription →</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#64748b;">
      If you believe this is an error or need assistance, please contact us at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Best regards,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(
    body,
    `Action required: ${studentName}'s Skillseed subscription has expired.`,
  );
}

// ── Subscription expiry warning (sent N days before expiry) ──────────────

export function subscriptionExpiryWarningTemplate(
  parentFirstName: string,
  studentName: string,
  expiryDate: string,
  renewUrl: string,
): string {
  const body = `
    <span class="badge" style="background:#fef3c7;color:#92400e;">⏳ Subscription Expiring Soon</span>
    <p>Hi ${parentFirstName},</p>
    <p>
      This is a friendly reminder that <strong>${studentName}</strong>'s Skillseed subscription
      is expiring on <strong>${expiryDate}</strong>.
    </p>
    <p>
      After this date, ${studentName} will be unable to log in until the subscription is renewed.
      Renew early to avoid any interruption to their learning journey!
    </p>
    <a href="${renewUrl}" class="btn btn-primary">Renew Now →</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#64748b;">
      Questions? Contact us at
      <a href="mailto:support@skillseed.com" style="color:#4F46E5;">support@skillseed.com</a>.
    </p>
    <p>Best regards,</p>
    <p><strong>The Skillseed Team</strong></p>
  `;

  return wrapInLayout(
    body,
    `${studentName}'s subscription expires on ${expiryDate}.`,
  );
}