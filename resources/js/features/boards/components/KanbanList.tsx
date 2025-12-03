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
}

export const KanbanList = React.memo(({ list, onAddCard, onCardClick, onCreateCard, onDeleteList, onEditList, dragHandleProps, isDragging }: KanbanListProps) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex w-80 shrink-0 flex-col max-h-full"
    >
      <Card className={cn(
        "flex flex-col bg-muted/50 p-3 max-h-full overflow-y-auto transition-shadow",
        isDragging && "shadow-xl rotate-2"
      )}>
        {/* List Header */}
        <div className="mb-2 flex items-center gap-2 shrink-0">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex-1 flex items-center justify-between">
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
                className="mr-2 h-8"
              />
            ) : (
              <h3
                className="cursor-pointer truncate font-semibold"
                onClick={() => setIsEditingTitle(true)}
                title={list.title}
              >
                {list.title}
                <span className="ml-2 text-sm text-muted-foreground">({list.cards?.length || 0})</span>
              </h3>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>Edit title</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Add Card Button - Moved to top */}
        <div className="mb-2 shrink-0">
          <Button
            onClick={() => onCreateCard(list.id)}
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a card
          </Button>
        </div>

        {/* Cards Container - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
          <Droppable droppableId={list.id.toString()}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-2 space-y-2 rounded-md transition-colors ${
                  snapshot.isDraggingOver ? 'bg-primary/5' : ''
                }`}
              >
                <AnimatePresence>
                  {list.cards?.map((card, index) => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      index={index}
                      onClick={() => onCardClick(card.id)}
                    />
                  ))}
                </AnimatePresence>
                {provided.placeholder}
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
