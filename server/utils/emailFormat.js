const emailFormat = (text)=>{
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edustack - OTP Verification</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #F7F7F7; /* Soft Off-White */
            font-family: 'Arial', sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #FFFFFF; /* Pure White */
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            text-align: center;
            border-top: 6px solid #3A0CA3;
        }
        .header {
            padding: 20px;
            font-size: 24px;
            font-weight: bold;
            color: #3A0CA3;
        }
        .content {
            padding: 20px;
            color: #333333;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #3A0CA3;
            background: #E3DFFD;
            padding: 16px 32px;
            display: inline-block;
            border-radius: 10px;
            margin: 20px 0;
            letter-spacing: 3px;
        }
        .btn {
            display: inline-block;
            padding: 14px 30px;
            background: #FF6700;
            color: #ffffff;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            transition: background 0.3s ease-in-out;
        }
        .btn:hover {
            background: #E55D00;
        }
        .footer {
            font-size: 14px;
            color: #555555;
            margin-top: 20px;
        }
        .footer a {
            color: #3A0CA3;
            text-decoration: none;
        }

        /* Responsive Styles */
        @media screen and (max-width: 600px) {
            .container {
                width: 90%;
                padding: 20px;
            }
            .otp-code {
                font-size: 28px;
                padding: 14px 28px;
                letter-spacing: 2px;
            }
            .btn {
                font-size: 16px;
                padding: 12px 24px;
            }
            .header {
                font-size: 22px;
            }
            .content h2 {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            Welcome to Edustack
        </div>
        
        <!-- Content -->
        <div class="content">
            <h2>Your OTP Code for Verification</h2>
            <p>Hello,</p>
            <p>Use the following One-Time Password (OTP) to verify your Edustack account. This code is valid for **10 minutes**.</p>
            <div class="otp-code">${text}</div>
            <p>If you did not request this OTP, please ignore this email.</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing Edustack</p>
        </div>
    </div>
</body>
</html>`

}
module.exports = {emailFormat};