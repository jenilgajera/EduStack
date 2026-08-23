const path = require("path");
const nodemailer = require("nodemailer");

// Always load server/.env from this file's directory (works even if cwd differs)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

/**
 * Gmail: Google "App Password" only (not normal password).
 * https://myaccount.google.com/apppasswords
 *
 * Optional — no SMTP: https://resend.com (free tier)
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM_EMAIL=Edustack <onboarding@resend.dev>
 *
 * Custom SMTP: SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS)
 */
let cachedTransporter = undefined;

function stripQuotes(v) {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s.length >= 2 && ((s[0] === '"' && s[s.length - 1] === '"') || (s[0] === "'" && s[s.length - 1] === "'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

function isPlaceholderCredentials(user, pass) {
  const u = (user || "").toLowerCase();
  const p = (pass || "").toLowerCase();
  if (u.includes("your_email")) return true;
  if (p.includes("your_gmail") || p === "yourpassword" || p === "password") return true;
  return false;
}

function getEmailTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const user = stripQuotes(process.env.EMAIL_USER);
  const rawPass = process.env.EMAIL_PASS;
  const pass = typeof rawPass === "string" ? stripQuotes(rawPass).replace(/\s/g, "") : "";

  if (!user || !pass) {
    console.warn(
      "[email] Set EMAIL_USER and EMAIL_PASS in server/.env (Gmail App Password), or use RESEND_API_KEY for Resend."
    );
    cachedTransporter = null;
    return null;
  }

  if (isPlaceholderCredentials(user, pass)) {
    console.warn(
      "[email] EMAIL_USER / EMAIL_PASS are still template placeholders — replace with a real Gmail + App Password (see https://myaccount.google.com/apppasswords)."
    );
    cachedTransporter = null;
    return null;
  }

  const customHost = process.env.SMTP_HOST?.trim();

  if (!customHost || customHost === "smtp.gmail.com") {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: customHost,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
    requireTLS: !secure && port === 587,
  });

  return cachedTransporter;
}

/** Call after changing .env without restart (tests / hot reload edge cases) */
function resetEmailTransporterCache() {
  cachedTransporter = undefined;
}

module.exports = { getEmailTransporter, resetEmailTransporterCache };
