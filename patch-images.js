const fs = require('fs');
const path = require('path');

const applyCompression = (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');

    // Add import if not present
    if (!content.includes('compressImage')) {
        // Find the last import statement
        const lastImportIndex = content.lastIndexOf('import');
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        
        content = content.slice(0, endOfLastImport + 1) +
                  'import { compressImage } from "@/lib/imageUtils";\n' +
                  content.slice(endOfLastImport + 1);
    }

    // Replace standard FileReader logic with compressImage logic
    // We are looking for something like:
    /*
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: reader.result }),
        });
    */
    // Since each file has slightly different variable names (`reader.result` vs `base64data`),
    // I will write custom replacements for each known file.

    return content;
};

// 1. Admin.tsx
let adminContent = fs.readFileSync('pages/admin.tsx', 'utf8');
if (!adminContent.includes('compressImage')) {
    adminContent = 'import { compressImage } from "@/lib/imageUtils";\n' + adminContent;
}

const adminOldLogic = `    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });`;

const adminNewLogic = `    try {
      const compressedBase64 = await compressImage(file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });`;

adminContent = adminContent.replace(adminOldLogic, adminNewLogic);
// Also there is another upload in admin.tsx for service image
const adminOldLogic2 = `                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onloadend = async () => {
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ image: reader.result }),
                                });`;

const adminNewLogic2 = `                            try {
                              const compressedBase64 = await compressImage(file);
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ image: compressedBase64 }),
                                });`;

adminContent = adminContent.replace(adminOldLogic2, adminNewLogic2);

fs.writeFileSync('pages/admin.tsx', adminContent);

// 2. Booking.tsx
let bookingContent = fs.readFileSync('pages/booking.tsx', 'utf8');
if (!bookingContent.includes('compressImage')) {
    bookingContent = 'import { compressImage } from "@/lib/imageUtils";\n' + bookingContent;
}

const bookingOldLogic = `      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64data }),
        });`;

const bookingNewLogic = `      // Compress image and convert to base64
      const compressedBase64 = await compressImage(file);
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });`;

bookingContent = bookingContent.replace(bookingOldLogic, bookingNewLogic);
// Also remove the extra closing brace for onloadend in booking.tsx
const bookingOldCatch = `        if (result.url) {
          setImageURL(result.url);
        } else {
          alert("Upload failed");
        }
        setUploadingImage(false);
      };
    } catch (error) {`;

const bookingNewCatch = `        if (result.url) {
          setImageURL(result.url);
        } else {
          alert("Upload failed");
        }
        setUploadingImage(false);
      } catch (uploadErr) {
        alert("Upload failed");
        setUploadingImage(false);
      }
    } catch (error) {`;

bookingContent = bookingContent.replace(bookingOldCatch, bookingNewCatch);
fs.writeFileSync('pages/booking.tsx', bookingContent);

// 3. Express Booking.tsx
let expressBookingContent = fs.readFileSync('pages/express-booking.tsx', 'utf8');
if (!expressBookingContent.includes('compressImage')) {
    expressBookingContent = 'import { compressImage } from "@/lib/imageUtils";\n' + expressBookingContent;
}

const expressBookingOldLogic = `      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64data }),
        });`;

const expressBookingNewLogic = `      // Compress image and convert to base64
      const compressedBase64 = await compressImage(file);
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });`;

expressBookingContent = expressBookingContent.replace(expressBookingOldLogic, expressBookingNewLogic);

const expressBookingOldCatch = `        if (result.url) {
          setImageURL(result.url);
        } else {
          alert("Upload failed");
        }
        setUploadingImage(false);
      };
    } catch (error) {`;

const expressBookingNewCatch = `        if (result.url) {
          setImageURL(result.url);
        } else {
          alert("Upload failed");
        }
        setUploadingImage(false);
      } catch (uploadErr) {
        alert("Upload failed");
        setUploadingImage(false);
      }
    } catch (error) {`;

expressBookingContent = expressBookingContent.replace(expressBookingOldCatch, expressBookingNewCatch);
fs.writeFileSync('pages/express-booking.tsx', expressBookingContent);

// 4. Partner.tsx
let partnerContent = fs.readFileSync('pages/partner.tsx', 'utf8');
if (!partnerContent.includes('compressImage')) {
    partnerContent = 'import { compressImage } from "@/lib/imageUtils";\n' + partnerContent;
}

const partnerOldLogic = `      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64data }),
        });`;

const partnerNewLogic = `      // Compress image and convert to base64
      const compressedBase64 = await compressImage(file);
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });`;

partnerContent = partnerContent.replace(partnerOldLogic, partnerNewLogic);

const partnerOldCatch = `        if (result.url) {
          setPortfolioFiles(prev => [...prev, result.url]);
        }
        setUploading(false);
      };
    } catch (error) {`;

const partnerNewCatch = `        if (result.url) {
          setPortfolioFiles(prev => [...prev, result.url]);
        }
        setUploading(false);
      } catch (uploadErr) {
        setUploading(false);
      }
    } catch (error) {`;

partnerContent = partnerContent.replace(partnerOldCatch, partnerNewCatch);

// Also check job completion upload in partner.tsx
const partnerJobOldLogic = `      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64data }),
        });`;

const partnerJobNewLogic = `      const compressedBase64 = await compressImage(file);
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });`;

partnerContent = partnerContent.replace(partnerJobOldLogic, partnerJobNewLogic);

const partnerJobOldCatch = `        if (result.url) {
          setCompletionImages(prev => ({ ...prev, [jobId]: result.url }));
        }
        setUploadingImage(null);
      };
    } catch (error) {`;

const partnerJobNewCatch = `        if (result.url) {
          setCompletionImages(prev => ({ ...prev, [jobId]: result.url }));
        }
        setUploadingImage(null);
      } catch (uploadErr) {
        setUploadingImage(null);
      }
    } catch (error) {`;

partnerContent = partnerContent.replace(partnerJobOldCatch, partnerJobNewCatch);

fs.writeFileSync('pages/partner.tsx', partnerContent);

console.log("PATCH APPLIED SUCCESSFULLY");
