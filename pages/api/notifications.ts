import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { type, phone, name } = req.body;
      
      // MOCK Notification Sending
      // In a real application, you would use Twilio SDK for SMS or WhatsApp Cloud API:
      // const client = require('twilio')(accountSid, authToken);
      // await client.messages.create({ body: `Dear ${name}...`, from: 'whatsapp:+14155238886', to: `whatsapp:${phone}` });
      
      console.log(`[MOCK NOTIFICATION] Sent ${type} to ${name} at ${phone}`);

      res.status(200).json({ success: true, message: "Notification sent (mock)" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send notification" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
