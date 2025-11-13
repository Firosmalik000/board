import { router } from '@inertiajs/react'
import { toast } from 'sonner'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB per chunk

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export async function uploadFileInChunks(
  file: File,
  cardId: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<boolean> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9)

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunkBlob = file.slice(start, end)

      // Convert blob to File object with proper name and type
      const chunkFile = new File([chunkBlob], file.name, { type: file.type || 'application/octet-stream' })

      const formData = new FormData()
      formData.append('chunk', chunkFile, file.name)
      formData.append('chunkIndex', chunkIndex.toString())
      formData.append('totalChunks', totalChunks.toString())
      formData.append('filename', file.name)
      formData.append('uniqueId', uniqueId)

      // Get fresh CSRF token for each chunk
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

      // Also get XSRF token from cookie (used by Laravel Sanctum/Inertia)
      const xsrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      const response = await fetch(`/cards/${cardId}/attachments/chunk`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`)
      }

      await response.json()

      // Update progress
      if (onProgress) {
        const loaded = (chunkIndex + 1) * CHUNK_SIZE
        const percentage = Math.min(Math.round((loaded / file.size) * 100), 100)
        onProgress({
          loaded: Math.min(loaded, file.size),
          total: file.size,
          percentage,
        })
      }
    }

    return true
  } catch (error) {
    return false
  }
}
