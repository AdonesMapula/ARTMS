<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Interview Invitation — ARTMS</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
    <h2 style="color:#1e3a5f;">Interview Invitation</h2>
    <p>Dear <strong>{{ $applicant->first_name }} {{ $applicant->last_name }}</strong>,</p>
    
    <p>{{ $message }}</p>
    
    <p>Our HR team will be contacting you soon to schedule your interview. Please keep an eye on your email and phone for further communication.</p>
    
    <div style="background:#f0f7ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px;">
        <p style="margin:0;"><strong>Application ID:</strong> {{ $applicant->application_id }}</p>
        <p style="margin:8px 0 0 0;"><strong>Position:</strong> {{ $job_title }}</p>
    </div>
    
    <p>We look forward to meeting you!</p>
    
    <p style="margin-top:32px;">Best regards,<br><strong>ARTMS Recruitment Team</strong></p>
    
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
    <p style="font-size:12px;color:#999;text-align:center;">ARTMS — AI Recruitment and Talent Management System</p>
</div>
</body>
</html>
