import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not configured' });
    }

    const otpDocRef = adminDb.collection('email_otps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }

    const data = otpDoc.data();

    // Check expiration
    if (data?.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check match
    if (data?.otp !== otp.toString()) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified
    await otpDocRef.update({ verified: true });

    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
}
