<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interview Reminder — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  {-- ── Header Banner ────────────────────────────────── --}
  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Platform
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      Interview Reminder
    </h1>
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:#fef3c7;color:#92400e;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Upcoming Interview</span>
  </div>

  {-- ── Body ─────────────────────────────────────────── --}
  <div style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:15px;color:#374151;">Dear <strong>{{ $applicant->first_name }} {{ $applicant->last_name }}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      This is a friendly reminder that your interview for the position at <strong>ARTMS</strong> is coming up soon. Please review your schedule details below:
    </p>
    
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;width:38%;border-bottom:1px solid #e5e7eb;">Date &amp; Time</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          {{ \Carbon\Carbon::parse($interview->scheduled_at)->format('l, F d, Y 	 g:i A') }}
        </td>
      </tr>
      @if($interview->location)
      <tr>
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Location</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">{{ $interview->location }}</td>
      </tr>
      @endif
      @if($interview->meeting_link)
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;">Video Room Link</td>
        <td style="padding:12px 16px;font-size:14px;">
          <a href="{{ $interview->meeting_link }}" style="color:#2563eb;word-break:break-all;font-weight:600;">
            {{ $interview->meeting_link }}
          </a>
        </td>
      </tr>
      @endif
    </table>

    @if($interview->meeting_link)
    <div style="margin-top:28px;text-align:center;">
      <a href="{{ $interview->meeting_link }}"
         style="display:inline-block;padding:14px 32px;background:#1e3a5f;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
        🎥 Join Video Interview Room
      </a>
    </div>
    @endif
    <p style="margin-top:28px;font-size:14px;color:#4b5563;line-height:1.6;">
      Please make sure to arrive or connect on time. Good luck with your interview!
    </p>
    <p style="margin-top:24px;font-size:14px;color:#374151;">
      Best regards,<br>
      <strong>ARTMS Team</strong>
    </p>
  </div>

  {-- ── Footer ───────────────────────────────────────── --}
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.05em;">
      ARTMS — AI Recruitment and Talent Management System<br>
      &copy; { date('Y') } All rights reserved.
    </p>
  </div>

</div>
</body>
</html>
