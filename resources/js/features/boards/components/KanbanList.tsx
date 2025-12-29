import { List as ListType } from '@/lib/store'
import { KanbanCard } from './KanbanCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Droppable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Plus, X, Trash2, AlertTriangle, GripVertical } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface KanbanListProps {
  list: ListType
  onAddCard: (listId: number, title: string) => void
  onCardClick: (cardId: number) => void
  onCreateCard: (listId: number) => void
  onDeleteList: (listId: number) => void
  onEditList: (listId: number, title: string) => void
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
  filterByUser?: number | null
}

export const KanbanList = React.memo(({ list, onAddCard, onCardClick, onCreateCard, onDeleteList, onEditList, dragHandleProps, isDragging, filterByUser }: KanbanListProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(list.title)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== list.title) {
      onEditList(list.id, editedTitle)
    }
    setIsEditingTitle(false)
  }

  const handleConfirmDelete = () => {
    onDeleteList(list.id)
    setShowDeleteDialog(false)
  }

  // Filter cards based on assigned user
  const filteredCards = filterByUser
    ? list.cards?.filter(card =>
        card.members?.some((member: any) => member.id === filterByUser)
      ) || []
    : list.cards || []

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex w-72 sm:w-80 shrink-0 flex-col max-h-full self-start"
    >
      <Card className={cn(
        "flex flex-col backdrop-blur-sm bg-background/95 border-border/50 p-2 sm:p-4 transition-all duration-300 shadow-md hover:shadow-lg",
        isDragging && "shadow-2xl rotate-2 scale-105 ring-2 ring-primary/30"
      )}>
        {/* List Header */}
        <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary transition-all duration-200 hover:scale-110"
          >
            <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <div className="flex-1 flex items-center justify-between min-w-0">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') {
                    setEditedTitle(list.title)
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
                className="mr-2 h-8 sm:h-9 font-semibold text-sm sm:text-base"
              />
            ) : (
              <h3
                className="group cursor-pointer truncate font-bold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 hover:text-primary transition-colors min-w-0"
                onClick={() => setIsEditingTitle(true)}
                title={list.title}
              >
                <span className="truncate">{list.title}</span>
                <span className="inline-flex items-center justify-center min-w-[1.75rem] sm:min-w-[2rem] h-5 sm:h-6 px-1.5 sm:px-2 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold shrink-0">
                  {filteredCards.length}{filterByUser && list.cards?.length !== filteredCards.length ? `/${list.cards?.length}` : ''}
                </span>
              </h3>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors shrink-0">
                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  Edit title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Add Card Button - Moved to top */}
        <div className="mb-2 sm:mb-3 shrink-0">
          <Button
            onClick={() => onCreateCard(list.id)}
            variant="ghost"
            className="w-full justify-start h-8 sm:h-9 hover:bg-primary/10 hover:text-primary transition-all duration-200 group text-xs sm:text-sm"
            size="sm"
          >
            <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Add card</span>
          </Button>
        </div>

        {/* Cards Container - Scrollable */}
        <div className="overflow-y-auto overflow-x-hidden pr-0.5 sm:pr-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Droppable droppableId={list.id.toString()}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "min-h-2 rounded-lg transition-all duration-300",
                  snapshot.isDraggingOver && 'bg-primary/5 ring-2 ring-primary/20 ring-inset'
                )}
              >
                <AnimatePresence>
                  {filteredCards.map((card, index) => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      index={index}
                      onClick={() => onCardClick(card.id)}
                    />
                  ))}
                </AnimatePresence>
                {provided.placeholder}

                {/* Empty State */}
                {filteredCards.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center py-8 sm:py-12 px-2 sm:px-4 text-center"
                  >
                    <div className="rounded-full bg-muted/50 p-3 sm:p-4 mb-2 sm:mb-3">
                      <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground/70">
                      {filterByUser ? 'No cards match filter' : 'No cards yet'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/50 mt-1">
                      {filterByUser ? 'Try a different filter' : 'Click "Add card" to create one'}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Delete List</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  Are you sure you want to delete "{list.title}"?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete this list and all {list.cards?.length || 0} cards inside it.
              This action cannot be undone.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
})
