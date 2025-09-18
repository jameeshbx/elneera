// lib/email-attachment-helper.ts
import fs from "fs/promises"
import path from "path"

interface AttachmentInfo {
  filename: string
  path: string
  contentType: string
  size?: number
}

interface PDFSearchResult {
  found: boolean
  filePath?: string
  filename?: string
  url?: string
  size?: number
  error?: string
}

/**
 * Find the most recent PDF file for a given enquiry or itinerary
 */
export async function findLatestPDF(enquiryId?: string, itineraryId?: string): Promise<PDFSearchResult> {
  try {
    const generatedPdfsDir = path.join(process.cwd(), "public", "generated-pdfs")
    
    // Check if directory exists
    try {
      await fs.access(generatedPdfsDir)
    } catch {
      return {
        found: false,
        error: "Generated PDFs directory does not exist"
      }
    }

    const files = await fs.readdir(generatedPdfsDir)
    
    // Filter PDF files that match the criteria
    const matchingPdfs = files
      .filter(file => {
        if (!file.endsWith('.pdf')) return false
        
        let matches = true
        if (enquiryId) {
          matches = matches && file.includes(enquiryId)
        }
        if (itineraryId) {
          matches = matches && file.includes(itineraryId)
        }
        
        return matches
      })
      .map(file => {
        const filePath = path.join(generatedPdfsDir, file)
        const timestamp = extractTimestamp(file)
        
        return {
          filename: file,
          filePath: filePath,
          timestamp: timestamp,
          url: `/generated-pdfs/${file}`
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first

    if (matchingPdfs.length === 0) {
      return {
        found: false,
        error: `No PDF files found for enquiryId: ${enquiryId}, itineraryId: ${itineraryId}`
      }
    }

    const latestPdf = matchingPdfs[0]
    
    // Check if file actually exists and get its size
    try {
      const stats = await fs.stat(latestPdf.filePath)
      
      return {
        found: true,
        filePath: latestPdf.filePath,
        filename: latestPdf.filename,
        url: latestPdf.url,
        size: stats.size
      }
    } catch (statError) {
      return {
        found: false,
        error: `PDF file exists in directory but cannot be accessed: ${statError}`
      }
    }

  } catch (error) {
    return {
      found: false,
      error: `Error searching for PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Extract timestamp from filename (assumes format: itinerary-{itineraryId}-{enquiryId}-{timestamp}.pdf)
 */
function extractTimestamp(filename: string): number {
  const parts = filename.replace('.pdf', '').split('-')
  const lastPart = parts[parts.length - 1]
  return parseInt(lastPart) || 0
}

/**
 * Prepare email attachment from PDF search result
 */
export async function prepareAttachment(pdfResult: PDFSearchResult, customFilename?: string): Promise<AttachmentInfo | null> {
  if (!pdfResult.found || !pdfResult.filePath || !pdfResult.filename) {
    console.log("PDF not found or incomplete result:", pdfResult)
    return null
  }

  try {
    // Verify file exists and is readable
    await fs.access(pdfResult.filePath)
    
    const stats = await fs.stat(pdfResult.filePath)
    
    return {
      filename: customFilename || pdfResult.filename,
      path: pdfResult.filePath,
      contentType: "application/pdf",
      size: stats.size
    }
  } catch (error) {
    console.error("Error preparing attachment:", error)
    return null
  }
}

/**
 * Get all PDF files for a given enquiry (useful for debugging or admin purposes)
 */
export async function listAllPDFs(enquiryId?: string, itineraryId?: string): Promise<PDFSearchResult[]> {
  try {
    const generatedPdfsDir = path.join(process.cwd(), "public", "generated-pdfs")
    const files = await fs.readdir(generatedPdfsDir)
    
    const results: PDFSearchResult[] = []
    
    for (const file of files) {
      if (!file.endsWith('.pdf')) continue
      
      let matches = true
      if (enquiryId) matches = matches && file.includes(enquiryId)
      if (itineraryId) matches = matches && file.includes(itineraryId)
      
      if (matches) {
        const filePath = path.join(generatedPdfsDir, file)
        try {
          const stats = await fs.stat(filePath)
          results.push({
            found: true,
            filePath: filePath,
            filename: file,
            url: `/generated-pdfs/${file}`,
            size: stats.size
          })
        } catch {
          results.push({
            found: false,
            filename: file,
            error: "File exists in directory but cannot be accessed"
          })
        }
      }
    }
    
    return results.sort((a, b) => {
      const timestampA = extractTimestamp(a.filename || '')
      const timestampB = extractTimestamp(b.filename || '')
      return timestampB - timestampA
    })
    
  } catch (error) {
    return [{
      found: false,
      error: `Error listing PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`
    }]
  }
}

/**
 * Clean up old PDF files, keeping only the specified number of recent files per enquiry
 */
export async function cleanupOldPDFs(enquiryId: string, keepCount: number = 5): Promise<{
  cleaned: number
  errors: string[]
}> {
  const result = {
    cleaned: 0,
    errors: [] as string[]
  }
  
  try {
    const allPdfs = await listAllPDFs(enquiryId)
    const validPdfs = allPdfs.filter(pdf => pdf.found && pdf.filePath)
    
    if (validPdfs.length <= keepCount) {
      return result // No cleanup needed
    }
    
    const pdfsToDelete = validPdfs.slice(keepCount)
    
    for (const pdfToDelete of pdfsToDelete) {
      try {
        if (pdfToDelete.filePath) {
          await fs.unlink(pdfToDelete.filePath)
          result.cleaned++
          console.log(`Cleaned up old PDF: ${pdfToDelete.filename}`)
        }
      } catch (deleteError) {
        const error = `Failed to delete ${pdfToDelete.filename}: ${deleteError}`
        result.errors.push(error)
        console.error(error)
      }
    }
    
  } catch (error) {
    result.errors.push(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return result
}

/**
 * Generate a standard filename for customer-facing PDFs
 */
export function generateCustomerPDFFilename(enquiryId: string, customerName?: string): string {
  const sanitizedName = customerName 
    ? customerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    : 'customer'
  
  return `travel-quote-${sanitizedName}-${enquiryId}.pdf`
}

/**
 * Generate a standard filename for DMC-facing PDFs
 */
export function generateDMCPDFFilename(enquiryId: string, dmcName?: string): string {
  const sanitizedName = dmcName 
    ? dmcName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    : 'dmc'
  
  return `itinerary-request-${sanitizedName}-${enquiryId}.pdf`
}

// Export types for external use
export type { AttachmentInfo, PDFSearchResult }