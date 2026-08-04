<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Application Status Update — ARTMS</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #060F5A; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; tracking: 1.5px; opacity: 0.8; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .info-card { background: #f8fafc; border-left: 4px solid #94a3b8; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
        .info-card p { margin: 4px 0; color: #334155; }
        .footer { background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ARTMS RECRUITMENT</h1>
            <p>Application Update</p>
        </div>
        <div class="content">
            <p class="greeting">Dear {{ $applicant->first_name }} {{ $applicant->last_name }},</p>
            
            <p>Thank you for taking the time to apply for the <strong>{{ $job_title }}</strong> position at ARTMS and for your interest in joining our organization.</p>
            
            <p>We have carefully reviewed your application, qualifications, and background. While we were impressed with your credentials, we regret to inform you that we have chosen to proceed with other candidates whose profiles more closely align with the specific requirements for this role at this time.</p>

            <div class="info-card">
                <p><strong>Application Reference:</strong> {{ $applicant->application_id }}</p>
                <p><strong>Position Applied:</strong> {{ $job_title }}</p>
                <p><strong>Status:</strong> Screening Complete</p>
            </div>

            <p>Please note that this decision is specific to this role only. We encourage you to keep an eye on our career portal for future job opportunities that match your expertise.</p>

            <p>We sincerely appreciate your interest in ARTMS and wish you every success in your professional endeavors.</p>

            <p style="margin-top: 28px; font-size: 14px;">
                Warm regards,<br>
                <strong style="color: #060F5A;">ARTMS Recruitment Team</strong>
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ARTMS Recruitment & Talent Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
