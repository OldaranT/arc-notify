const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const entry = path.join(__dirname, "dist", "index.js");

if (!fs.existsSync(entry)) {
  console.error("❌ dist/index.js not found. TypeScript was not built.");
  process.exit(1);
}

console.log("🚀 Starting Discord bot...");
spawn("node", [entry], { stdio: "inherit" });