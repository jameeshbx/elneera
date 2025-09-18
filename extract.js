const fs = require('fs');
const path = require('path');

// Read the backup file
const backup = require('./database_backups/clean_backup.json');

// Find the file in the backup
const fileData = backup.find(item => item.name && item.name.includes('Screenshot 2025-08-06 112258.png'));

if (!fileData) {
  console.error('File not found in backup');
  process.exit(1);
}

console.log('Found file data');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Extract base64 data
const base64Data = fileData.url.split(',')[1];
const filePath = path.join(uploadsDir, 'screenshot.png');

// Write the file
fs.writeFileSync(filePath, base64Data, 'base64');
console.log('File written to:', filePath);
