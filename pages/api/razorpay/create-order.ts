import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { amount } = req.body;
      
      // MOCK Razorpay order creation
      // In a real scenario, you would initialize Razorpay server SDK:
      // const Razorpay = require('razorpay');
      // const instance = new Razorpay({ key_id: '...', key_secret: '...' });
      // const options = { amount: amount * 100, currency: "INR", receipt: "receipt_order_1" };
      // const order = await instance.orders.create(options);
      
      const mockOrder = {
        id: `mock_order_${Math.floor(Math.random() * 100000)}`,
        entity: "order",
        amount: amount * 100, // amount in paise
        amount_paid: 0,
        amount_due: amount * 100,
        currency: "INR",
        receipt: "mock_receipt",
        status: "created",
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000)
      };

      res.status(200).json(mockOrder);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create order" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
