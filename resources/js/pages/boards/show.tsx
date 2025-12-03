import AppLayout from '@/layouts/app-layout'
import { Board } from '@/lib/store'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import {
  KanbanBoard,
  BoardHeader,
  CardDetailModal,
  ImagePreviewModal,
  useCardModal,
  useImagePreview,
} from '@/features/boards'

interface BoardShowProps {
  board: Board
}

export default function BoardShow({ board: initialBoard }: BoardShowProps) {
  const [isPolling, setIsPolling] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  const {
    selectedCardId,
    selectedCard,
    cardMode,
    newComment,
    hasChanges,
    isUploadingFile,
    isSaving,
    pendingFiles,
    pendingChecklists,
    fileInputRef,
    setNewComment,
    handleCardClick,
    handleCreateCard,
    handleCloseCardModal,
    handleCardFieldChange,
    handleSaveCard,
    handleAddComment,
    handleFileUpload,
    handleDeleteAttachment,
    handleRemovePendingFile,
    handleAddPendingChecklist,
    handleRemovePendingChecklist,
    handleDeleteCard,
    handleToggleMember,
    syncSelectedCard,
  } = useCardModal()

  const {
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
  } = useImagePreview()

  const handleBoardUpdate = () => {
    router.reload({ only: ['board'] })
  }

  // Sync selected card when board data changes
  useEffect(() => {
    syncSelectedCard(selectedCardId, initialBoard.lists || [])
  }, [initialBoard, selectedCardId])

  // Smart polling for real-time updates
  useEffect(() => {
    if (!isPolling) return

    const interval = setInterval(() => {
      router.reload({
        only: ['board'],
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setLastSyncTime(new Date())
        },
      })
    }, 15000) // Poll every 15 seconds

    return () => clearInterval(interval)
  }, [isPolling])

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Boards',
      href: '/boards',
    },
    {
      title: initialBoard.title,
      href: `/boards/${initialBoard.id}`,
    },
  ]

  const backgroundStyle = initialBoard.background_image
    ? {
        backgroundImage: `url(/storage/${initialBoard.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {}

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={initialBoard.title} />

      <div className="absolute inset-0 flex flex-col overflow-hidden" style={backgroundStyle}>
        {/* Overlay for better text readability */}
        {initialBoard.background_image && (
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col h-full">
          <BoardHeader
            board={initialBoard}
            onBoardUpdate={handleBoardUpdate}
            lastSyncTime={lastSyncTime}
            isPolling={isPolling}
            onTogglePolling={() => setIsPolling(!isPolling)}
          />
          <div className="flex-1 min-h-0">
            <KanbanBoard
              board={initialBoard}
              onBoardUpdate={handleBoardUpdate}
              onCardClick={(cardId) => handleCardClick(cardId, initialBoard.lists || [])}
              onCreateCard={handleCreateCard}
            />
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        open={selectedCard !== null}
        onClose={handleCloseCardModal}
        selectedCard={selectedCard}
        cardMode={cardMode}
        board={initialBoard}
        onFieldChange={handleCardFieldChange}
        onSave={handleSaveCard}
        onDeleteCard={handleDeleteCard}
        hasChanges={hasChanges}
        newComment={newComment}
        onCommentChange={setNewComment}
        onAddComment={() => handleAddComment(handleBoardUpdate)}
        onFileUpload={handleFileUpload}
        onDeleteAttachment={handleDeleteAttachment}
        onRemovePendingFile={handleRemovePendingFile}
        onOpenPreview={handleOpenPreview}
        onToggleMember={handleToggleMember}
        isUploadingFile={isUploadingFile}
        pendingFiles={pendingFiles}
        pendingChecklists={pendingChecklists}
        onAddPendingChecklist={handleAddPendingChecklist}
        onRemovePendingChecklist={handleRemovePendingChecklist}
        fileInputRef={fileInputRef}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewImage !== null}
        onClose={handleClosePreview}
        imageUrl={previewImage?.url || null}
        filename={previewImage?.filename || null}
        zoom={imageZoom}
        rotation={imageRotation}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRotate={handleRotate}
        onResetZoom={handleResetZoom}
        onZoomChange={setImageZoom}
      />
    </AppLayout>
  )
}
