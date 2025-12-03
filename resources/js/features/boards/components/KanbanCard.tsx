import { Card as CardType } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Draggable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, Calendar } from 'lucide-react'
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
  const hasDueDate = !!card.due_date

  return (
    <Draggable draggableId={card.id.toString()} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          layout
          exit={{ opacity: 0, y: -20 }}
        >
          <Card
            className={cn(
              'mb-2 cursor-pointer border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
              snapshot.isDragging && 'rotate-2 shadow-lg',
            )}
            onClick={onClick}
            style={{
              borderLeftWidth: card.cover_color ? '6px' : '1px',
              borderLeftColor: card.cover_color || undefined,
            }}
          >
            {/* Card Title */}
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-sm font-medium">{card.title}</h4>
              {card.is_completed && (
                <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-green-600" />
              )}
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between gap-2 text-xs">
              {/* Left side - Comment count and Due date */}
              <div className="flex items-center gap-2 text-muted-foreground">
                {commentCount > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{commentCount}</span>
                  </div>
                )}
                {hasDueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(card.due_date!).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Right side - Members */}
              {hasMembers && (
                <div className="flex -space-x-2">
                  {card.members?.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatar ? `/storage/${member.avatar}` : undefined} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {(card.members?.length || 0) > 3 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      +{(card.members?.length || 0) - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </Draggable>
  )
})
