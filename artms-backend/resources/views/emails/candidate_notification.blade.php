<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $title }} — ARTMS Recruitment</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">

  {{-- ── Header Banner ────────────────────────────────── --}}
  <div style="background:linear-gradient(135deg,#060f5a 0%,#1e3a8a 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Recruitment Team
    </p>
    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">
      {{ $title }}
    </h1>
    @php
      $badgeBg = match(strtolower($category ?? 'application')) {
        'interview'   => '#fef3c7',
        'offer'       => '#d1fae5',
        'alert'       => '#fee2e2',
        default       => '#dbeafe',
      };
      $badgeColor = match(strtolower($category ?? 'application')) {
        'interview'   => '#92400e',
        'offer'       => '#065f46',
        'alert'       => '#991b1b',
        default       => '#1e40af',
      };
    @endphp
    <span style="display:inline-block;margin-top:14px;padding:4px 14px;background:{{ $badgeBg }};color:{{ $badgeColor }};border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.04em;">
      {{ strtoupper($category ?? 'Application Update') }}
    </span>
  </div>

  {{-- ── Content Body ─────────────────────────────────── --}}
  <div style="padding:36px 40px;">
    <div style="background:#f8fafc;border-left:4px solid #060f5a;padding:20px;border-radius:8px;margin:0 0 24px 0;font-size:15px;color:#334155;line-height:1.65;">
      {!! nl2br(e($messageText)) !!}
    </div>

    <div style="background:#f1f5f9;border-radius:10px;padding:16px 20px;margin-top:20px;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">
        ℹ️ <strong>Application Notice:</strong> This is an automated update regarding your application. Applicants do not require a login account to receive updates.
      </p>
    </div>

    @if(!empty($publicLink) && str_starts_with($publicLink, 'http'))
    <div style="margin-top:24px;text-align:center;">
      <a href="{{ $publicLink }}"
         style="display:inline-block;padding:12px 28px;background:#060f5a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
        View Information
      </a>
    </div>
    @endif

    <p style="margin-top:28px;font-size:14px;color:#475569;line-height:1.6;">
      If you have any questions, feel free to reply directly to our recruitment team.
    </p>

    <p style="margin-top:20px;font-size:14px;color:#1e293b;">
      Best regards,<br>
      <strong style="color:#060f5a;">ARTMS Recruitment Team</strong>
    </p>
  </div>

  {{-- ── Footer ───────────────────────────────────────── --}}
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;color:#64748b;font-weight:600;">
      ARTMS — AI Recruitment and Talent Management System
    </p>
    <p style="margin:0;font-size:11px;color:#94a3b8;">
      Explore more public opportunities: <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/jobs" style="color:#2563eb;text-decoration:none;font-weight:600;">Careers Portal</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
      &copy; {{ date('Y') }} ARTMS. All rights reserved.
    </p>
  </div>

</div>
</body>
</html>
