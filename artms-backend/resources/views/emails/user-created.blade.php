<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Platform
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      Welcome to ARTMS
    </h1>
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:#dcfce7;color:#166534;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Account Created</span>
  </div>

   <div style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:15px;color:#374151;">Hello <strong>{{ $user->first_name }}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      An administrator has successfully created a new account for you on the <strong>ARTMS platform</strong>.
    </p>
    
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:24px;border-radius:12px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your Temporary Password</p>
      <span style="display:inline-block;font-size:24px;font-weight:700;color:#0f172a;font-family:monospace;padding:8px 24px;background:#ffffff;border:1px dashed #cbd5e1;border-radius:8px;">
        {{ $temporaryPassword }}
      </span>
    </div>

    <p style="margin-top:20px;font-size:14px;color:#4b5563;line-height:1.6;">
      For your security, you must verify your email address and set a new personal password before you can access the system.
    </p>

    <div style="margin-top:28px;text-align:center;">
      <a href="{{ $setupUrl }}"
         style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
        Setup My Account
      </a>
    </div>
    
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;line-height:1.6;word-break:break-all;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="{{ $setupUrl }}" style="color:#3b82f6;">{{ $setupUrl }}</a>
    </p>
    <p style="margin-top:24px;font-size:14px;color:#374151;">
      Best regards,<br>
      <strong>ARTMS Team</strong>
    </p>
  </div>

  
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.05em;">
      ARTMS — AI Recruitment and Talent Management System<br>
      &copy; { date('Y') } All rights reserved.
    </p>
  </div>

</div>
</body>
</html>
