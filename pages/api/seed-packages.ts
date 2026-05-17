import { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const newPackages = [
  {
    name: "The Event Manager Special (Large Scale)",
    price: "15,000",
    description: "A comprehensive package designed specifically for event planners. Ensure every guest at a large scale wedding is covered without hassle.",
    features: [
      "Up to 50 Guests Coverage",
      "5 Senior Artists on-site",
      "Standard Arabic & Indo-Arabic designs",
      "4 hours of continuous service",
      "Uniformed and professional staff"
    ]
  },
  {
    name: "Family Sangeet / Haldi Package",
    price: "7,500",
    description: "Perfect for intimate home gatherings, Sangeet, or Haldi functions. Beautiful designs for all your relatives.",
    features: [
      "Up to 25 Ladies",
      "3 Artists on-site",
      "One-hand Arabic designs for guests",
      "3 hours of service",
      "100% Organic Henna"
    ]
  },
  {
    name: "Festival Society Gathering",
    price: "10,000",
    description: "Host a seamless festival gathering in your society. We handle the rush so you can enjoy the festival.",
    features: [
      "Up to 40 Ladies",
      "Quick, traditional festive strips (Bel)",
      "4 Artists on-site",
      "Fast-paced application to manage crowds"
    ]
  },
  {
    name: "Budget Guest Package (High Volume)",
    price: "5,000",
    description: "Our most budget-friendly option. Ensure no guest goes back with empty hands without breaking the bank.",
    features: [
      "Up to 35 Guests",
      "Basic minimal strips (bail) designs",
      "2 Artists on-site",
      "Very fast application (5 mins per guest)"
    ]
  },
  {
    name: "Corporate Event / Office Party",
    price: "8,000",
    description: "A sophisticated and fast-paced service for office environments. Minimalist and modern designs.",
    features: [
      "Up to 30 Employees",
      "Modern, minimalist, or tattoo-style henna",
      "2 Artists on-site",
      "3 hours coverage"
    ]
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // We use a simple handler and execute async logic inside without blocking the Vercel edge functions if possible, 
  // but since we are doing standard Next.js API route:
  if (req.method === 'POST') {
    Promise.all(
      newPackages.map(pkg => addDoc(collection(db, "event_packages"), pkg))
    )
    .then(() => {
      res.status(200).json({ message: "Successfully added 5 new packages" });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to add packages", details: error });
    });
  } else {
    res.status(405).json({ message: "Method Not Allowed. Use POST." });
  }
}
