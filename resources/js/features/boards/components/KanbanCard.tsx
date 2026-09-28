import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Card as CardType, List as ListType } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Draggable } from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRightLeft,
    CheckCircle2,
    CheckSquare,
    Clock,
    ExternalLink,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Trash2,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanCardProps {
    card: CardType;
    index: number;
    currentListId?: number;
    allLists?: ListType[];
    onClick: () => void;
}

export const KanbanCard = React.memo(
    ({ card, index, currentListId, allLists = [], onClick }: KanbanCardProps) => {
        const hasMembers = card.members && card.members.length > 0;
        const commentCount = card.comments?.length || 0;
        const attachmentCount = card.attachments?.length || 0;
        const checklistCount = card.checklists?.length || 0;
        const completedChecklists =
            card.checklists?.filter((c: any) => c.is_completed).length || 0;
        const hasDueDate = !!card.due_date;
        const hasLabels = card.labels && card.labels.length > 0;

        // Check if due date is overdue
        const now = new Date();
        const isOverdue =
            hasDueDate && !card.is_completed && new Date(card.due_date!) < now;
        const isDueSoon =
            hasDueDate &&
            !card.is_completed &&
            !isOverdue &&
            new Date(card.due_date!).getTime() - now.getTime() <
                24 * 60 * 60 * 1000;

        // Other lists available to move card to
        const otherLists = (allLists || []).filter(
            (l) => l.id !== currentListId && l.id !== card.list_id,
        );

        const handleMoveToList = (e: React.MouseEvent, targetListId: number) => {
            e.stopPropagation();
            router.patch(
                `/cards/${card.id}/move`,
                {
                    list_id: targetListId,
                    position: 9999,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        const target = allLists.find((l) => l.id === targetListId);
                        toast.success(`Kartu dipindahkan ke ${target?.title || 'list lain'}`);
                    },
                    onError: () => toast.error('Gagal memindahkan kartu'),
                },
            );
        };

        const handleToggleComplete = (e: React.MouseEvent) => {
            e.stopPropagation();
            router.patch(
                `/cards/${card.id}`,
                {
                    is_completed: !card.is_completed,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        toast.success(
                            !card.is_completed
                                ? '✓ Kartu ditandai selesai!'
                                : 'Kartu ditandai belum selesai',
                        );
                    },
                    onError: () => toast.error('Gagal memperbarui status kartu'),
                },
            );
        };

        const handleDeleteCard = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (
                !confirm(
                    `Hapus kartu "${card.title}"? Tindakan ini tidak dapat dibatalkan.`,
                )
            ) {
                return;
            }
            router.delete(`/cards/${card.id}`, {
                preserveScroll: true,
                onSuccess: () => toast.success('Kartu berhasil dihapus'),
                onError: () => toast.error('Gagal menghapus kartu'),
            });
        };

        return (
            <Draggable draggableId={card.id.toString()} index={index}>
                {(provided, snapshot) => (
                    <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <Card
                            className={cn(
                                'group relative cursor-pointer overflow-hidden border border-slate-200/80 bg-white p-0 shadow-xs transition-all duration-150 hover:shadow-md dark:border-slate-800 dark:bg-[#22272b]',
                                snapshot.isDragging &&
                                    'scale-[1.02] rotate-1 shadow-2xl ring-2 ring-[#0052cc]',
                                card.is_completed && 'opacity-80',
                            )}
                            onClick={onClick}
                        >
                            {/* Color Bar at Top */}
                            {card.cover_color && (
                                <div
                                    className="h-4 w-full"
                                    style={{
                                        backgroundColor: card.cover_color,
                                    }}
                                />
                            )}

                            <div className="space-y-2 p-2.5 sm:p-3">
                                {/* Labels (Trello pill chips) */}
                                {hasLabels && (
                                    <div className="flex flex-wrap gap-1">
                                        {card.labels
                                            ?.slice(0, 4)
                                            .map((label: any) => (
                                                <span
                                                    key={label.id}
                                                    className="rounded-sm px-2 py-0.5 text-[10px] leading-none font-semibold tracking-wide"
                                                    style={{
                                                        backgroundColor:
                                                            label.color,
                                                        color: '#ffffff',
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        {(card.labels?.length || 0) > 4 && (
                                            <span className="rounded-sm bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                +
                                                {(card.labels?.length || 0) - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Card Title & 3-Dots Quick Action Menu */}
                                <div className="flex items-start justify-between gap-1.5">
                                    <h4
                                        className={cn(
                                            'flex-1 text-xs leading-snug font-normal text-slate-900 transition-colors group-hover:text-blue-600 sm:text-sm dark:text-slate-100 dark:group-hover:text-blue-400',
                                            card.is_completed &&
                                                'text-slate-400 line-through dark:text-slate-500',
                                        )}
                                    >
                                        {card.title}
                                    </h4>
                                    <div className="flex items-center shrink-0 gap-0.5">
                                        {card.is_completed && (
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mr-0.5" />
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                                    title="Menu opsi kartu"
                                                >
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-48 shadow-lg border bg-popover z-50"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {otherLists.length > 0 && (
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="text-xs py-1.5 cursor-pointer">
                                                            <ArrowRightLeft className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                                            <span>Pindah ke List...</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent className="w-44 z-50">
                                                            {otherLists.map((targetList) => (
                                                                <DropdownMenuItem
                                                                    key={targetList.id}
                                                                    className="text-xs py-1.5 cursor-pointer"
                                                                    onClick={(e) =>
                                                                        handleMoveToList(e, targetList.id)
                                                                    }
                                                                >
                                                                    {targetList.title}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-xs py-1.5 cursor-pointer"
                                                    onClick={handleToggleComplete}
                                                >
                                                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                                                    <span>
                                                        {card.is_completed
                                                            ? 'Tandai Belum Selesai'
                                                            : 'Tandai Selesai'}
                                                    </span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-xs py-1.5 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onClick();
                                                    }}
                                                >
                                                    <ExternalLink className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                                    <span>Buka Detail Kartu</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-xs py-1.5 text-destructive focus:text-destructive cursor-pointer"
                                                    onClick={handleDeleteCard}
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                    <span>Hapus Kartu</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Card Badges & Metadata (Trello style) */}
                                <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                                    {/* Left side: indicators */}
                                    <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
                                        {/* Due Date */}
                                        {hasDueDate && (
                                            <div
                                                className={cn(
                                                    'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                                                    card.is_completed &&
                                                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                                                    isOverdue &&
                                                        'bg-rose-100 font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                                                    isDueSoon &&
                                                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                                                    !card.is_completed &&
                                                        !isOverdue &&
                                                        !isDueSoon &&
                                                        'hover:bg-slate-100 dark:hover:bg-slate-800',
                                                )}
                                            >
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {new Date(
                                                        card.due_date!,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {/* Checklist indicator */}
                                        {checklistCount > 0 && (
                                            <div
                                                className={cn(
                                                    'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                                                    completedChecklists ===
                                                        checklistCount
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                                                )}
                                            >
                                                <CheckSquare className="h-3 w-3" />
                                                <span>
                                                    {completedChecklists}/
                                                    {checklistCount}
                                                </span>
                                            </div>
                                        )}

                                        {/* Comments count */}
                                        {commentCount > 0 && (
                                            <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                                                <MessageSquare className="h-3 w-3" />
                                                <span className="text-[10px]">
                                                    {commentCount}
                                                </span>
                                            </div>
                                        )}

                                        {/* Attachments count */}
                                        {attachmentCount > 0 && (
                                            <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                                                <Paperclip className="h-3 w-3" />
                                                <span className="text-[10px]">
                                                    {attachmentCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side: Member Avatars */}
                                    {hasMembers && (
                                        <div className="ml-auto flex -space-x-1.5">
                                            {card.members
                                                ?.slice(0, 3)
                                                .map((member) => (
                                                    <Avatar
                                                        key={member.id}
                                                        className="h-5 w-5 border-2 border-white dark:border-[#22272b]"
                                                        title={member.name}
                                                    >
                                                        <AvatarImage
                                                            src={
                                                                member.avatar
                                                                    ? `/storage/${member.avatar}`
                                                                    : undefined
                                                            }
                                                            alt={member.name}
                                                        />
                                                        <AvatarFallback className="bg-slate-200 text-[9px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                                            {member.name
                                                                .split(' ')
                                                                .map(
                                                                    (n) => n[0],
                                                                )
                                                                .join('')
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            {(card.members?.length || 0) >
                                                3 && (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[8px] font-semibold text-slate-600 dark:border-[#22272b] dark:bg-slate-700 dark:text-slate-300">
                                                    +
                                                    {(card.members?.length ||
                                                        0) - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </Draggable>
        );
    },
);
