import nodemailer from 'nodemailer';

// Create transport using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection configuration
transporter.verify((error, _success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

export default transporter;
