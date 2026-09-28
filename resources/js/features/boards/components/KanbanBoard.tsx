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

export function KanbanBoard({
  board,
  onBoardUpdate,
  onCardClick,
  onCreateCard,
  filterByUser,
}: KanbanBoardProps) {
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

    // Dropped outside the list
    if (!destination) return

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Moving lists
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

    // Moving cards
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
    <div className="flex flex-col h-full select-none">
      {/* Board Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-5">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex h-full gap-3 sm:gap-4 items-start"
              >
                {/* Board Lists */}
                <AnimatePresence>
                  {board.lists?.map((list, index) => (
                    <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                      {(dragProvided, snapshot) => (
                        <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                          <KanbanList
                            list={list}
                            onAddCard={handleAddCard}
                            onCardClick={onCardClick}
                            onCreateCard={onCreateCard}
                            onDeleteList={handleDeleteList}
                            onEditList={handleEditList}
                            dragHandleProps={dragProvided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                            filterByUser={filterByUser}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}

                {/* Add Another List (Positioned at the end, exactly like Trello) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-72 sm:w-80 shrink-0 self-start"
                >
                  {isAddingList ? (
                    <div className="rounded-xl bg-[#f1f2f4] dark:bg-[#161a1d] p-3 shadow-md border border-slate-200/80 dark:border-slate-800">
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
                        className="text-xs sm:text-sm bg-white dark:bg-slate-900 border-primary h-8"
                      />
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          onClick={handleAddList}
                          size="sm"
                          className="bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs h-7 px-3 font-medium shadow-xs"
                          disabled={isLoading}
                        >
                          Add list
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingList(false)
                            setNewListTitle('')
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingList(true)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/40 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/50 backdrop-blur-md text-foreground/90 font-medium text-xs sm:text-sm border border-white/20 dark:border-white/10 shadow-xs transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add another list</span>
                    </button>
                  )}
                </motion.div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}
