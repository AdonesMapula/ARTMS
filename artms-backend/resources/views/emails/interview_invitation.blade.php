<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interview Invitation — ARTMS</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  {{-- ── Header Banner ────────────────────────────────── --}}
  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;">
      ARTMS Recruitment
    </p>
    <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
      Interview Invitation
    </h1>
    {{-- Dynamic stage badge --}}
    @php
      $stageLabels = [
        'interview_1' => 'Initial Interview',
        'interview_2' => 'Second Interview',
        'final'       => 'Final Interview',
      ];
      $stageLabel = $stageLabels[$interview->interview_stage] ?? ucwords(str_replace('_', ' ', $interview->interview_stage));

      $stageBg = match($interview->interview_stage) {
        'interview_1' => '#dbeafe',
        'interview_2' => '#fef3c7',
        'final'       => '#d1fae5',
        default       => '#e0e7ff',
      };
      $stageColor = match($interview->interview_stage) {
        'interview_1' => '#1e40af',
        'interview_2' => '#92400e',
        'final'       => '#065f46',
        default       => '#3730a3',
      };
    @endphp
    <span style="display:inline-block;margin-top:14px;padding:5px 16px;background:{{ $stageBg }};color:{{ $stageColor }};border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.04em;">
      {{ $stageLabel }}
    </span>
  </div>

  {{-- ── Body ─────────────────────────────────────────── --}}
  <div style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:15px;color:#374151;">Dear <strong>{{ $applicant->first_name }} {{ $applicant->last_name }}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Congratulations! We are pleased to invite you to the
      <strong style="color:{{ $stageColor }};">{{ $stageLabel }}</strong>
      for the position you applied for at <strong>ARTMS</strong>.
      Please review the details below and take note of the schedule.
    </p>

    {{-- ── Detail Table ─────────────────────────────── --}}
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;width:38%;border-bottom:1px solid #e5e7eb;">Interview Stage</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">
          <span style="display:inline-block;padding:3px 12px;background:{{ $stageBg }};color:{{ $stageColor }};border-radius:999px;font-size:13px;font-weight:700;">
            {{ $stageLabel }}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Date &amp; Time</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          {{ \Carbon\Carbon::parse($interview->scheduled_at)->format('l, F d, Y \a\t g:i A') }}
        </td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Interview Format</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          {{ ucwords(str_replace('_', ' ', $interview->interview_type)) }}
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
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Video Room Link</td>
        <td style="padding:12px 16px;font-size:14px;border-bottom:1px solid #e5e7eb;">
          <a href="{{ $interview->meeting_link }}" style="color:#2563eb;word-break:break-all;font-weight:600;">
            {{ $interview->meeting_link }}
          </a>
        </td>
      </tr>
      @endif
      @if($interview->contact_email)
      <tr>
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">HR Contact Email</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">
          <a href="mailto:{{ $interview->contact_email }}" style="color:#2563eb;text-decoration:none;font-weight:600;">
            {{ $interview->contact_email }}
          </a>
        </td>
      </tr>
      @endif
      @if($interview->contact_number)
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-weight:700;font-size:13px;color:#6b7280;">HR Contact Number</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;">
          {{ $interview->contact_number }}
        </td>
      </tr>
      @endif
    </table>

    {{-- ── Special Preparation Notes & Instructions Box ───────────────── --}}
    @if($interview->notes)
    <div style="margin-top:24px;padding:18px 20px;background:#f0f9ff;border-left:4px solid #0284c7;border-radius:6px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;">
        📋 Special Instructions &amp; What to Bring
      </p>
      <p style="margin:0;font-size:14px;color:#0c4a6e;line-height:1.6;white-space:pre-line;">
        {{ $interview->notes }}
      </p>
    </div>
    @endif

    {{-- ── CTA Button ───────────────────────────────── --}}
    <div style="margin-top:28px;text-align:center;">
      @if($interview->meeting_link)
        <a href="{{ $interview->meeting_link }}"
           style="display:inline-block;padding:14px 32px;background:#1e3a5f;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
          🎥 Join Video Interview Room
        </a>
      @else
        <a href="{{ config('app.url') }}/api/interviews/{{ $interview->id }}/confirm"
           style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
          ✅ Confirm My Attendance
        </a>
      @endif
    </div>

    <p style="margin-top:28px;font-size:13px;color:#6b7280;line-height:1.6;">
      If you have any questions or need to reschedule, please reach out to us at 
      @if($interview->contact_email)
        <strong>{{ $interview->contact_email }}</strong>
      @else
        our HR team
      @endif
      @if($interview->contact_number)
        ({{ $interview->contact_number }}).
      @else
        directly.
      @endif
      We look forward to meeting you!
    </p>

    <p style="margin-top:24px;font-size:14px;color:#374151;">
      Best regards,<br>
      <strong>ARTMS Recruitment Team</strong>
    </p>
  </div>

  {}
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.05em;">
      ARTMS — AI Recruitment and Talent Management System
    </p>
  </div>

</div>
</body>
</html>

