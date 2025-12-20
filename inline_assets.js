const fs = require("fs");
const path = require("path");

const inputFile = "agent.html";
const outputFile = path.join("build", "agent_inlined.css");
const assetsDir = "assets";

// Mime type lookup
const getMimeType = (ext) => {
  const mimeTypes = {
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
  };
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
};

try {
  let htmlContent = fs.readFileSync(inputFile, "utf8");

  // Extract content inside <style>...</style>
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/i);

  if (!styleMatch) {
    console.error("No <style> tag found in " + inputFile);
    process.exit(1);
  }

  let cssContent = styleMatch[1];

  // Regex to find url("assets/...") or url('assets/...') or url(assets/...)
  // Captures the quote (if any) and the path
  const urlRegex = /url\(\s*(['"]?)(assets\/[^'"\)]+)\1\s*\)/g;

  const newCssContent = cssContent.replace(
    urlRegex,
    (match, quote, assetPath) => {
      try {
        // Remove any query parameters or hashes for file lookup
        const cleanPath = assetPath.split(/[?#]/)[0];
        const fullPath = path.join(__dirname, cleanPath);

        if (fs.existsSync(fullPath)) {
          const ext = path.extname(cleanPath);
          const mimeType = getMimeType(ext);
          const fileBuffer = fs.readFileSync(fullPath);
          const base64Data = fileBuffer.toString("base64");

          console.log(`Inlined: ${cleanPath}`);
          return `url(${quote}data:${mimeType};base64,${base64Data}${quote})`;
        } else {
          console.warn(`Warning: Asset not found: ${cleanPath}`);
          return match; // Return original if file not found
        }
      } catch (err) {
        console.error(`Error processing ${assetPath}:`, err.message);
        return match;
      }
    }
  );

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, newCssContent.trim(), "utf8");
  console.log(`Successfully extracted and inlined CSS to ${outputFile}.`);
} catch (err) {
  console.error("Error:", err.message);
}
