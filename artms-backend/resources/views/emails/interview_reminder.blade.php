<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Interview Reminder — ARTMS</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
    <h2 style="color:#1e3a5f;">Interview Reminder</h2>
    <p>Dear <strong>{{ $applicant->first_name }}</strong>,</p>
    <p>This is a reminder that your interview is coming up soon.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Date & Time</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ \Carbon\Carbon::parse($interview->scheduled_at)->format('M d, Y h:i A') }}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Type</td><td style="padding:8px;">{{ ucfirst(str_replace('_', ' ', $interview->interview_type)) }}</td></tr>
    </table>
    <p style="margin-top:16px;">Please arrive/connect on time. Good luck!</p>
    <hr>
    <p style="font-size:12px;color:#999;">ARTMS Automated Recruitment and Talent Management System</p>
</div>
</body>
</html>
