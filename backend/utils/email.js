const nodemailer = require('nodemailer');

// Create transporter
let transporter = null;

const initializeTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email service initialized');
  } else {
    console.log('⚠️  Email credentials not configured. OTPs will be logged to console only.');
  }
};

// Initialize on module load
initializeTransporter();

exports.sendOTP = async (email, otp) => {
  // Always log OTP to console for development/debugging
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 OTP EMAIL`);
  console.log(`To: ${email}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Valid for: 10 minutes`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (transporter) {
    try {
      const mailOptions = {
        from: {
          name: 'MegaHealth Platform',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Your OTP Code - MegaHealth Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🏥 MegaHealth Platform</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; margin-top: 0;">Your Verification Code</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                Thank you for registering with MegaHealth Platform. Please use the following OTP code to verify your email address:
              </p>
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <h1 style="color: #14b8a6; font-size: 48px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                © 2025 MegaHealth Platform. All rights reserved.
              </p>
            </div>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
      console.log('⚠️  OTP is logged above. User can still verify using console OTP.');
      return false;
    }
  } else {
    console.log('⚠️  Email not configured. User must use OTP from console.');
    return false;
  }
};

exports.sendDoctorApproval = async (email, name, status, reason = '') => {
  // Always log to console
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 DOCTOR APPROVAL EMAIL`);
  console.log(`To: ${email}`);
  console.log(`Doctor: ${name}`);
  console.log(`Status: ${status.toUpperCase()}`);
  if (reason) console.log(`Reason: ${reason}`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (transporter) {
    try {
      const mailOptions = {
        from: {
          name: 'MegaHealth Platform',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: status === 'approved' 
          ? '🎉 Doctor Registration Approved - MegaHealth Platform'
          : '📋 Doctor Registration Status Update - MegaHealth Platform',
        html: status === 'approved' 
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1e293b; margin-top: 0;">Your Registration Has Been Approved</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                  Dear Dr. ${name},
                </p>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                  We are pleased to inform you that your doctor registration has been <strong style="color: #10b981;">approved</strong>! 
                  You can now access all doctor features on the MegaHealth Platform.
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <h3 style="color: #166534; margin-top: 0;">What's Next?</h3>
                  <ul style="color: #166534; line-height: 1.8;">
                    <li>Login to your account</li>
                    <li>Create your availability slots</li>
                    <li>Update your consultation fees and profile</li>
                    <li>Start accepting patient consultations</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                            font-weight: 600; font-size: 16px;">
                    Login to Dashboard
                  </a>
                </div>
                <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                  If you have any questions or need assistance, please don't hesitate to contact our support team.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                  © 2025 MegaHealth Platform. All rights reserved.
                </p>
              </div>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">📋 Registration Status Update</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1e293b; margin-top: 0;">Registration Not Approved</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                  Dear Dr. ${name},
                </p>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                  Thank you for your interest in joining the MegaHealth Platform. After careful review, 
                  we regret to inform you that your registration was not approved at this time.
                </p>
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <h3 style="color: #991b1b; margin-top: 0;">Reason:</h3>
                  <p style="color: #991b1b; margin: 0; font-size: 15px;">
                    ${reason || 'Please contact support for more details.'}
                  </p>
                </div>
                <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                  If you believe this decision was made in error or if you have additional information to provide, 
                  please contact our support team. We're here to help!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="mailto:${process.env.EMAIL_USER}" 
                     style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                            color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                            font-weight: 600; font-size: 16px;">
                    Contact Support
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                  © 2025 MegaHealth Platform. All rights reserved.
                </p>
              </div>
            </div>
          `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`✅ ${status === 'approved' ? 'Approval' : 'Rejection'} email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send ${status} email to ${email}:`, error.message);
      console.log('⚠️  Email notification logged above. Admin action completed but email failed.');
      return false;
    }
  } else {
    console.log('⚠️  Email not configured. Notification logged above but not sent.');
    return false;
  }
};
