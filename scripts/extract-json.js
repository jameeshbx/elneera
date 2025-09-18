const fs = require('fs');

function extractJSON(inputFile, outputFile) {
  try {
    console.log('Reading backup file...');
    const content = fs.readFileSync(inputFile, 'utf8');
    
    // Find the start of JSON data (look for the first '{')
    const jsonStart = content.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('No JSON data found in the file');
    }
    
    // Extract everything from the first '{' to the end
    const jsonContent = content.substring(jsonStart);
    
    // Try to parse the JSON to validate it
    const parsedData = JSON.parse(jsonContent);
    
    // Write the clean JSON to output file
    fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
    
    console.log(`✓ JSON extracted successfully to: ${outputFile}`);
    console.log(`✓ File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    return outputFile;
    
  } catch (error) {
    console.error('✗ Error extracting JSON:', error.message);
    process.exit(1);
  }
}

// Extract JSON from the backup file
const inputFile = 'database_backups/backup_20250821_181752.json';
const outputFile = 'database_backups/clean_backup.json';

extractJSON(inputFile, outputFile);
