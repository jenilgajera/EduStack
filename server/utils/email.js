const axios = require("axios");
const { getEmailTransporter } = require("../config/emailConfig");
const { emailFormat } = require("./emailFormat");

function isSixDigitOtp(text) {
  return typeof text === "string" && /^\d{6}$/.test(String(text).trim());
}

function logOtpToConsole(to, text) {
  if (!isSixDigitOtp(text)) return;
  const otp = String(text).trim();
  console.log("\n========================================");
  console.log("Edustack — OTP (email not sent — use below or fix .env)");
  console.log(`To: ${to}`);
  console.log(`OTP: ${otp}`);
  console.log("========================================\n");
}

async function sendViaResend(to, subject, html) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Edustack <onboarding@resend.dev>";

  try {
    await axios.post(
      "https://api.resend.com/emails",
      { from, to: [to], subject, html },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );
    console.log(`[email] Sent via Resend to ${to}: ${subject}`);
    return { ok: true };
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("[email] Resend API error:", typeof detail === "object" ? JSON.stringify(detail) : detail);
    return { ok: false, reason: err.response?.data?.message || err.message };
  }
}

/**
 * @returns {{ ok: boolean, consoleOtp?: boolean, reason?: string }}
 */
const sendMail = async (to, subject, text) => {
  const html = emailFormat(String(text).trim());

  const resendResult = await sendViaResend(to, subject, html);
  if (resendResult) {
    if (resendResult.ok) return { ok: true };
    console.warn("[email] Resend failed, trying SMTP if configured...");
  }

  const transporter = getEmailTransporter();
  const fromUser = process.env.EMAIL_USER?.replace(/^["']|["']$/g, "").trim() || "noreply@localhost";

  const mailOptions = {
    from: `"Edustack" <${fromUser}>`,
    to,
    subject,
    html,
  };

  if (!transporter) {
    logOtpToConsole(to, text);
    return { ok: false, consoleOtp: isSixDigitOtp(text), reason: "No working email transport (Resend/SMTP)" };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[email] Sent via SMTP to ${to}: ${subject}`);
    return { ok: true };
  } catch (error) {
    console.error("[email] SMTP send failed:", error.message);
    if (error.response) console.error("[email] SMTP response:", error.response);
    logOtpToConsole(to, text);
    return {
      ok: false,
      consoleOtp: isSixDigitOtp(text),
      reason: error.message,
    };
  }
};

module.exports = { sendMail };
