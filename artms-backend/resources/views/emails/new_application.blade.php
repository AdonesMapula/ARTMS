<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Application — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Platform
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      New Application Received
    </h1>
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:#e0e7ff;color:#3730a3;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Application</span>
  </div>

   <div style="padding:36px 40px;">
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      A new application has been successfully submitted to the system. Here are the applicant's details:
    </p>
    
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;width:38%;border-bottom:1px solid #e5e7eb;">Application ID</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">
          {{ $applicant->application_id }}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Applicant Name</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          {{ $applicant->first_name }} {{ $applicant->last_name }}
        </td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Email Address</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          {{ $applicant->email }}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;">Date Applied</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;">
          {{ $applicant->created_at->format('M d, Y h:i A') }}
        </td>
      </tr>
    </table>
    <div style="margin-top:28px;text-align:center;">
      <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/admin/applicants"
         style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
        View Application in ARTMS
      </a>
    </div>
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
