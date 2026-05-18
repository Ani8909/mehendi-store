import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../lib/email';

type NotifyType = 'NEW_BOOKING' | 'BOOKING_CONFIRMED' | 'PARTNER_ASSIGNED';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, data }: { type: NotifyType; data: any } = req.body;

  try {
    const adminEmail = process.env.SMTP_USER || 'suport@jyotimehendi.in';

    switch (type) {
      case 'NEW_BOOKING':
        // 1. Email to Customer
        if (data.email) {
          await sendEmail({
            to: data.email,
            subject: 'Booking Received - Jyoti Mehendi',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #db2777;">Booking Received!</h2>
                <p>Hello <strong>${data.customerName}</strong>,</p>
                <p>We have successfully received your booking request for <strong>${data.serviceTitle}</strong>.</p>
                <p><strong>Date:</strong> ${data.bookingDateString}<br/>
                <strong>Time:</strong> ${data.timeSlot || 'Not specified'}<br/>
                <p><strong>Total Price:</strong> ₹${data.price}</p>
                ${data.bookingRef ? `
                <div style="background-color: #fdf2f8; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                  <p style="margin: 0; color: #831843; font-size: 14px;">Your Tracking ID:</p>
                  <p style="margin: 5px 0 15px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #db2777;">${data.bookingRef}</p>
                  <a href="http://localhost:3000/verify" style="background-color: #db2777; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Your Booking</a>
                </div>
                ` : ''}
                <p>Our team will review your request and confirm shortly. Thank you for choosing Jyoti Mehendi!</p>
              </div>
            `,
          });
        }
        
        // 2. Email to Admin
        await sendEmail({
          to: adminEmail,
          subject: `NEW BOOKING: ${data.serviceTitle} by ${data.customerName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fdf2f8;">
              <h2 style="color: #be185d;">🚨 New Booking Alert</h2>
              <p><strong>Customer:</strong> ${data.customerName}</p>
              <p><strong>Phone:</strong> ${data.phone}</p>
              <p><strong>Service:</strong> ${data.serviceTitle}</p>
              <p><strong>Date:</strong> ${data.bookingDateString}</p>
              <p><strong>Time:</strong> ${data.timeSlot}</p>
              <p><strong>Address:</strong> ${data.address}</p>
              <p><strong>Price:</strong> ₹${data.price}</p>
              <br/>
              <p>Please check the admin dashboard to confirm this booking or assign a partner.</p>
            </div>
          `,
        });
        break;

      case 'BOOKING_CONFIRMED':
        if (data.email) {
          await sendEmail({
            to: data.email,
            subject: '🎉 Your Booking is Confirmed! - Jyoti Mehendi',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; border-top: 5px solid #10b981;">
                <h2 style="color: #047857;">Booking Confirmed!</h2>
                <p>Great news, <strong>${data.customerName}</strong>!</p>
                <p>Your booking for <strong>${data.serviceTitle}</strong> on <strong>${data.bookingDateString}</strong> has been officially confirmed by our team.</p>
                <p>Our Mehendi artist will reach your location (${data.address}) on time.</p>
                ${data.bookingRef ? `
                <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                  <p style="margin: 0; color: #064e3b; font-size: 14px;">Your Tracking ID:</p>
                  <p style="margin: 5px 0 15px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #10b981;">${data.bookingRef}</p>
                  <a href="http://localhost:3000/verify" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Your Booking</a>
                </div>
                ` : ''}
                <p>If you have any questions, feel free to contact us.</p>
                <br/>
                <p>Warm Regards,<br/><strong>Jyoti Mehendi Team</strong></p>
              </div>
            `,
          });
        }
        break;

      case 'PARTNER_ASSIGNED':
        if (data.partnerEmail) {
          await sendEmail({
            to: data.partnerEmail,
            subject: '🆕 New Mehendi Job Assigned',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; border-left: 5px solid #3b82f6;">
                <h2 style="color: #1d4ed8;">New Job Assigned</h2>
                <p>Hello Partner,</p>
                <p>You have been assigned a new Mehendi booking.</p>
                <h3>Booking Details:</h3>
                <ul>
                  <li><strong>Customer:</strong> ${data.customerName}</li>
                  <li><strong>Phone:</strong> ${data.phone}</li>
                  <li><strong>Service:</strong> ${data.serviceTitle}</li>
                  <li><strong>Date & Time:</strong> ${data.bookingDateString} at ${data.timeSlot}</li>
                  <li><strong>Location:</strong> ${data.address}</li>
                </ul>
                <p>Please log in to your partner dashboard to view more details.</p>
              </div>
            `,
          });
        }
        break;

      default:
        return res.status(400).json({ message: 'Invalid notification type' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Notify Error:', error);
    res.status(500).json({ success: false, error });
  }
}
