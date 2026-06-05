const fs = require('fs');
let content = fs.readFileSync('pages/admin.tsx', 'utf8');

// Fix handleImageUpload in admin.tsx
// Old broken code:
/*
    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      try {
        const res = await fetch("/api/upload", ...
...
      } finally {
        setUploading(false);
      }
    };
  };
*/
// Let's just fix the function handleImageUpload entirely with a regex or string replacement.

const fix1_old = `    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });
        
        if (!res.ok) {
          const text = await res.text();
          let errorMessage = "Server Error";
          try {
            const json = JSON.parse(text);
            errorMessage = json.error || json.message || errorMessage;
          } catch (e) {
            if (text.includes("Body exceeded")) errorMessage = "Image size is too large for the server.";
            else errorMessage = text;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (target === "desktop") setNewDesktopImage(data.url);
        else if (target === "mobile") setNewMobileImage(data.url);
        else if (target === "gallery") setNewImage(data.url);
        else if (target === "service") setNewServiceImage(data.url);
        
        console.log(\`Uploaded to \${target}:\`, data.url);
      } catch (err: any) {
        console.error("Upload Error:", err);
        alert("Upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    };
  };`;

const fix1_new = `    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedBase64 }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Server Error";
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || errorMessage;
        } catch (e) {
          if (text.includes("Body exceeded")) errorMessage = "Image size is too large for the server.";
          else errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (target === "desktop") setNewDesktopImage(data.url);
      else if (target === "mobile") setNewMobileImage(data.url);
      else if (target === "gallery") setNewImage(data.url);
      else if (target === "service") setNewServiceImage(data.url);
      
      console.log(\`Uploaded to \${target}:\`, data.url);
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };`;

content = content.replace(fix1_old, fix1_new);

// Fix the second upload in admin.tsx (around line 2379)
const fix2_old = `                          <input type="file" accept="image/*" className="hidden" id="edit-service-image" onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            const file = e.target.files[0];
                            setUploading(true);
                            const reader = new FileReader();
                            try {
                              const compressedBase64 = await compressImage(file);
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ image: compressedBase64 }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setEditingService({ ...editingService, image: data.url });
                                }
                              } catch (err) {
                                console.error("Upload error:", err);
                              } finally {
                                setUploading(false);
                              }
                            };
                          }} />`;

const fix2_new = `                          <input type="file" accept="image/*" className="hidden" id="edit-service-image" onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            const file = e.target.files[0];
                            setUploading(true);
                            try {
                              const compressedBase64 = await compressImage(file);
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ image: compressedBase64 }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setEditingService({ ...editingService, image: data.url });
                              }
                            } catch (err) {
                              console.error("Upload error:", err);
                            } finally {
                              setUploading(false);
                            }
                          }} />`;

content = content.replace(fix2_old, fix2_new);
fs.writeFileSync('pages/admin.tsx', content);

console.log("Admin fixed.");
