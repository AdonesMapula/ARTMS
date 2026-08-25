<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Application Update — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Platform
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      Ready for Interview
    </h1>
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:#dbeafe;color:#1e40af;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Next Steps</span>
  </div>

   <div style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:15px;color:#374151;">Dear <strong>{{ $applicant->first_name }} {{ $applicant->last_name }}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      {{ $message }}
    </p>
    
    <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#1e3a5f;"><strong>Application ID:</strong> {{ $applicant->application_id }}</p>
      <p style="margin:0;font-size:14px;color:#1e3a5f;"><strong>Position:</strong> {{ $job_title }}</p>
    </div>

    <p style="margin-top:20px;font-size:14px;color:#4b5563;line-height:1.6;">
      Our HR team will be contacting you soon to schedule your interview session. Please keep an eye on your email and phone for further communication.
    </p>
    <p style="margin-top:16px;font-size:14px;color:#374151;">We look forward to meeting you!</p>
    <p style="margin-top:24px;font-size:14px;color:#374151;">
      Best regards,<br>
      <strong>ARTMS Team</strong>
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
