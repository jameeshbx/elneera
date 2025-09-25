import { S3Service } from './s3-service'
import fs from 'fs/promises'
import path from 'path'

export class PDFManager {
  static async uploadPDF(
    pdfBuffer: Buffer,
    itineraryId: string,
    isRegenerated: boolean = false
  ): Promise<string> {
    const timestamp = Date.now()
    const prefix = isRegenerated ? 'regenerated' : 'generated'
    const fileName = `${prefix}-${itineraryId}-${timestamp}.pdf`

    const uploadResult = await S3Service.uploadFile(
      pdfBuffer,
      fileName,
      'application/pdf',
      'itinerary-pdfs'
    )

    return uploadResult.url
  }

  static async getItineraryTemplate(): Promise<Buffer> {
    try {
      const templatePath = path.join(process.cwd(), 'lib', 'itinerary.pdf')
      return await fs.readFile(templatePath)
    } catch (error) {
      console.error('Error reading itinerary template:', error)
      throw new Error('Failed to read itinerary template')
    }
  }

  static generatePDFKey(itineraryId: string, isRegenerated: boolean = false): string {
    const timestamp = Date.now()
    const prefix = isRegenerated ? 'regenerated' : 'generated'
    return `itinerary-pdfs/${prefix}-${itineraryId}-${timestamp}.pdf`
  }

  static async deletePDF(pdfKey: string): Promise<boolean> {
    try {
      return await S3Service.deleteFile(pdfKey)
    } catch (error) {
      console.error('Error deleting PDF from S3:', error)
      throw new Error('Failed to delete PDF from S3')
    }
  }

  static async listPDFVersions(itineraryId: string): Promise<{ key: string; url: string; timestamp: number }[]> {
    const files = await S3Service.listFiles('itinerary-pdfs')
    return files
      .filter(file => file.key.includes(itineraryId))
      .map(file => {
        const timestamp = parseInt(file.key.split('-').pop()?.replace('.pdf', '') || '0')
        return {
          key: file.key,
          url: file.url,
          timestamp
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }
}