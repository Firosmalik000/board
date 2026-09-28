import { List as ListType } from '@/lib/store'
import { KanbanCard } from './KanbanCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Droppable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Plus, X, Trash2, AlertTriangle, GripVertical } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
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

export const KanbanList = React.memo(
  ({
    list,
    onAddCard,
    onCardClick,
    onCreateCard,
    onDeleteList,
    onEditList,
    dragHandleProps,
    isDragging,
    filterByUser,
  }: KanbanListProps) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState(list.title)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isAddingCardInline, setIsAddingCardInline] = useState(false)
    const [inlineCardTitle, setInlineCardTitle] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (isAddingCardInline && textareaRef.current) {
        textareaRef.current.focus()
      }
    }, [isAddingCardInline])

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

    const handleInlineCardSubmit = () => {
      if (inlineCardTitle.trim()) {
        onAddCard(list.id, inlineCardTitle.trim())
        setInlineCardTitle('')
        // keep composer open for rapid card adding like Trello
        textareaRef.current?.focus()
      }
    }

    // Filter cards based on assigned user
    const filteredCards = filterByUser
      ? list.cards?.filter((card) =>
          card.members?.some((member: any) => member.id === filterByUser)
        ) || []
      : list.cards || []

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex w-72 sm:w-80 shrink-0 flex-col max-h-full self-start"
      >
        <div
          className={cn(
            'flex flex-col rounded-xl bg-[#f1f2f4] dark:bg-[#161a1d] text-[#172b4d] dark:text-[#b6c2cf] p-2.5 sm:p-3 transition-all duration-200 shadow-sm border border-slate-200/60 dark:border-slate-800/60',
            isDragging && 'shadow-2xl rotate-1 scale-105 ring-2 ring-primary/40'
          )}
        >
          {/* List Header */}
          <div className="mb-2 flex items-center gap-1.5 shrink-0 px-1 pt-0.5">
            {/* Drag Handle */}
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
            >
              <GripVertical className="h-4 w-4" />
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
                  className="mr-2 h-7 font-semibold text-xs sm:text-sm bg-white dark:bg-slate-900 border-primary"
                />
              ) : (
                <h3
                  className="cursor-pointer truncate font-semibold text-xs sm:text-sm flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 flex-1 text-slate-800 dark:text-slate-200"
                  onClick={() => setIsEditingTitle(true)}
                  title={list.title}
                >
                  <span className="truncate">{list.title}</span>
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1.5 rounded-full bg-slate-300/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold shrink-0">
                    {filteredCards.length}
                  </span>
                </h3>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 rounded shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                    Edit title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAddingCardInline(true)}>
                    Add card
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Cards Container - Scrollable */}
          <div
            className="overflow-y-auto overflow-x-hidden px-0.5 space-y-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
            style={{ maxHeight: 'calc(100vh - 230px)' }}
          >
            <Droppable droppableId={list.id.toString()}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-3 space-y-2 transition-colors rounded-lg',
                    snapshot.isDraggingOver && 'bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 ring-inset'
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
                  {filteredCards.length === 0 && !isAddingCardInline && (
                    <div className="py-6 px-2 text-center text-slate-400 dark:text-slate-500 text-xs">
                      {filterByUser ? 'No cards match filter' : 'No cards in this list'}
                    </div>
                  )}
                </div>
              )}
            </Droppable>

            {/* Inline Card Composer (Trello Style) */}
            {isAddingCardInline && (
              <div className="pt-1 pb-1">
                <textarea
                  ref={textareaRef}
                  value={inlineCardTitle}
                  onChange={(e) => setInlineCardTitle(e.target.value)}
                  placeholder="Enter a title for this card..."
                  className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs sm:text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0052cc] leading-normal"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleInlineCardSubmit()
                    }
                    if (e.key === 'Escape') {
                      setIsAddingCardInline(false)
                      setInlineCardTitle('')
                    }
                  }}
                />
                <div className="flex items-center gap-1.5 mt-2">
                  <Button
                    size="sm"
                    onClick={handleInlineCardSubmit}
                    disabled={!inlineCardTitle.trim()}
                    className="bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs h-7 px-3 font-medium shadow-xs"
                  >
                    Add card
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingCardInline(false)
                      setInlineCardTitle('')
                    }}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Add a Card Button at the Bottom (Trello Style) */}
          {!isAddingCardInline && (
            <div className="mt-1.5 pt-1 shrink-0">
              <button
                onClick={() => setIsAddingCardInline(true)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 text-xs sm:text-sm font-medium transition-colors text-left group"
              >
                <Plus className="h-4 w-4 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200" />
                <span>Add a card</span>
              </button>
            </div>
          )}
        </div>

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
  }
)
