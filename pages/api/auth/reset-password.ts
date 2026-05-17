import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (!adminDb || !adminAuth) {
      return res.status(500).json({ error: 'Firebase Admin not configured' });
    }

    const otpDocRef = adminDb.collection('email_otps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }

    const data = otpDoc.data();

    // Verify OTP again just to be secure (prevents bypassing /verify-otp)
    if (data?.otp !== otp.toString() || data?.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
    }

    // Get the user from Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'No account exists with this email.' });
      }
      throw e;
    }

    // Update the password
    await adminAuth.updateUser(userRecord.uid, {
      password: newPassword,
    });

    // Delete the OTP to prevent reuse
    await otpDocRef.delete();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
}
