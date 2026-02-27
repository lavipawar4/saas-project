import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/email/resend";

interface NegativeReviewAlertProps {
    ownerEmail: string;
    ownerName: string;
    businessName: string;
    reviewerName: string;
    starRating: number;
    reviewText: string | null;
    reviewDate: string;
    dashboardUrl: string;
}

function starEmoji(rating: number) {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
}

function buildHtml(p: NegativeReviewAlertProps): string {
    const stars = starEmoji(p.starRating);
    const excerpt = p.reviewText
        ? p.reviewText.length > 300
            ? p.reviewText.slice(0, 297) + "…"
            : p.reviewText
        : "No written review.";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Negative Review Alert</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">ReviewAI</span>
                  </td>
                  <td align="right">
                    <span style="background:rgba(255,255,255,0.15);color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:0.5px;">ALERT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert banner -->
          <tr>
            <td style="background:#7f1d1d;padding:14px 32px;border-bottom:1px solid #991b1b;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#fca5a5;">
                🚨 New ${p.starRating}-star review requires your attention
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px 0;font-size:15px;color:#94a3b8;">Hi ${p.ownerName || "there"},</p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">
                <strong style="color:#e2e8f0;">${p.businessName}</strong> just received a new low-rating review on Google. We recommend responding within 24 hours.
              </p>

              <!-- Review card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td>
                          <span style="font-size:20px;letter-spacing:1px;">${stars}</span>
                        </td>
                        <td align="right">
                          <span style="font-size:12px;color:#64748b;">${p.reviewDate}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#e2e8f0;">${p.reviewerName}</p>
                    <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;font-style:italic;">&ldquo;${excerpt}&rdquo;</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${p.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
                      Respond Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                You're receiving this because negative review alerts are enabled for ${p.businessName}.<br/>
                <a href="${p.dashboardUrl}/settings" style="color:#6366f1;text-decoration:none;">Manage alert preferences</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <p style="margin:20px 0 0 0;font-size:12px;color:#334155;text-align:center;">
          ReviewAI · Automated Review Management
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendNegativeReviewAlert(props: NegativeReviewAlertProps) {
    if (!process.env.RESEND_API_KEY) {
        console.log("[Resend] Skipping email — RESEND_API_KEY not set", {
            to: props.ownerEmail,
            reviewer: props.reviewerName,
            rating: props.starRating,
        });
        return { success: true, skipped: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: props.ownerEmail,
            subject: `🚨 New ${props.starRating}★ review — ${props.businessName}`,
            html: buildHtml(props),
        });

        if (error) {
            console.error("[Resend] Failed to send alert:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Resend] Exception sending alert:", message);
        return { success: false, error: message };
    }
}
