const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Certificate type display names
const certificateTypeNames = {
  'barangay_clearance': 'Barangay Clearance',
  'certificate_of_indigency': 'Certificate of Indigency',
  'barangay_residency': 'Barangay Residency Certificate'
};

/**
 * Send workflow notification email to assigned approvers
 */
const sendWorkflowNotification = async ({ 
  recipientEmail, 
  recipientName, 
  certificateType, 
  referenceNumber, 
  applicantName, 
  stepName,
  requestId 
}) => {
  try {
    const transporter = createTransporter();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const requestLink = `${baseUrl}/dashboard/requests/${requestId}`;
    const certificateName = certificateTypeNames[certificateType] || certificateType;

    const mailOptions = {
      from: `"Barangay Iba O' Este" <${process.env.SMTP_USER || 'noreply@ibaoeste.gov.ph'}>`,
      to: recipientEmail,
      subject: `Action Required: New ${certificateName} Request - ${referenceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate Request Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e40af 0%, #16a34a 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Barangay Iba O' Este</h1>
                      <p style="color: #e0e7ff; margin: 5px 0 0 0; font-size: 14px;">Calumpit, Bulacan</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
                        🔔 Action Required
                      </h2>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Dear <strong>${recipientName}</strong>,
                      </p>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        A new <strong>${certificateName}</strong> request has been submitted and requires your action at the <strong>"${stepName}"</strong> stage.
                      </p>
                      
                      <!-- Request Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📋 Request Details</h3>
                            <table width="100%" cellpadding="5" cellspacing="0">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; width: 140px;">Reference Number:</td>
                                <td style="color: #1f2937; font-size: 14px; font-weight: bold;">${referenceNumber}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Certificate Type:</td>
                                <td style="color: #1f2937; font-size: 14px; font-weight: bold;">${certificateName}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Applicant Name:</td>
                                <td style="color: #1f2937; font-size: 14px; font-weight: bold;">${applicantName}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Current Step:</td>
                                <td style="color: #1f2937; font-size: 14px; font-weight: bold;">${stepName}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Action Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${requestLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                              View Request & Take Action
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If the button above doesn't work, copy and paste this link into your browser:<br>
                        <a href="${requestLink}" style="color: #2563eb; word-break: break-all;">${requestLink}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                        This is an automated message from the Barangay Iba O' Este Portal.<br>
                        Please do not reply to this email.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0; text-align: center;">
                        © ${new Date().getFullYear()} Barangay Iba O' Este, Calumpit, Bulacan
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Action Required: New ${certificateName} Request

Dear ${recipientName},

A new ${certificateName} request has been submitted and requires your action at the "${stepName}" stage.

Request Details:
- Reference Number: ${referenceNumber}
- Certificate Type: ${certificateName}
- Applicant Name: ${applicantName}
- Current Step: ${stepName}

Please review and take action: ${requestLink}

This is an automated message from the Barangay Iba O' Este Portal.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple users
 */
const sendWorkflowNotifications = async ({ 
  recipients, // Array of { email, name }
  certificateType, 
  referenceNumber, 
  applicantName, 
  stepName,
  requestId 
}) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendWorkflowNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      certificateType,
      referenceNumber,
      applicantName,
      stepName,
      requestId
    });
    results.push({ ...result, email: recipient.email });
  }
  
  return results;
};

module.exports = {
  sendWorkflowNotification,
  sendWorkflowNotifications
};
