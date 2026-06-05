import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
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

    // Ensure the user exists in Firebase Auth, otherwise create them
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Create new user if they don't exist
        userRecord = await adminAuth.createUser({
          email: email,
          emailVerified: true, // Auto-verify since they used OTP
        });

        // Initialize their profile in Firestore
        const baseName = email.split('@')[0].replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const referralCode = `${baseName}-${randomStr}`;

        await adminDb.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          name: email.split('@')[0],
          email: email,
          role: 'customer',
          createdAt: new Date(),
          referralCode: referralCode,
          walletBalance: 0,
          pendingWalletBalance: 0,
          isReferralClaimed: false,
        });
      } else {
        throw err;
      }
    }

    // Generate Custom Token
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully',
      token: customToken
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
}
