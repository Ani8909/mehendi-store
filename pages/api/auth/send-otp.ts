import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebaseAdmin';

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jyotimehndiartist999@gmail.com',
    pass: 'ssdwamqsxlqtumeg', // App Password provided by the user (spaces removed)
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not configured' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to Firestore
    await adminDb.collection('email_otps').doc(email).set({
      otp,
      type: type || 'login',
      expiresAt: expirationTime,
      verified: false,
    });

    // Create a beautiful pink theme template
    const subject = 'Your Secure OTP for Jyoti Mehndi';
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdf2f8; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background-color: #ec4899; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Jyoti Mehndi</h1>
          <p style="color: #fce7f3; margin: 5px 0 0 0; font-size: 16px;">Beauty & Elegance</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #374151; font-size: 22px; margin-top: 0; text-align: center;">Secure Authentication</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
            You recently requested a One-Time Password to authenticate your account. Please use the following code:
          </p>
          
          <div style="background-color: #fdf2f8; border: 2px dashed #f472b6; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
            <h1 style="color: #db2777; margin: 0; font-size: 42px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
          </div>
          
          <p style="color: #ef4444; font-size: 14px; text-align: center; margin-top: 20px; font-weight: 600;">
            ⏳ This code will expire in 10 minutes.
          </p>
          
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; text-align: center; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
            If you did not request this OTP, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <div style="background-color: #fce7f3; padding: 20px; text-align: center;">
          <p style="color: #be185d; font-size: 14px; margin: 0; font-weight: 600;">
            © ${new Date().getFullYear()} Jyoti Mehndi. All rights reserved.
          </p>
        </div>
      </div>
    `;

    // Send email using Nodemailer
    await transporter.sendMail({
      from: '"Jyoti Mehndi" <jyotimehndiartist999@gmail.com>',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Error sending OTP via Nodemailer:', error);
    return res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
}
