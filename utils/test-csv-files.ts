// utils/test-csv-files.ts
import { promises as fs } from 'fs'
import path from 'path'
import Papa from 'papaparse'

interface CSVTestResult {
  filename: string
  isValid: boolean
  rowCount: number
  packageInfo?: any
  dailyActivities?: { [key: number]: number }
  errors?: string[]
  warnings?: string[]
}

const CSV_FILES = [
  'THAI001.csv',
  'EVER001.csv', 
  'GOA001.csv',
  'KASH001.csv',
  'KER001.csv',
  'RAJ001.csv'
]

async function testCSVFile(filename: string): Promise<CSVTestResult> {
  const result: CSVTestResult = {
    filename,
    isValid: false,
    rowCount: 0,
    errors: [],
    warnings: []
  }

  try {
    const csvPath = path.join(process.cwd(), 'public', 'itinerary', filename)
    const csvContent = await fs.readFile(csvPath, 'utf-8')
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim()
    })

    const data = parseResult.data as any[]
    result.rowCount = data.length

    if (parseResult.errors.length > 0) {
      result.errors = parseResult.errors.map(err => `${err.type}: ${err.message}`)
    }

    if (data.length === 0) {
      result.errors?.push('No data found in CSV')
      return result
    }

    // Check for package information (first row should have quote info)
    const firstRow = data[0]
    if (firstRow.quoteId && firstRow.name && firstRow.days && firstRow.nights) {
      result.packageInfo = {
        quoteId: firstRow.quoteId,
        name: firstRow.name,
        days: parseInt(firstRow.days) || 0,
        nights: parseInt(firstRow.nights) || 0,
        cost: firstRow.costUSD || firstRow.costINR,
        guests: firstRow.guests
      }
    } else {
      result.warnings?.push('Package information not found in first row')
    }

    // Count activities by day
    result.dailyActivities = {}
    data.forEach(row => {
      if (row.day && row.activity && row.time) {
        const day = parseInt(row.day)
        if (!isNaN(day)) {
          result.dailyActivities![day] = (result.dailyActivities![day] || 0) + 1
        }
      }
    })

    // Validation checks
    const hasRequiredFields = data.some(row => row.day && row.time && row.activity)
    if (!hasRequiredFields) {
      result.errors?.push('No valid activity entries found (need day, time, activity)')
    }

    // Check for consistent day numbering
    const dayNumbers = Object.keys(result.dailyActivities || {}).map(Number).sort((a, b) => a - b)
    if (dayNumbers.length > 0) {
      const expectedDays = result.packageInfo?.days || Math.max(...dayNumbers)
      if (dayNumbers.length !== expectedDays) {
        result.warnings?.push(`Expected ${expectedDays} days but found activities for ${dayNumbers.length} days`)
      }

      // Check for missing days
      for (let i = 1; i <= expectedDays; i++) {
        if (!dayNumbers.includes(i)) {
          result.warnings?.push(`Missing activities for day ${i}`)
        }
      }
    }

    result.isValid = (result.errors?.length || 0) === 0

  } catch (error) {
    result.errors?.push(`Failed to read/parse file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

export async function testAllCSVFiles(): Promise<CSVTestResult[]> {
  const results: CSVTestResult[] = []

  console.log('Testing CSV files in public/itinerary/...\n')

  for (const filename of CSV_FILES) {
    console.log(`Testing ${filename}...`)
    const result = await testCSVFile(filename)
    results.push(result)

    if (result.isValid) {
      console.log(`✅ ${filename} - Valid (${result.rowCount} rows)`)
      if (result.packageInfo) {
        console.log(`   Package: ${result.packageInfo.name} - ${result.packageInfo.days} days`)
      }
      if (result.dailyActivities) {
        const days = Object.keys(result.dailyActivities).length
        const totalActivities = Object.values(result.dailyActivities).reduce((a, b) => a + b, 0)
        console.log(`   Activities: ${totalActivities} across ${days} days`)
      }
    } else {
      console.log(`❌ ${filename} - Invalid`)
      result.errors?.forEach(error => console.log(`   Error: ${error}`))
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`   Warning: ${warning}`))
    }
    
    console.log('')
  }

  return results
}

// Run this function to test your CSV files
export async function runCSVTests() {
  try {
    const results = await testAllCSVFiles()
    
    const validFiles = results.filter(r => r.isValid).length
    const totalFiles = results.length
    
    console.log(`Summary: ${validFiles}/${totalFiles} CSV files are valid`)
    
    if (validFiles < totalFiles) {
      console.log('\nFiles that need attention:')
      results.filter(r => !r.isValid).forEach(result => {
        console.log(`- ${result.filename}: ${result.errors?.join(', ')}`)
      })
    }
    
    return results
  } catch (error) {
    console.error('Error running CSV tests:', error)
    throw error
  }
}

// Example usage in a Node.js script or API route
if (require.main === module) {
  runCSVTests().catch(console.error)
}