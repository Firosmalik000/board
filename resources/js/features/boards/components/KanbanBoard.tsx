import { Board as BoardType } from '@/lib/store'
import { KanbanList } from './KanbanList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'

interface KanbanBoardProps {
  board: BoardType
  onBoardUpdate: () => void
  onCardClick: (cardId: number) => void
  onCreateCard: (listId: number) => void
  filterByUser?: number | null
}

export function KanbanBoard({ board, onBoardUpdate, onCardClick, onCreateCard, filterByUser }: KanbanBoardProps) {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddList = useCallback(() => {
    if (!newListTitle.trim()) return

    setIsLoading(true)
    router.post(
      `/boards/${board.id}/lists`,
      { title: newListTitle },
      {
        preserveScroll: true,
        onSuccess: () => {
          setNewListTitle('')
          setIsAddingList(false)
          toast.success('List created successfully')
        },
        onError: (errors) => {
          toast.error(errors.title || 'Failed to create list')
        },
        onFinish: () => setIsLoading(false),
      }
    )
  }, [board.id, newListTitle])

  const handleAddCard = useCallback((listId: number, title: string) => {
    setIsLoading(true)
    router.post(
      `/lists/${listId}/cards`,
      { title },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Card created successfully')
        },
        onError: (errors) => {
          toast.error(errors.title || 'Failed to create card')
        },
        onFinish: () => setIsLoading(false),
      }
    )
  }, [])

  const handleDeleteList = useCallback((listId: number) => {
    // Confirmation dialog is handled in KanbanList component
    setIsLoading(true)
    router.delete(`/lists/${listId}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('List deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete list')
      },
      onFinish: () => setIsLoading(false),
    })
  }, [])

  const handleEditList = useCallback((listId: number, title: string) => {
    setIsLoading(true)
    router.patch(
      `/lists/${listId}`,
      { title },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('List updated successfully')
        },
        onError: (errors) => {
          toast.error(errors.title || 'Failed to update list')
        },
        onFinish: () => setIsLoading(false),
      }
    )
  }, [])

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result

    if (!destination) return

    // Nothing moved
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Handle list dragging
    if (type === 'list') {
      const listId = parseInt(draggableId.replace('list-', ''))

      router.patch(
        `/lists/${listId}/move`,
        {
          position: destination.index,
        },
        {
          preserveScroll: true,
          preserveState: true,
          onError: () => {
            toast.error('Failed to move list')
          },
        }
      )
      return
    }

    // Handle card dragging
    const cardId = parseInt(draggableId)
    const destListId = parseInt(destination.droppableId)

    router.patch(
      `/cards/${cardId}/move`,
      {
        list_id: destListId,
        position: destination.index,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => {
          toast.error('Failed to move card')
        },
      }
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 sm:p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex h-full gap-2 sm:gap-4"
              >
                {/* Add List Button - Moved to the left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-72 sm:w-80 shrink-0"
                >
              {isAddingList ? (
                <div className="rounded-lg bg-muted/50 p-2 sm:p-3">
                  <Input
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddList()
                      if (e.key === 'Escape') {
                        setIsAddingList(false)
                        setNewListTitle('')
                      }
                    }}
                    autoFocus
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button onClick={handleAddList} size="sm" className="flex-1 text-xs sm:text-sm" disabled={isLoading}>
                      Add List
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingList(false)
                        setNewListTitle('')
                      }}
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingList(true)}
                  variant="secondary"
                  className="w-full justify-start text-xs sm:text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add another list</span>
                  <span className="sm:hidden">Add list</span>
                </Button>
              )}
                </motion.div>

                <AnimatePresence>
                  {board.lists?.map((list, index) => (
                    <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <KanbanList
                            list={list}
                            onAddCard={handleAddCard}
                            onCardClick={onCardClick}
                            onCreateCard={onCreateCard}
                            onDeleteList={handleDeleteList}
                            onEditList={handleEditList}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                            filterByUser={filterByUser}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}
