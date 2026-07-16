<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Application — ARTMS</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
    <h2 style="color:#1e3a5f;">New Application Received</h2>
    <p>A new application has been submitted.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Application ID</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ $applicant->application_id }}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ $applicant->first_name }} {{ $applicant->last_name }}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">{{ $applicant->email }}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Applied</td><td style="padding:8px;">{{ $applicant->created_at->format('M d, Y h:i A') }}</td></tr>
    </table>
    <p style="margin-top:24px;">Please log in to ARTMS to review this application.</p>
    <hr>
    <p style="font-size:12px;color:#999;">ARTMS Automated Recruitment and Talent Management System</p>
</div>
</body>
</html>
