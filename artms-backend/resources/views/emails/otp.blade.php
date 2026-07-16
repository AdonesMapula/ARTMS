<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Reset OTP — ARTMS</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
<div style="max-width:480px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
    <h2 style="color:#1e3a5f;">ARTMS — Password Reset</h2>
    <p>Hello, <strong>{{ $user->name }}</strong>,</p>
    <p>Your One-Time Password (OTP) for password reset is:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e3a5f;text-align:center;padding:16px 0;">
        {{ $otp }}
    </div>
    <p>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <hr>
    <p style="font-size:12px;color:#999;">ARTMS Automated Recruitment and Talent Management System</p>
</div>
</body>
</html>
