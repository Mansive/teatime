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

  // Remove common indentation
  const lines = cssContent.split("\n");
  // Find minimum indentation (ignoring empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length > 0) {
      const indent = line.match(/^\s*/)[0].length;
      if (indent < minIndent) {
        minIndent = indent;
      }
    }
  }

  if (minIndent !== Infinity && minIndent > 0) {
    cssContent = lines
      .map((line) => {
        return line.length >= minIndent ? line.slice(minIndent) : line;
      })
      .join("\n");
  }

  // Regex to find url("assets/...") or url('assets/...') or url(assets/...)
  // Captures the quote (if any) and the path
  const urlRegex = /url\(\s*(['"]?)(assets\/[^'"\)]+)\1\s*\)/g;

  const linesWithInlinedAssets = cssContent.split("\n").map((line) => {
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : "";

    let comments = [];

    const newLine = line.replace(urlRegex, (match, quote, assetPath) => {
      try {
        // Remove any query parameters or hashes for file lookup
        const cleanPath = assetPath.split(/[?#]/)[0];
        const fullPath = path.join(__dirname, cleanPath);

        if (fs.existsSync(fullPath)) {
          const ext = path.extname(cleanPath);

          comments.push(`${indent}/* ${cleanPath} */`);

          if (ext.toLowerCase() === ".svg") {
            let svgContent = fs.readFileSync(fullPath, "utf8");
            // Collapse whitespace
            svgContent = svgContent.replace(/\s+/g, " ").trim();
            // Encode for data URI (minimal encoding for size)
            // We use double quotes for the outer url("..."), so we replace double quotes in SVG with single quotes
            // This is a common optimization for SVG data URIs
            let encoded = svgContent.replace(/"/g, "'");
            // encoded = encoded.replace(/%/g, "%25");
            encoded = encoded.replace(/#/g, "%23");
            // encoded = encoded.replace(/{/g, "%7B");
            // encoded = encoded.replace(/}/g, "%7D");
            // encoded = encoded.replace(/</g, "%3C");
            // encoded = encoded.replace(/>/g, "%3E");

            console.log(`Inlined SVG: ${cleanPath}`);
            // Force double quotes for the url
            return `url("data:image/svg+xml,${encoded}")`;
          }

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
    });

    if (comments.length > 0) {
      return comments.join("\n") + "\n" + newLine;
    }
    return newLine;
  });

  let newCssContent = linesWithInlinedAssets.join("\n");

  // Remove the unwanted block using regex
  const blockToRemoveRegex =
    /\/\* position alerts[\s\S]*?#options\s*\{[\s\S]*?\}/;

  newCssContent = newCssContent.replace(blockToRemoveRegex, "").trim();

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, newCssContent.trim(), "utf8");
  console.log(`Successfully extracted and inlined CSS to ${outputFile}.`);
} catch (err) {
  console.error("Error:", err.message);
}
