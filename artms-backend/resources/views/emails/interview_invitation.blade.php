<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Interview Invitation — ARTMS</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
    <h2 style="color:#1e3a5f;">Interview Invitation</h2>
    <p>Dear <strong>{{ $applicant->first_name }} {{ $applicant->last_name }}</strong>,</p>
    <p>Congratulations! You have been shortlisted for an interview.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Date & Time</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ \Carbon\Carbon::parse($interview->scheduled_at)->format('M d, Y h:i A') }}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Interview Type</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ ucfirst(str_replace('_', ' ', $interview->interview_type)) }}</td></tr>
        @if($interview->location)
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Location</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ $interview->location }}</td></tr>
        @endif
        @if($interview->meeting_link)
        <tr><td style="padding:8px;font-weight:bold;">Meeting Link</td><td style="padding:8px;"><a href="{{ $interview->meeting_link }}">{{ $interview->meeting_link }}</a></td></tr>
        @endif
    </table>
    <p style="margin-top:16px;">Please confirm your attendance by clicking the link below:</p>
    <a href="{{ config('app.url') }}/api/interviews/{{ $interview->id }}/confirm" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:4px;margin-top:8px;">Confirm Attendance</a>
    <hr style="margin-top:32px;">
    <p style="font-size:12px;color:#999;">ARTMS Automated Recruitment and Talent Management System</p>
</div>
</body>
</html>
