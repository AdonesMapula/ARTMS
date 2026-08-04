<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #060F5A; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; tracking: 1.5px; opacity: 0.8; }
        .content { padding: 32px 28px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; background: #e0e7ff; color: #3730a3; }
        .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; }
        .message-box { background: #f1f5f9; border-left: 4px solid #111A62; padding: 16px; border-radius: 8px; font-size: 14px; color: #334155; margin: 20px 0; }
        .btn-wrapper { text-align: center; margin: 32px 0 16px 0; }
        .btn { display: inline-block; padding: 12px 28px; background-color: #F97316; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3); }
        .footer { background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ARTMS PLATFORM</h1>
            <p>System Status Notification</p>
        </div>
        <div class="content">
            <div class="badge">{{ strtoupper($category ?? 'alert') }}</div>
            <h2 class="title">{{ $title }}</h2>
            
            <div class="message-box">
                {{ $messageText }}
            </div>

            <p style="font-size: 13px; color: #64748b;">This notification was generated automatically by the ARTMS System.</p>

            @if($actionUrl)
            <div class="btn-wrapper">
                <a href="{{ $actionUrl }}" class="btn">View Details in ARTMS</a>
            </div>
            @endif
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ARTMS Recruitment & Manpower System. All rights reserved.
        </div>
    </div>
</body>
</html>
