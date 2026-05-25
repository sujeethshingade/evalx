import { Resend } from "resend";

export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
};

export const getEmailFromAddress = () => {
  return process.env.RESEND_FROM;
};

export const otpTemplate = (otp: string) => `
  <div style="font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; color: #e2e8f0;">
    <div style="max-width: 560px; margin: 0 auto; background: #0b1220; border: 1px solid #1f2a44; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(2, 6, 23, 0.45);">
      <div style="padding: 28px; border-bottom: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #60a5fa;">EvalX Secure Verification</p>
        <h2 style="margin: 8px 0 0; font-size: 24px; line-height: 1.3; color: #f8fafc;">Your one-time verification code</h2>
      </div>
      <div style="padding: 28px;">
        <p style="margin: 0 0 14px; color: #cbd5e1; font-size: 15px;">Use the following code to verify your email and finish setting up your EvalX account.</p>
        <div style="margin: 22px 0; padding: 18px; border-radius: 14px; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); text-align: center;">
          <span style="font-size: 34px; letter-spacing: 0.35em; color: #ffffff; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${otp}</span>
        </div>
        <p style="margin: 0; color: #94a3b8; font-size: 13px;">This code expires in 10 minutes.</p>
      </div>
      <div style="padding: 20px 28px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px;">
        Developed by Sujeeth Shingade
      </div>
    </div>
  </div>
`;

export const resultsTemplate = (semester: string) => `
  <div style="font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: radial-gradient(circle at top right, #1d4ed8 0%, #0f172a 44%, #020617 100%); padding: 30px; color: #e2e8f0;">
    <div style="max-width: 620px; margin: 0 auto; background: #0b1220; border: 1px solid #1f2a44; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(2, 6, 23, 0.45);">
      <div style="padding: 30px; border-bottom: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #60a5fa;">EvalX Export Delivery</p>
        <h2 style="margin: 10px 0 0; font-size: 25px; line-height: 1.3; color: #f8fafc;">Your semester ${semester} results are ready</h2>
      </div>
      <div style="padding: 28px;">
        <div style="margin-top: 18px; padding: 16px 18px; border-radius: 12px; border: 1px solid #334155; background: #0f172a; color: #93c5fd; font-size: 14px;">
          Attachment: EvalX_Results_Sem${semester}.xlsx
        </div>
      </div>
      <div style="padding: 20px 28px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px;">
        Developed by Sujeeth Shingade
      </div>
    </div>
  </div>
`;
