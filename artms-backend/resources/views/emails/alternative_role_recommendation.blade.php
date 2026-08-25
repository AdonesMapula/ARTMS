<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Application Status & Recommendations — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  {{-- ── Header Banner ────────────────────────────────── --}}
  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Recruitment
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      Application Status
    </h1>
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:#fef3c7;color:#92400e;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Alternative Recommendations</span>
  </div>

  {{-- ── Body ─────────────────────────────────────────── --}}
  <div style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:15px;color:#374151;">Dear <strong>{{ $applicant->first_name }} {{ $applicant->last_name }}</strong>,</p>
    
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Thank you for applying for the <strong>{{ $job_title }}</strong> position at <strong>ARTMS</strong>. 
      While we were impressed with your credentials, we have decided to proceed with other candidates whose profiles more closely align with the specific requirements of this role.
    </p>

    <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:20px;border-radius:8px;margin:24px 0;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#1e3a5f;font-weight:700;">We found roles that match your profile!</h3>
      <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
        Our AI Recruitment Assistant has reviewed your resume and identified other open positions at ARTMS where your skills and experience would be a <strong>strong fit</strong>:
      </p>

      @foreach($recommendedJobs as $job)
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:12px;">
          <h4 style="margin:0 0 6px;font-size:15px;color:#111827;">{{ $job->jobLibrary->job_title ?? $job->manpowerRequest->position_needed }}</h4>
          <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.5;">
            <em>"{{ $job->ai_reason }}"</em>
          </p>
          <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/jobs" style="font-size:13px;color:#2563eb;text-decoration:none;font-weight:600;">View & Apply &rarr;</a>
        </div>
      @endforeach
    </div>

    <p style="margin-top:20px;font-size:14px;color:#4b5563;line-height:1.6;">
      We encourage you to explore these alternative opportunities. We appreciate your interest in joining our team and wish you the best in your career journey!
    </p>
    
    <p style="margin-top:24px;font-size:14px;color:#374151;">
      Best regards,<br>
      <strong>ARTMS Recruitment Team</strong>
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
