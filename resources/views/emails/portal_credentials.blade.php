<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Portal Credentials</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #073066 0%, #1e3a8a 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #073066;
        }
        .info-box {
            background-color: #f0f4ff;
            border-left: 4px solid #073066;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .credentials {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .credential-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 16px;
            font-weight: 600;
            color: #073066;
            margin-bottom: 15px;
            word-break: break-all;
        }
        .credential-value:last-child {
            margin-bottom: 0;
        }
        .button {
            display: inline-block;
            background-color: #073066;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
            text-align: center;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #052247;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
        }
        .footer a {
            color: #073066;
            text-decoration: none;
        }
        ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Student Portal Access Credentials</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hello {{ $studentName }},</div>

            <p>Congratulations! Your application has been approved and you are now eligible to access the Student Portal. Please find your login credentials below:</p>

            <!-- Credentials Box -->
            <div class="credentials">
                <div>
                    <div class="credential-label">Portal Username (Email)</div>
                    <div class="credential-value">{{ $credential->username }}</div>
                </div>
                <div>
                    <div class="credential-label">Temporary Password</div>
                    <div class="credential-value">{{ $temporaryPassword }}</div>
                </div>
            </div>

            <!-- Portal Access Info -->
            <div class="info-box">
                <strong>Portal URL:</strong><br>
                <a href="{{ $portalUrl }}" style="color: #073066; text-decoration: underline;">{{ $portalUrl }}</a>
            </div>

            <!-- Important Instructions -->
            <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul style="margin: 10px 0 0 0;">
                    <li>This is a temporary password. You must change it on your first login.</li>
                    <li>Keep your credentials confidential and secure.</li>
                    <li>Do not share your login information with anyone.</li>
                    <li>Clear your browser cache after logging out on shared computers.</li>
                </ul>
            </div>

            <!-- Next Steps -->
            <h3 style="color: #073066; margin-top: 30px;">Next Steps:</h3>
            <ol>
                <li>Visit the Student Portal using the URL above</li>
                <li>Log in with your username and temporary password</li>
                <li>Change your password to something secure</li>
                <li>Complete your enrollment information</li>
                <li>Review your application status and documents</li>
            </ol>

            <center>
                <a href="{{ $portalUrl }}" class="button">Access Student Portal</a>
            </center>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions or need assistance, please contact the admissions office at <a href="mailto:admissions@slu.edu.ph" style="color: #073066;">admissions@slu.edu.ph</a>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                This is an automated message. Please do not reply to this email.<br>
                Saint Louis University - Student Portal<br>
                © {{ date('Y') }} All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
