import { Router } from "express";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REQUESTS_FILE = path.join(__dirname, "../../feature-requests.json");

const TARGET_EMAIL = "lesly.dsouza@gohighlevel.com";

function loadRequests(): any[] {
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      return JSON.parse(fs.readFileSync(REQUESTS_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveRequests(requests: any[]) {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

router.post("/feature-request", async (req, res) => {
  try {
    const { name, email, category, description } = req.body;

    if (!name || !description) {
      res.status(400).json({ error: "Name and description are required" });
      return;
    }

    const request = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      email: email || "Not provided",
      category: category || "General",
      description,
      timestamp: new Date().toISOString(),
    };

    const requests = loadRequests();
    requests.push(request);
    saveRequests(requests);

    let emailSent = false;
    const smtpHost = process.env["SMTP_HOST"];
    const smtpUser = process.env["SMTP_USER"];
    const smtpPass = process.env["SMTP_PASS"];

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env["SMTP_PORT"] || "587"),
          secure: process.env["SMTP_SECURE"] === "true",
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: smtpUser,
          to: TARGET_EMAIL,
          subject: `[Brand Engine] Feature Request: ${category || "General"}`,
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2896FB, #095DC3); padding: 24px; border-radius: 12px 12px 0 0;">
                <h2 style="color: white; margin: 0; font-size: 20px;">New Feature Request</h2>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Brand Engine</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 100px;">From</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b; font-size: 14px;">${name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${email || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Category</td><td style="padding: 8px 0; font-size: 14px;"><span style="background: #2896FB; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${category || "General"}</span></td></tr>
                </table>
                <div style="margin-top: 16px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Description</p>
                  <p style="margin: 8px 0 0; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
                </div>
                <p style="margin: 16px 0 0; color: #94a3b8; font-size: 11px;">Submitted on ${new Date().toLocaleString()}</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    }

    res.json({
      success: true,
      emailSent,
      message: emailSent
        ? "Feature request submitted and email sent!"
        : "Feature request saved! (Email delivery not configured yet)",
    });
  } catch (err) {
    console.error("Feature request error:", err);
    res.status(500).json({ error: "Failed to save feature request" });
  }
});

router.get("/feature-requests", async (_req, res) => {
  const requests = loadRequests();
  res.json(requests);
});

export default router;
