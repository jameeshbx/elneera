'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Download, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface S3FileInfo {
  key: string
  url: string
  size?: number
  lastModified?: string
  contentType?: string
}

interface S3FileManagerProps {
  folder?: string
  maxFiles?: number
}

export function S3FileManager({ folder = 'itinerary-pdfs', maxFiles = 50 }: S3FileManagerProps) {
  const [files, setFiles] = useState<S3FileInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/s3/files?folder=${encodeURIComponent(folder)}&maxKeys=${maxFiles}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files)
      } else {
        toast.error('Failed to fetch files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (key: string) => {
    try {
      setDeleting(key)
      const response = await fetch(`/api/s3/files/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (data.success) {
        setFiles(files.filter(file => file.key !== key))
        toast.success('File deleted successfully')
      } else {
        toast.error('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString()
  }

  const getFileName = (key: string) => {
    return key.split('/').pop() || key
  }

  useEffect(() => {
    fetchFiles()
  }, [folder, maxFiles])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>S3 Files</CardTitle>
          <CardDescription>Loading files from {folder}...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>S3 Files</CardTitle>
            <CardDescription>
              {files.length} files in {folder}
            </CardDescription>
          </div>
          <Button onClick={fetchFiles} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files found in {folder}
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.key}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{getFileName(file.key)}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {file.contentType || 'Unknown type'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.lastModified)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = file.url
                      link.download = getFileName(file.key)
                      link.click()
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFile(file.key)}
                    disabled={deleting === file.key}
                  >
                    {deleting === file.key ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
