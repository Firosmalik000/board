import {
    BoardHeader,
    CardDetailModal,
    ImagePreviewModal,
    KanbanBoard,
    useCardModal,
    useImagePreview,
} from '@/features/boards';
import AppLayout from '@/layouts/app-layout';
import { Board } from '@/lib/store';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface BoardShowProps {
    board: Board;
    activities: any[];
    totalActivities: number;
}

export default function BoardShow({
    board: initialBoard,
    activities,
    totalActivities,
}: BoardShowProps) {
    const [isPolling, setIsPolling] = useState(true);
    const [lastSyncTime] = useState(new Date());
    const [filterByUser, setFilterByUser] = useState<number | null>(null);

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
        handleAddPendingFile,
        handleRemovePendingFile,
        handleAddPendingChecklist,
        handleRemovePendingChecklist,
        handleEditPendingChecklist,
        handleDeleteCard,
        handleToggleMember,
        syncSelectedCard,
    } = useCardModal();

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
    } = useImagePreview();

    const handleBoardUpdate = () => {
        router.reload({ only: ['board'] });
    };

    // Sync selected card when board data changes
    useEffect(() => {
        syncSelectedCard(selectedCardId, initialBoard.lists || []);
    }, [initialBoard, selectedCardId]);

    // Polling DISABLED for maximum performance
    // Users can manually refresh by clicking refresh button
    // If you need real-time updates, consider WebSockets instead of polling
    // useEffect(() => {
    //   if (!isPolling) return
    //   const interval = setInterval(() => {
    //     router.reload({
    //       only: ['board'],
    //       preserveScroll: true,
    //       preserveState: true,
    //       onSuccess: () => {
    //         setLastSyncTime(new Date())
    //       },
    //     })
    //   }, 60000)
    //   return () => clearInterval(interval)
    // }, [isPolling])

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Boards',
            href: '/boards',
        },
        {
            title: initialBoard.title,
            href: `/boards/${initialBoard.id}`,
        },
    ];

    const backgroundStyle = initialBoard.background_image
        ? {
              backgroundImage: `url(/storage/${initialBoard.background_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
          }
        : {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={initialBoard.title} />

            <div
                className="absolute inset-0 flex flex-col overflow-hidden"
                style={backgroundStyle}
            >
                {/* Overlay for better text readability */}
                {initialBoard.background_image && (
                    <div className="pointer-events-none absolute inset-0 bg-black/20" />
                )}

                <div className="relative z-10 flex h-full flex-col">
                    <BoardHeader
                        board={initialBoard}
                        onBoardUpdate={handleBoardUpdate}
                        lastSyncTime={lastSyncTime}
                        isPolling={isPolling}
                        onTogglePolling={() => setIsPolling(!isPolling)}
                        activities={activities || []}
                        totalActivities={totalActivities}
                        filterByUser={filterByUser}
                        onFilterChange={setFilterByUser}
                        onCardClick={(cardId) =>
                            handleCardClick(cardId, initialBoard.lists || [])
                        }
                    />
                    <div className="min-h-0 flex-1">
                        <KanbanBoard
                            board={initialBoard}
                            onBoardUpdate={handleBoardUpdate}
                            onCardClick={(cardId) =>
                                handleCardClick(
                                    cardId,
                                    initialBoard.lists || [],
                                )
                            }
                            onCreateCard={handleCreateCard}
                            filterByUser={filterByUser}
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
                isSaving={isSaving}
                pendingFiles={pendingFiles}
                onAddPendingFile={handleAddPendingFile}
                pendingChecklists={pendingChecklists}
                onAddPendingChecklist={handleAddPendingChecklist}
                onRemovePendingChecklist={handleRemovePendingChecklist}
                onEditPendingChecklist={handleEditPendingChecklist}
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
    );
}
