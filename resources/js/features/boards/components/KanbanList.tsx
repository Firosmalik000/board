import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { List as ListType } from '@/lib/store';
import { cn } from '@/lib/utils';
import { DraggableProvidedDragHandleProps, Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    GripVertical,
    MoreVertical,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { KanbanCard } from './KanbanCard';

interface KanbanListProps {
    list: ListType;
    onAddCard: (listId: number, title: string) => void;
    onCardClick: (cardId: number) => void;
    onCreateCard: (listId: number) => void;
    onDeleteList: (listId: number) => void;
    onEditList: (listId: number, title: string) => void;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    isDragging?: boolean;
    filterByUser?: number | null;
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
        const [isEditingTitle, setIsEditingTitle] = useState(false);
        const [editedTitle, setEditedTitle] = useState(list.title);
        const [showDeleteDialog, setShowDeleteDialog] = useState(false);
        const [isAddingCardInline, setIsAddingCardInline] = useState(false);
        const [inlineCardTitle, setInlineCardTitle] = useState('');
        const textareaRef = useRef<HTMLTextAreaElement>(null);

        useEffect(() => {
            if (isAddingCardInline && textareaRef.current) {
                textareaRef.current.focus();
            }
        }, [isAddingCardInline]);

        const handleSaveTitle = () => {
            if (editedTitle.trim() && editedTitle !== list.title) {
                onEditList(list.id, editedTitle);
            }
            setIsEditingTitle(false);
        };

        const handleConfirmDelete = () => {
            onDeleteList(list.id);
            setShowDeleteDialog(false);
        };

        const handleInlineCardSubmit = () => {
            if (inlineCardTitle.trim()) {
                onAddCard(list.id, inlineCardTitle.trim());
                setInlineCardTitle('');
                // keep composer open for rapid card adding like Trello
                textareaRef.current?.focus();
            }
        };

        // Filter cards based on assigned user
        const filteredCards = filterByUser
            ? list.cards?.filter((card) =>
                  card.members?.some(
                      (member: any) => member.id === filterByUser,
                  ),
              ) || []
            : list.cards || [];

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-full w-72 shrink-0 flex-col self-start sm:w-80"
            >
                <div
                    className={cn(
                        'flex flex-col rounded-xl border border-slate-200/60 bg-[#f1f2f4] p-2.5 text-[#172b4d] shadow-sm transition-all duration-200 sm:p-3 dark:border-slate-800/60 dark:bg-[#161a1d] dark:text-[#b6c2cf]',
                        isDragging &&
                            'scale-105 rotate-1 shadow-2xl ring-2 ring-primary/40',
                    )}
                >
                    {/* List Header */}
                    <div className="mb-2 flex shrink-0 items-center gap-1.5 px-1 pt-0.5">
                        {/* Drag Handle */}
                        <div
                            {...dragHandleProps}
                            className="cursor-grab rounded p-0.5 text-slate-400 transition-colors hover:text-slate-700 active:cursor-grabbing dark:hover:text-slate-200"
                        >
                            <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="flex min-w-0 flex-1 items-center justify-between">
                            {isEditingTitle ? (
                                <Input
                                    value={editedTitle}
                                    onChange={(e) =>
                                        setEditedTitle(e.target.value)
                                    }
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            handleSaveTitle();
                                        if (e.key === 'Escape') {
                                            setEditedTitle(list.title);
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                    autoFocus
                                    className="mr-2 h-7 border-primary bg-white text-xs font-semibold sm:text-sm dark:bg-slate-900"
                                />
                            ) : (
                                <h3
                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 truncate text-xs font-semibold text-slate-800 transition-opacity hover:opacity-80 sm:text-sm dark:text-slate-200"
                                    onClick={() => setIsEditingTitle(true)}
                                    title={list.title}
                                >
                                    <span className="truncate">
                                        {list.title}
                                    </span>
                                    <span className="inline-flex h-4 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-slate-300/60 px-1.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {filteredCards.length}
                                    </span>
                                </h3>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 shrink-0 rounded p-0 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        Edit title
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsAddingCardInline(true)
                                        }
                                    >
                                        Add card
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setShowDeleteDialog(true)
                                        }
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
                        className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 space-y-2 overflow-x-hidden overflow-y-auto px-0.5"
                        style={{ maxHeight: 'calc(100vh - 230px)' }}
                    >
                        <Droppable droppableId={list.id.toString()}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        'min-h-3 space-y-2 rounded-lg transition-colors',
                                        snapshot.isDraggingOver &&
                                            'bg-blue-50/50 ring-2 ring-blue-500/20 ring-inset dark:bg-blue-950/20',
                                    )}
                                >
                                    <AnimatePresence>
                                        {filteredCards.map((card, index) => (
                                            <KanbanCard
                                                key={card.id}
                                                card={card}
                                                index={index}
                                                onClick={() =>
                                                    onCardClick(card.id)
                                                }
                                            />
                                        ))}
                                    </AnimatePresence>
                                    {provided.placeholder}

                                    {/* Empty State */}
                                    {filteredCards.length === 0 &&
                                        !isAddingCardInline && (
                                            <div className="px-2 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                                                {filterByUser
                                                    ? 'No cards match filter'
                                                    : 'No cards in this list'}
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
                                    onChange={(e) =>
                                        setInlineCardTitle(e.target.value)
                                    }
                                    placeholder="Enter a title for this card..."
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-normal text-foreground shadow-xs focus:ring-2 focus:ring-[#0052cc] focus:outline-none sm:text-sm dark:border-slate-700 dark:bg-slate-900"
                                    rows={2}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleInlineCardSubmit();
                                        }
                                        if (e.key === 'Escape') {
                                            setIsAddingCardInline(false);
                                            setInlineCardTitle('');
                                        }
                                    }}
                                />
                                <div className="mt-2 flex items-center gap-1.5">
                                    <Button
                                        size="sm"
                                        onClick={handleInlineCardSubmit}
                                        disabled={!inlineCardTitle.trim()}
                                        className="h-7 bg-[#0052cc] px-3 text-xs font-medium text-white shadow-xs hover:bg-[#0747a6]"
                                    >
                                        Add card
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsAddingCardInline(false);
                                            setInlineCardTitle('');
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
                        <div className="mt-1.5 shrink-0 pt-1">
                            <button
                                onClick={() => setIsAddingCardInline(true)}
                                className="group flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 sm:text-sm dark:text-slate-300 dark:hover:bg-slate-800/80"
                            >
                                <Plus className="h-4 w-4 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200" />
                                <span>Add a card</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                    <AlertTriangle className="h-6 w-6 text-destructive" />
                                </div>
                                <div>
                                    <AlertDialogTitle>
                                        Delete List
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="mt-1">
                                        Are you sure you want to delete "
                                        {list.title}"?
                                    </AlertDialogDescription>
                                </div>
                            </div>
                        </AlertDialogHeader>
                        <div className="my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                            <p className="text-sm text-muted-foreground">
                                This will permanently delete this list and all{' '}
                                {list.cards?.length || 0} cards inside it. This
                                action cannot be undone.
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
        );
    },
);
