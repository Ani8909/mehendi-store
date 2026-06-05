const fs = require('fs');

const filepath = 'pages/login.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Add signInWithCustomToken to imports if not exists
if (!content.includes('signInWithCustomToken')) {
    content = content.replace(
        'signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";',
        'signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";'
    );
}

// Update state type
content = content.replace(
    'const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP" | "ADMIN" | "FORGOT_PASSWORD">("LOGIN");',
    'const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP" | "ADMIN" | "FORGOT_PASSWORD" | "LOGIN_OTP">("LOGIN");'
);

// Update onSubmitDetails
const otp_submit_logic = `      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "login" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setStep("OTP");
      }
      else if (authMode === "FORGOT_PASSWORD") {`;

content = content.replace(
    /      else if \(authMode === "FORGOT_PASSWORD"\) \{/g,
    otp_submit_logic
);

// Update onOtpSubmit
const on_otp_submit_logic = `      else if (authMode === "LOGIN_OTP") {
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

content = content.replace(
    /      else if \(authMode === "FORGOT_PASSWORD"\) \{/g,
    on_otp_submit_logic
);

// Add the OTP Login option in UI
const ui_replacement = `                <button 
                  type="button"
                  onClick={() => { setAuthMode("SIGNUP"); setStep("DETAILS"); setError(""); }}
                  className={\`flex-1 py-2 text-xs font-bold rounded-full transition-colors \${authMode === "SIGNUP" ? "bg-[var(--color-primary)] text-white" : "text-gray-500"}\`}
                >
                  Sign Up
                </button>
                <button 
                  type="button"
                  onClick={() => { setAuthMode("LOGIN_OTP"); setStep("DETAILS"); setError(""); }}
                  className={\`flex-1 py-2 text-xs font-bold rounded-full transition-colors \${authMode === "LOGIN_OTP" ? "bg-pink-500 text-white" : "text-gray-500"}\`}
                >
                  Email OTP
                </button>`;

content = content.replace(
    /                <button \r?\n\s*type="button"\r?\n\s*onClick=\{\(\) => \{ setAuthMode\("SIGNUP"\); setStep\("DETAILS"\); setError\(""\); \}\}\r?\n\s*className=\{\`flex-1 py-2 text-xs font-bold rounded-full transition-colors \$\{authMode === "SIGNUP" \? "bg-\[var\(--color-primary\)\] text-white" : "text-gray-500"\}\`\}\r?\n\s*>\r?\n\s*Sign Up\r?\n\s*<\/button>/g,
    ui_replacement
);

const pass_ui_replacement = `                {authMode !== "FORGOT_PASSWORD" && authMode !== "LOGIN_OTP" && (`;

content = content.replace(
    /                \{authMode !== "FORGOT_PASSWORD" && \(/g,
    pass_ui_replacement
);

// Disable the "Continue" or "Login" button correctly
const button_text_replacement = `                    {authMode === "LOGIN" || authMode === "ADMIN" ? "Secure Login" : authMode === "FORGOT_PASSWORD" ? "Send Reset OTP" : authMode === "LOGIN_OTP" ? "Send Login OTP" : "Create Account"}`;

content = content.replace(
    /                    \{authMode === "LOGIN" \|\| authMode === "ADMIN" \? "Secure Login" : authMode === "FORGOT_PASSWORD" \? "Send Reset OTP" : "Create Account"\}/g,
    button_text_replacement
);


fs.writeFileSync(filepath, content, 'utf8');
console.log("LOGIN UI PATCHED!");
