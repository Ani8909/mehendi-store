const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8").split("\n");
  envConfig.forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanReviews() {
  console.log("Starting review cleanup...");
  try {
    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef.get();
    
    console.log(`Found ${snapshot.size} total reviews.`);

    const uniqueReviews = new Map();
    const duplicateIds = [];
    
    // Aggressive deduplication
    snapshot.forEach(doc => {
      const data = doc.data();
      const author = (data.author || "").toLowerCase().trim();
      const text = (data.text || "").toLowerCase().trim();
      
      // Signature checks author + exact text (or first 50 chars)
      const signature = `${author}_${text.substring(0, 50)}`;
      
      if (uniqueReviews.has(signature)) {
        duplicateIds.push(doc.id);
      } else if (text.length < 5) {
         // Spam/Empty
         duplicateIds.push(doc.id);
      } else {
        uniqueReviews.set(signature, doc.id);
      }
    });

    console.log(`Identified ${duplicateIds.length} duplicate or spammy reviews.`);

    // Delete duplicates
    const batchSize = 50;
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = db.batch();
      const chunk = duplicateIds.slice(i, i + batchSize);
      chunk.forEach(id => {
        batch.delete(reviewsRef.doc(id));
      });
      await batch.commit();
      console.log(`Deleted a batch of ${chunk.length} reviews.`);
    }

    console.log("Cleanup finished successfully!");
    console.log(`Remaining trusted reviews: ${uniqueReviews.size}`);
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanReviews();
