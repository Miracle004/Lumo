import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' or configure host/port for other providers
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password for Gmail
  },
});

export const sendInviteEmail = async (to: string, inviterName: string, postTitle: string, postId: string) => {
  const loginLink = `${process.env.FRONTEND_URL}/login?redirect=/write/${postId}`;
  
  const mailOptions = {
    from: `"Lumo Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${inviterName} invited you to collaborate on "${postTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to collaborate!</h2>
        <p><strong>${inviterName}</strong> has invited you to edit their story <strong>"${postTitle}"</strong> on Lumo.</p>
        <p>Click the button below to start collaborating:</p>
        <a href="${loginLink}" style="display: inline-block; background-color: #ff7f50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Open Story</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">If you don't have an account, you'll be asked to create one.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invite email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw, just log. We don't want to fail the invite if email fails.
  }
};
