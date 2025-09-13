const fs = require("fs");
const path = require("path");

try {
  // Define the path to the image, assuming it's in the same directory
  const imagePath = path.join(__dirname, "clip-transparent.png");

  // Read the image file as a buffer
  const imageBuffer = fs.readFileSync(imagePath);

  // Convert the buffer to a base64 string
  const base64Image = imageBuffer.toString("base64");

  // Create the data URI
  const dataUri = `data:image/png;base64,${base64Image}`;

  // Output the data URI
  console.log(dataUri);
} catch (error) {
  console.error("Error reading file:", error.message);
  if (error.code === "ENOENT") {
    console.error("Please make sure 'clip-transparent.png' is in the same directory as this script.");
  }
}
