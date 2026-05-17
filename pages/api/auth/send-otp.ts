import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';

// Initialize Resend with the provided key (should ideally be in .env.local)
const resend = new Resend('re_j8WE2nna_9Ug6wxWbujFQ8Phr8773kjqZ');

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
      type: type || 'signup',
      expiresAt: expirationTime,
      verified: false,
    });

    // Send email using Resend
    let subject = 'Your Jyoti Mehndi OTP Code';
    let htmlContent = `<p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`;

    if (type === 'reset') {
      subject = 'Reset Your Jyoti Mehndi Password';
      htmlContent = `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Here is your OTP code:</p>
        <h1 style="color: #e83e8c; letter-spacing: 5px;">${otp}</h1>
        <p>If you did not request this, please ignore this email.</p>
      `;
    } else {
      subject = 'Verify Your Email for Jyoti Mehndi';
      htmlContent = `
        <h2>Welcome to Jyoti Mehndi!</h2>
        <p>Please use the following OTP to verify your email and create your account:</p>
        <h1 style="color: #e83e8c; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'Jyoti Mehndi <onboarding@resend.dev>', // Using the dev address provided by Resend for testing
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
}
