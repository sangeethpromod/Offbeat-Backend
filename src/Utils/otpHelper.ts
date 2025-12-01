import fs from 'fs';
import path from 'path';
import transporter from '../Config/email';

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to user
 */
export const sendOTPEmail = async (
  email: string,
  fullName: string,
  otp: string
): Promise<boolean> => {
  try {
    // Read the OTP email template
    const templatePath = path.join(__dirname, '../Email/otpEmail.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders with actual values
    htmlContent = htmlContent
      .replace('{{fullName}}', fullName)
      .replace('{{otp}}', otp);

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Offbeat Host Registration',
      html: htmlContent,
    });

    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

/**
 * Validate OTP (check if it matches and hasn't expired)
 */
export const validateOTP = (
  storedOTP: string,
  storedTimestamp: number,
  providedOTP: string,
  expiryMinutes: number = 10
): boolean => {
  // Check if OTP matches
  if (storedOTP !== providedOTP) {
    return false;
  }

  // Check if OTP has expired
  const currentTime = Date.now();
  const expiryTime = storedTimestamp + expiryMinutes * 60 * 1000;

  return currentTime <= expiryTime;
};
