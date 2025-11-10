import { useState } from 'react'

export function useImagePreview() {
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null)
  const [imageZoom, setImageZoom] = useState(100)
  const [imageRotation, setImageRotation] = useState(0)

  const handleOpenPreview = (url: string, filename: string) => {
    setPreviewImage({ url, filename })
    setImageZoom(100)
    setImageRotation(0)
  }

  const handleClosePreview = () => {
    setPreviewImage(null)
    setImageZoom(100)
    setImageRotation(0)
  }

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 25))
  }

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360)
  }

  const handleResetZoom = () => {
    setImageZoom(100)
    setImageRotation(0)
  }

  return {
    previewImage,
    imageZoom,
    imageRotation,
    setImageZoom,
    handleOpenPreview,
    handleClosePreview,
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    handleResetZoom,
  }
}
