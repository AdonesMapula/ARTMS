<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to ARTMS</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #111A62; }
        .content { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .password-box { background: #fff; border: 1px dashed #d1d5db; padding: 10px; text-align: center; font-size: 18px; font-family: monospace; font-weight: bold; margin: 20px 0; color: #111A62; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #111A62; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ARTMS</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $user->first_name }}</strong>,</p>
            <p>An administrator has created an account for you on the ARTMS platform.</p>
            <p>Your temporary password is:</p>
            <div class="password-box">
                {{ $temporaryPassword }}
            </div>
            <p>For your security, you must verify your email address and set a new password before you can access the system.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $setupUrl }}" class="btn">Setup My Account</a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">If the button above does not work, copy and paste this link into your browser:<br>
            <a href="{{ $setupUrl }}" style="color: #111A62; word-break: break-all;">{{ $setupUrl }}</a></p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ARTMS. All rights reserved.
        </div>
    </div>
</body>
</html>
