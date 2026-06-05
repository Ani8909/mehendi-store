const fs = require('fs');

let content = fs.readFileSync('pages/admin.tsx', 'utf8');

// 1. Import AdminBlogManager
if (!content.includes('AdminBlogManager')) {
    const importStr = 'import AdminBlogManager from "@/components/AdminBlogManager";\n';
    content = content.replace('import { db', importStr + 'import { db');
}

// 2. Add FiEdit3 to imports
if (!content.includes('FiEdit3')) {
    content = content.replace('FiGift } from "react-icons/fi";', 'FiGift, FiEdit3 } from "react-icons/fi";');
}

// 3. Add tab
const tabsRegex = /\{ id: "reports", label: "Reports", icon: <FiFileText\/> \},/;
if (!content.includes('id: "blogs"')) {
    // Wait, let's find `FiFileText` first. Oh wait, `FiFileText` isn't in the import list?
    // Let me check if `reports` tab exists.
    content = content.replace('{ id: "reports", label: "Reports", icon: <FiFileText/> },', '{ id: "reports", label: "Reports", icon: <FiFileText/> },\n                { id: "blogs", label: "Blogs", icon: <FiEdit3/> },');
}

// Wait, FiFileText might not be the last tab. Let's find "referrals" tab.
content = content.replace('{ id: "referrals", label: "Referrals", icon: <FiShare2/> },', '{ id: "referrals", label: "Referrals", icon: <FiShare2/> },\n                { id: "blogs", label: "Blogs", icon: <FiEdit3/> },');

// 4. Add render block
// We can inject it right before `              {activeTab === "referrals" && referralSettings && (`
const renderBlock = `              {activeTab === "blogs" && (
                <AdminBlogManager />
              )}\n`;

if (!content.includes('activeTab === "blogs"')) {
    content = content.replace('              {activeTab === "referrals"', renderBlock + '              {activeTab === "referrals"');
}

fs.writeFileSync('pages/admin.tsx', content);
console.log("Admin patched for blogs.");
