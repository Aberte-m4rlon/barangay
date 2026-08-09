import 'dotenv/config';
import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send approval email
export const sendApprovalEmail = async (recipientEmail, recipientName, purpose) => {
  try {
    const mailOptions = {
      from: `"Barangay Office" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '✅ Indigency Certificate Request Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { background: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Request Approved!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${recipientName}</strong>,</p>
              
              <p>We are pleased to inform you that your indigency certificate request has been <strong>approved</strong>.</p>
              
              <div class="status-badge">✅ APPROVED</div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #16a34a;">Request Details:</h3>
                <p><strong>Purpose:</strong> ${purpose}</p>
                <p><strong>Status:</strong> Approved</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Visit the barangay office to claim your certificate</li>
                <li>Bring a valid ID for verification</li>
                <li>Office hours: Monday to Friday, 8:00 AM - 5:00 PM</li>
              </ul>
              
              <p>If you have any questions, please don't hesitate to contact our office.</p>
              
              <div class="footer">
                <p>This is an automated message from the Barangay Office.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    return false;
  }
};

// Send rejection email
export const sendRejectionEmail = async (recipientEmail, recipientName, purpose) => {
  try {
    const mailOptions = {
      from: `"Barangay Office" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '❌ Indigency Certificate Request Update',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { background: #fee2e2; color: #991b1b; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Request Status Update</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${recipientName}</strong>,</p>
              
              <p>We regret to inform you that your indigency certificate request could not be approved at this time.</p>
              
              <div class="status-badge">❌ NOT APPROVED</div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #dc2626;">Request Details:</h3>
                <p><strong>Purpose:</strong> ${purpose}</p>
                <p><strong>Status:</strong> Rejected</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>Visit the barangay office for more information</li>
                <li>Bring necessary documents for verification</li>
                <li>You may reapply after addressing the requirements</li>
              </ul>
              
              <p>For questions or clarifications, please visit our office during business hours (Monday to Friday, 8:00 AM - 5:00 PM).</p>
              
              <div class="footer">
                <p>This is an automated message from the Barangay Office.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    return false;
  }
};

// Send notification to secretary about new indigency request
export const sendSecretaryNotification = async (requestDetails, secretaryEmail) => {
  try {
    const { full_name, address, email, purpose, date_requested } = requestDetails;
    
    // Use provided secretary email or fallback to configured email
    const recipientEmail = secretaryEmail || process.env.SECRETARY_EMAIL || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `"Barangay System" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '🔔 New Indigency Certificate Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-badge { background: #dbeafe; color: #1e40af; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 5px; }
            .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; width: 120px; color: #6b7280; }
            .detail-value { flex: 1; color: #111827; }
            .button { background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Request Alert</h1>
            </div>
            <div class="content">
              <div class="alert-badge">📋 NEW INDIGENCY REQUEST</div>
              
              <p>A new indigency certificate request has been submitted and requires your attention.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #2563eb;">Request Details:</h3>
                
                <div class="detail-row">
                  <div class="detail-label">Name:</div>
                  <div class="detail-value">${full_name}</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">Address:</div>
                  <div class="detail-value">${address}</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">Email:</div>
                  <div class="detail-value">${email || 'Not provided'}</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">Purpose:</div>
                  <div class="detail-value">${purpose}</div>
                </div>
                
                <div class="detail-row" style="border-bottom: none;">
                  <div class="detail-label">Date:</div>
                  <div class="detail-value">${date_requested}</div>
                </div>
              </div>
              
              <div class="urgent">
                <strong>⚡ Action Required:</strong> Please review and process this request in the secretary dashboard.
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/secretary/dashboard" class="button">
                  View in Dashboard →
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Quick Actions:</strong><br>
                • Review the request details<br>
                • Verify resident information<br>
                • Approve or reject the request<br>
                • Applicant will be notified via email
              </p>
              
              <div class="footer">
                <p>This is an automated notification from the Barangay Operations and Records System.</p>
                <p>Login to your dashboard to manage this request.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Secretary notification sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending secretary notification:', error);
    return false;
  }
};

export default transporter;
