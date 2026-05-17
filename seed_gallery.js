const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually to get values without needing extra dependencies like dotenv
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) return null;
  let val = match[1].trim();
  // Strip quotes if any
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.substring(1, val.length - 1);
  }
  return val;
};

const projectId = getEnvVar('FIREBASE_PROJECT_ID');
const clientEmail = getEnvVar('FIREBASE_CLIENT_EMAIL');
const privateKeyRaw = getEnvVar('FIREBASE_PRIVATE_KEY');
const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : null;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Error: Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

const demoDesigns = [
  { imageURL: "/images/gallery/bridal_1.png", category: "Bridal" },
  { imageURL: "/images/gallery/bridal_2.png", category: "Bridal" },
  { imageURL: "/images/gallery/bridal_3.png", category: "Bridal" },
  { imageURL: "/images/gallery/arabic_1.png", category: "Arabic" },
  { imageURL: "/images/gallery/arabic_2.png", category: "Arabic" },
  { imageURL: "/images/gallery/feet_1.png", category: "Feet" },
  { imageURL: "/images/gallery/feet_2.png", category: "Feet" }
];

async function seed() {
  console.log("Starting gallery seeding into Firestore...");
  const collectionRef = db.collection('designs_gallery');
  
  // Clean up any existing seeded images to avoid duplicates if run multiple times
  const snapshot = await collectionRef.get();
  if (!snapshot.empty) {
    console.log(`Found ${snapshot.size} existing items in designs_gallery. Cleaning them up...`);
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("Existing items deleted successfully.");
  }

  for (const design of demoDesigns) {
    const docData = {
      imageURL: design.imageURL,
      category: design.category,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await collectionRef.add(docData);
    console.log(`Added design ${design.imageURL} (Category: ${design.category}) with ID: ${docRef.id}`);
  }
  
  console.log("Gallery seeded successfully!");
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
