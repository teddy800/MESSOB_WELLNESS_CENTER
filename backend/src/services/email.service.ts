import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendAppointmentReminder(
  recipientEmail: string,
  customerName: string,
  appointmentId: string,
  appointmentTime: string,
  reason: string
): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: env.SMTP_FROM,
      to: recipientEmail,
      subject: 'Appointment Reminder - Mesob Wellness',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #001f3f 0%, #003d7a 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="cid:mesobLogo" alt="Mesob Wellness" style="height: 60px; margin-bottom: 15px;" />
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Appointment Reminder</h1>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px 20px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Dear <strong>${customerName}</strong>,</p>
            
            <p style="color: #666; font-size: 15px; line-height: 1.6;">This is a reminder about your upcoming appointment at <strong>Mesob Wellness Center</strong>.</p>
            
            <!-- Appointment Details Box -->
            <div style="background: linear-gradient(135deg, #f0f4ff 0%, #e8f1ff 100%); padding: 20px; border-left: 5px solid #001f3f; margin: 25px 0; border-radius: 4px;">
              <p style="color: #001f3f; font-weight: 600; font-size: 16px; margin: 0 0 15px 0;">📋 Appointment Details</p>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #555; font-weight: 500;">Appointment ID:</span>
                <span style="color: #333; margin-left: 10px;">${appointmentId}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #555; font-weight: 500;">📅 Scheduled Time:</span>
                <span style="color: #333; margin-left: 10px;">${appointmentTime}</span>
              </div>
              
              <div style="margin-bottom: 0;">
                <span style="color: #555; font-weight: 500;">🏥 Reason:</span>
                <span style="color: #333; margin-left: 10px;">${reason}</span>
              </div>
            </div>

            <!-- Important Info -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⏰ Please arrive 5-10 minutes early</strong> to complete any necessary paperwork.
              </p>
            </div>

            <p style="color: #666; font-size: 15px; line-height: 1.6;">If you need to reschedule or cancel, please contact us as soon as possible.</p>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 13px; margin: 5px 0;">
                <strong>Mesob Wellness Center</strong>
              </p>
              <p style="color: #bbb; font-size: 12px; margin: 5px 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #001f3f; font-size: 12px; margin: 10px 0 0 0;">
                Your health is our priority
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'mesob-logo.png',
          path: './public/Mesob-short-png.png',
          cid: 'mesobLogo',
        },
      ],
      text: `
MESOB WELLNESS CENTER
Appointment Reminder

Dear ${customerName},

This is a reminder about your upcoming appointment at Mesob Wellness Center.

APPOINTMENT DETAILS:
- Appointment ID: ${appointmentId}
- Scheduled Time: ${appointmentTime}
- Reason: ${reason}

Please arrive 5-10 minutes early to complete any necessary paperwork.

If you need to reschedule or cancel, please contact us as soon as possible.

---
Mesob Wellness Center
Your health is our priority

This is an automated message. Please do not reply to this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipientEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Email service is configured correctly');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
}
