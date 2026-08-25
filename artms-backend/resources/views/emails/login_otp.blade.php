<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Verification — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#060F5A 0%,#1e3a8a 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Security
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      Login Verification Code
    </h1>
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:#dbeafe;color:#1e40af;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">One-Time Password</span>
  </div>

  <div style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:15px;color:#374151;">Hello <strong>{{ $user->name ?? $user->first_name }}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      A sign-in request was initiated for your ARTMS account. Please use the 6-digit verification code below to complete your login:
    </p>
    <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:40px;font-weight:800;letter-spacing:0.25em;color:#060F5A;font-family:monospace;">
        {{ $otp }}
      </span>
    </div>
    <p style="margin-top:20px;font-size:14px;color:#4b5563;line-height:1.6;">
      This code is valid for <strong style="color:#b91c1c;">10 minutes</strong> and can only be used once.
    </p>
    <p style="margin-top:12px;font-size:13px;color:#6b7280;line-height:1.6;">
      If you did not attempt to log in to ARTMS, please change your password immediately or contact your system administrator.
    </p>
    <p style="margin-top:24px;font-size:14px;color:#374151;">
      Best regards,<br>
      <strong>ARTMS Security Team</strong>
    </p>
  </div>

  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.05em;">
      ARTMS — AI Recruitment and Talent Management System<br>
      &copy; {{ date('Y') }} All rights reserved.
    </p>
  </div>

</div>
</body>
</html>
