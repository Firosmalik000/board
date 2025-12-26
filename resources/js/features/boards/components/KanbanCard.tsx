import { Card as CardType } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Draggable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, Calendar, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  const isOverdue = hasDueDate && !card.is_completed && new Date(card.due_date!) < new Date()
  const isDueSoon = hasDueDate && !card.is_completed && new Date(card.due_date!) < new Date(Date.now() + 24 * 60 * 60 * 1000)

  return (
    <Draggable draggableId={card.id.toString()} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            className={cn(
              'group relative mb-3 cursor-pointer overflow-hidden border-0 bg-card p-0 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
              snapshot.isDragging && 'rotate-3 shadow-2xl scale-105 ring-2 ring-primary/50',
              card.is_completed && 'opacity-75',
            )}
            onClick={onClick}
          >
            {/* Color Bar at Top */}
            {card.cover_color && (
              <div
                className="h-2 w-full"
                style={{ backgroundColor: card.cover_color }}
              />
            )}

            <div className="p-4 space-y-3">
              {/* Labels */}
              {hasLabels && (
                <div className="flex flex-wrap gap-1.5">
                  {card.labels?.slice(0, 3).map((label: any) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs font-medium border-0"
                      style={{
                        backgroundColor: label.color + '15',
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {(card.labels?.length || 0) > 3 && (
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                      +{(card.labels?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Card Title */}
              <div className="flex items-start gap-2">
                <h4 className={cn(
                  "flex-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors",
                  card.is_completed && "line-through text-muted-foreground"
                )}>
                  {card.title}
                </h4>
                {card.is_completed && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 drop-shadow-sm" />
                )}
              </div>

              {/* Card Metadata */}
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* Left side - Icons */}
                <div className="flex items-center gap-3 text-muted-foreground">
                  {hasDueDate && (
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                      isOverdue && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                      isDueSoon && !isOverdue && "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
                      !isOverdue && !isDueSoon && "bg-muted"
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {new Date(card.due_date!).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  )}

                  {checklistCount > 0 && (
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md",
                      completedChecklists === checklistCount ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-muted"
                    )}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="font-medium">{completedChecklists}/{checklistCount}</span>
                    </div>
                  )}

                  {commentCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="font-medium">{commentCount}</span>
                    </div>
                  )}

                  {attachmentCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="font-medium">{attachmentCount}</span>
                    </div>
                  )}
                </div>

                {/* Right side - Members */}
                {hasMembers && (
                  <div className="flex -space-x-2">
                    {card.members?.slice(0, 3).map((member) => (
                      <Avatar
                        key={member.id}
                        className="h-7 w-7 border-2 border-background ring-1 ring-border transition-transform hover:scale-110 hover:z-10"
                      >
                        <AvatarImage src={member.avatar ? `/storage/${member.avatar}` : undefined} alt={member.name} />
                        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(card.members?.length || 0) > 3 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted/50 text-xs font-semibold ring-1 ring-border">
                        +{(card.members?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-lg pointer-events-none transition-colors" />
          </Card>
        </motion.div>
      )}
    </Draggable>
  )
})
