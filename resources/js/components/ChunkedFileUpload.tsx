import { useEffect, useRef } from 'react'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import XHRUpload from '@uppy/xhr-upload'
import '@uppy/core/dist/style.min.css'
import '@uppy/dashboard/dist/style.min.css'

interface ChunkedFileUploadProps {
  cardId: number
  onUploadComplete: () => void
  endpoint: string
}

export function ChunkedFileUpload({ cardId, onUploadComplete, endpoint }: ChunkedFileUploadProps) {
  const uppyRef = useRef<Uppy | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Uppy
    const uppy = new Uppy({
      restrictions: {
        maxFileSize: 1000 * 1024 * 1024, // 1GB max
        allowedFileTypes: null, // Allow all types
      },
      autoProceed: false,
    })

    // Add Dashboard plugin
    uppy.use(Dashboard, {
      inline: true,
      target: containerRef.current,
      height: 350,
      proudlyDisplayPoweredByUppy: false,
      note: 'Upload files up to 1GB. Files will be uploaded in chunks.',
    })

    // Custom chunked upload
    uppy.use(XHRUpload, {
      endpoint: endpoint,
      method: 'POST',
      formData: true,
      fieldName: 'chunk',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      getResponseData: (responseText) => {
        try {
          return JSON.parse(responseText)
        } catch {
          return {}
        }
      },
    })

    // Handle upload complete
    uppy.on('complete', (result) => {
      if (result.successful && result.successful.length > 0) {
        onUploadComplete()
      }
    })

    uppyRef.current = uppy

    return () => {
      uppy.close()
    }
  }, [cardId, endpoint, onUploadComplete])

  return <div ref={containerRef} />
}
