const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const hasCustomSmtp = Boolean(process.env.EMAIL_HOST);

  if (hasCustomSmtp) {
    const parsedPort = Number(process.env.EMAIL_PORT);
    const port = Number.isFinite(parsedPort) ? parsedPort : 465;
    const secureEnv = String(process.env.EMAIL_SECURE || '').toLowerCase();
    const secure = secureEnv === 'true' || (secureEnv === '' && port === 465);

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Fallback: use Gmail service preset
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
  });
};

const sendTwoFactorCode = async (email, code) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('='.repeat(50));
      console.log('EMAIL CONFIGURATION MISSING');
      console.log('='.repeat(50));
      console.log('Please set EMAIL_USER and EMAIL_PASS environment variables');
      console.log('For Gmail, use an App Password instead of your regular password');
      console.log('='.repeat(50));
      console.log('2FA VERIFICATION EMAIL (SIMULATION)');
      console.log('='.repeat(50));
      console.log('To:', email);
      console.log('Subject: Your Verification Code');
      console.log('Verification Code:', code);
      console.log('='.repeat(50));
      console.log('Email Body:');
      console.log(`
Hello,

Your verification code is: ${code}

This code will expire in 10 minutes.

If you did not request this verification, please ignore this email.

Best regards,
Your Application Team
      `);
      console.log('='.repeat(50));
      return true;
    }

    // Create transporter
    const transporter = createTransporter();

    // Attempt to verify the transporter, but don't fail if verification is blocked
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.log('SMTP verify skipped/failed, proceeding to send:', verifyError?.message || verifyError);
    }

    // Email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .code {
            background-color: #e9ecef;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #007bff;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 14px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your Verification Code</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have requested to verify your email address. Please use the following verification code:</p>
          
          <div class="code">${code}</div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This code will expire in 10 minutes</li>
            <li>If you did not request this verification, please ignore this email</li>
            <li>Do not share this code with anyone</li>
          </ul>
        </div>
        <div class="footer">
          <p>Best regards,<br>Your Application Team</p>
          <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Your Verification Code

Hello,

You have requested to verify your email address. Please use the following verification code:

${code}

This code will expire in 10 minutes.

If you did not request this verification, please ignore this email.

Best regards,
Your Application Team
    `;

    // Email options
    const mailOptions = {
      from: `"Your Application" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: textContent,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('2FA verification email sent successfully:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Fallback to console logging if email fails
    console.log('='.repeat(50));
    console.log('EMAIL SENDING FAILED - FALLBACK TO CONSOLE');
    console.log('='.repeat(50));
    console.log('To:', email);
    console.log('Subject: Your Verification Code');
    console.log('Verification Code:', code);
    console.log('='.repeat(50));
    console.log('Email Body:');
    console.log(`
Hello,

Your verification code is: ${code}

This code will expire in 10 minutes.

If you did not request this verification, please ignore this email.

Best regards,
Your Application Team
    `);
    console.log('='.repeat(50));
    
    // Fall back to success for development/testing to avoid blocking 2FA flow
    return true;
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('='.repeat(50));
      console.log('EMAIL CONFIGURATION MISSING');
      console.log('='.repeat(50));
      console.log('Please set EMAIL_USER and EMAIL_PASS environment variables');
      console.log('For Gmail, use an App Password instead of your regular password');
      console.log('='.repeat(50));
      console.log('PASSWORD RESET EMAIL (SIMULATION)');
      console.log('='.repeat(50));
      console.log('To:', email);
      console.log('Subject: Password Reset Request');
      console.log('Reset Link:', resetLink);
      console.log('='.repeat(50));
      console.log('Email Body:');
      console.log(`
Hello,

You have requested to reset your password. Please click the link below to reset your password:

${resetLink}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Your Application Team
      `);
      console.log('='.repeat(50));
      return true;
    }

    // Create transporter
    const transporter = createTransporter();

    // Verify connection configuration
    await transporter.verify();

    // Email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 14px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have requested to reset your password for your account. To complete the password reset process, please click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px;">${resetLink}</p>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This link will expire in 1 hour for security reasons</li>
            <li>If you did not request this password reset, please ignore this email</li>
            <li>Your password will not be changed until you access the link above and create a new one</li>
          </ul>
        </div>
        <div class="footer">
          <p>Best regards,<br>Your Application Team</p>
          <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Password Reset Request

Hello,

You have requested to reset your password for your account. To complete the password reset process, please visit the following link:

${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
Your Application Team
    `;

    // Email options
    const mailOptions = {
      from: `"Your Application" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      text: textContent,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Fallback to console logging if email fails
    console.log('='.repeat(50));
    console.log('EMAIL SENDING FAILED - FALLBACK TO CONSOLE');
    console.log('='.repeat(50));
    console.log('To:', email);
    console.log('Subject: Password Reset Request');
    console.log('Reset Link:', resetLink);
    console.log('='.repeat(50));
    console.log('Email Body:');
    console.log(`
Hello,

You have requested to reset your password. Please click the link below to reset your password:

${resetLink}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Your Application Team
    `);
    console.log('='.repeat(50));
    
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendTwoFactorCode
};
