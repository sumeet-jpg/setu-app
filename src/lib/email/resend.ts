// @ts-nocheck
/**
 * SETU — Email Notifications via Resend
 *
 * Sends transactional emails for:
 * - New lead captured
 * - Blueprint submitted for review
 * - Approval request created
 *
 * All emails go through admin@setuagents.com.
 * Never sends to unverified addresses automatically.
 */

import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { escapeHtml as esc } from "./escape-html";

function getResend() {
  const env = getServerEnv();
  return new Resend(env.RESEND_API_KEY);
}

/**
 * Notify admin of a new lead capture.
 */
export async function sendLeadNotification(opts: {
  leadEmail: string;
  leadName?: string;
  company?: string;
  blueprintId?: string;
  inputSummary?: string;
}): Promise<void> {
  try {
    const env = getServerEnv();
    const resend = getResend();

    await resend.emails.send({
      from: env.FROM_EMAIL,
      to: env.ADMIN_ALERT_EMAIL,
      subject: `New Setu Lead: ${esc(opts.company ?? opts.leadEmail)}`,
      html: `
        <h2>New Blueprint Lead</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${esc(opts.leadEmail)}</td></tr>
          ${opts.leadName ? `<tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${esc(opts.leadName)}</td></tr>` : ""}
          ${opts.company ? `<tr><td style="padding:8px;font-weight:bold">Company</td><td style="padding:8px">${esc(opts.company)}</td></tr>` : ""}
          ${opts.inputSummary ? `<tr><td style="padding:8px;font-weight:bold">Workflow</td><td style="padding:8px">${esc(opts.inputSummary)}</td></tr>` : ""}
          ${opts.blueprintId ? `<tr><td style="padding:8px;font-weight:bold">Blueprint</td><td style="padding:8px"><a href="https://app.setuagents.com/admin/blueprints/${opts.blueprintId}">Review Blueprint</a></td></tr>` : ""}
        </table>
        <p style="margin-top:16px"><a href="https://app.setuagents.com/admin/leads" style="background:#4f46e5;color:white;padding:8px 16px;border-radius:8px;text-decoration:none">View in Admin Console</a></p>
      `,
    });
  } catch (err) {
    // Never block the main flow on email failure
    console.error("[Setu] Lead notification email failed:", err instanceof Error ? err.message : "unknown");
  }
}

/**
 * Notify admin of a blueprint pending review.
 */
export async function sendBlueprintReviewNotification(opts: {
  blueprintId: string;
  inputSummary: string;
  agentName?: string;
  confidence?: number;
}): Promise<void> {
  try {
    const env = getServerEnv();
    const resend = getResend();

    await resend.emails.send({
      from: env.FROM_EMAIL,
      to: env.ADMIN_ALERT_EMAIL,
      subject: `Blueprint Ready for Review: ${esc(opts.agentName ?? "Unknown Agent")}`,
      html: `
        <h2>Blueprint Pending Review</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold">Workflow</td><td style="padding:8px">${esc(opts.inputSummary)}</td></tr>
          ${opts.agentName ? `<tr><td style="padding:8px;font-weight:bold">Recommended Agent</td><td style="padding:8px">${esc(opts.agentName)}</td></tr>` : ""}
          ${opts.confidence ? `<tr><td style="padding:8px;font-weight:bold">Confidence</td><td style="padding:8px">${opts.confidence}%</td></tr>` : ""}
        </table>
        <p style="margin-top:16px"><a href="https://app.setuagents.com/admin/blueprints/${opts.blueprintId}" style="background:#4f46e5;color:white;padding:8px 16px;border-radius:8px;text-decoration:none">Review Blueprint</a></p>
      `,
    });
  } catch (err) {
    console.error("[Setu] Blueprint review email failed:", err instanceof Error ? err.message : "unknown");
  }
}

/**
 * Send confirmation to the prospect after lead capture.
 */
export async function sendProspectConfirmation(opts: {
  toEmail: string;
  name?: string;
  blueprintId?: string;
}): Promise<void> {
  try {
    const env = getServerEnv();
    const resend = getResend();

    await resend.emails.send({
      from: env.FROM_EMAIL,
      to: opts.toEmail,
      subject: "Your Setu Agent Blueprint is ready for review",
      html: `
        <h2>Thanks${opts.name ? `, ${esc(opts.name)}` : ""}!</h2>
        <p>Your Agent Blueprint has been submitted and a Setu advisor will review it and reach out within 1 business day.</p>
        <p>In the meantime, you can continue refining your blueprint or explore the full agent catalog.</p>
        ${opts.blueprintId ? `<p><a href="https://app.setuagents.com/blueprints/new" style="background:#4f46e5;color:white;padding:8px 16px;border-radius:8px;text-decoration:none">Continue Blueprint</a></p>` : ""}
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Setu — AI Operations Control Plane · app.setuagents.com</p>
      `,
    });
  } catch (err) {
    console.error("[Setu] Prospect confirmation email failed:", err instanceof Error ? err.message : "unknown");
  }
}
