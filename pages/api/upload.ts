import type { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "@/lib/cloudinary";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Use POST" });

  try {
    const { image } = req.body; // Expecting base64 string
    
    if (!image) {
      return res.status(400).json({ message: "No image data provided" });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "jyoti_mehendi_store",
    });

    return res.status(200).json({ 
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id 
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
}
