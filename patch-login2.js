const fs = require('fs');
const filepath = 'pages/login.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// The exact string in onSubmitDetails where we want to insert send-otp logic
// We'll search for `else if (authMode === "FORGOT_PASSWORD") {` inside onSubmitDetails
const submitDetailsMarker = '      else if (authMode === "FORGOT_PASSWORD") {\n        // Send OTP via our API\n        const res = await fetch("/api/auth/send-otp"';

const sendOtpLogic = `      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "login" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setStep("OTP");
      }
      else if (authMode === "FORGOT_PASSWORD") {
        // Send OTP via our API
        const res = await fetch("/api/auth/send-otp"`;

if (!content.includes('body: JSON.stringify({ email, type: "login" })')) {
    content = content.replace(submitDetailsMarker, sendOtpLogic);
}

// Now we need to fix onOtpSubmit.
// In onOtpSubmit, there are currently TWO `LOGIN_OTP` blocks. We need to replace them with just the verify one.

const oldOtpLogic = `      } 
      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "login" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setStep("OTP");
      }
      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Sign in with Custom Token
        await signInWithCustomToken(auth, data.token);
      }
      else if (authMode === "FORGOT_PASSWORD") {`;

const newOtpLogic = `      } 
      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Sign in with Custom Token
        await signInWithCustomToken(auth, data.token);
      }
      else if (authMode === "FORGOT_PASSWORD") {`;

content = content.replace(oldOtpLogic, newOtpLogic);
// Handle CRLF if needed
content = content.replace(oldOtpLogic.replace(/\n/g, '\r\n'), newOtpLogic.replace(/\n/g, '\r\n'));

fs.writeFileSync(filepath, content, 'utf8');
console.log("LOGIN FIXED!");
