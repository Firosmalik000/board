import { Card as CardType } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Draggable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, Calendar, Paperclip, CheckSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface KanbanCardProps {
  card: CardType
  index: number
  onClick: () => void
}

export const KanbanCard = React.memo(({ card, index, onClick }: KanbanCardProps) => {
  const hasMembers = card.members && card.members.length > 0
  const commentCount = card.comments?.length || 0
  const attachmentCount = card.attachments?.length || 0
  const checklistCount = card.checklists?.length || 0
  const completedChecklists = card.checklists?.filter((c: any) => c.is_completed).length || 0
  const hasDueDate = !!card.due_date
  const hasLabels = card.labels && card.labels.length > 0

  // Check if due date is overdue
  const now = new Date()
  const isOverdue = hasDueDate && !card.is_completed && new Date(card.due_date!) < now
  const isDueSoon =
    hasDueDate &&
    !card.is_completed &&
    !isOverdue &&
    new Date(card.due_date!).getTime() - now.getTime() < 24 * 60 * 60 * 1000

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
              'group relative cursor-pointer overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#22272b] p-0 shadow-xs hover:shadow-md transition-all duration-150',
              snapshot.isDragging && 'rotate-1 shadow-2xl scale-[1.02] ring-2 ring-[#0052cc]',
              card.is_completed && 'opacity-80'
            )}
            onClick={onClick}
          >
            {/* Color Bar at Top */}
            {card.cover_color && (
              <div className="h-4 w-full" style={{ backgroundColor: card.cover_color }} />
            )}

            <div className="p-2.5 sm:p-3 space-y-2">
              {/* Labels (Trello pill chips) */}
              {hasLabels && (
                <div className="flex flex-wrap gap-1">
                  {card.labels?.slice(0, 4).map((label: any) => (
                    <span
                      key={label.id}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-sm tracking-wide leading-none"
                      style={{
                        backgroundColor: label.color,
                        color: '#ffffff',
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                  {(card.labels?.length || 0) > 4 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      +{(card.labels?.length || 0) - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Card Title */}
              <div className="flex items-start gap-1.5">
                <h4
                  className={cn(
                    'flex-1 text-xs sm:text-sm font-normal text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors',
                    card.is_completed && 'line-through text-slate-400 dark:text-slate-500'
                  )}
                >
                  {card.title}
                </h4>
                {card.is_completed && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
              </div>

              {/* Card Badges & Metadata (Trello style) */}
              <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                {/* Left side: indicators */}
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-wrap">
                  {/* Due Date */}
                  {hasDueDate && (
                    <div
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                        card.is_completed && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                        isOverdue && 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold',
                        isDueSoon && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                        !card.is_completed && !isOverdue && !isDueSoon && 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(card.due_date!).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Checklist indicator */}
                  {checklistCount > 0 && (
                    <div
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                        completedChecklists === checklistCount
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <CheckSquare className="h-3 w-3" />
                      <span>
                        {completedChecklists}/{checklistCount}
                      </span>
                    </div>
                  )}

                  {/* Comments count */}
                  {commentCount > 0 && (
                    <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-[10px]">{commentCount}</span>
                    </div>
                  )}

                  {/* Attachments count */}
                  {attachmentCount > 0 && (
                    <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                      <Paperclip className="h-3 w-3" />
                      <span className="text-[10px]">{attachmentCount}</span>
                    </div>
                  )}
                </div>

                {/* Right side: Member Avatars */}
                {hasMembers && (
                  <div className="flex -space-x-1.5 ml-auto">
                    {card.members?.slice(0, 3).map((member) => (
                      <Avatar
                        key={member.id}
                        className="h-5 w-5 border-2 border-white dark:border-[#22272b]"
                        title={member.name}
                      >
                        <AvatarImage
                          src={member.avatar ? `/storage/${member.avatar}` : undefined}
                          alt={member.name}
                        />
                        <AvatarFallback className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(card.members?.length || 0) > 3 && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-[#22272b] bg-slate-200 dark:bg-slate-700 text-[8px] font-semibold text-slate-600 dark:text-slate-300">
                        +{(card.members?.length || 0) - 3}
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
  )
})
