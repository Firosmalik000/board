import { Card as CardType } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Draggable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, MessageSquare, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  backlog: '#6B7280',
  todo: '#3B82F6',
  in_progress: '#F59E0B',
  review: '#8B5CF6',
  testing: '#EC4899',
  done: '#10B981',
  bug: '#EF4444',
  feature: '#06B6D4',
  improvement: '#14B8A6',
}

const CATEGORY_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'In Review',
  testing: 'Testing',
  done: 'Done',
  bug: 'Bug',
  feature: 'Feature',
  improvement: 'Improvement',
}

interface KanbanCardProps {
  card: CardType & { comments?: any[]; category?: string }
  index: number
  onClick: () => void
}

export function KanbanCard({ card, index, onClick }: KanbanCardProps) {
  const hasDeadline = !!card.due_date
  const hasLabels = card.labels && card.labels.length > 0
  const hasMembers = card.members && card.members.length > 0
  const hasCategory = !!card.category
  const commentCount = card.comments?.length || 0

  return (
    <Draggable draggableId={card.id.toString()} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            className={cn(
              'mb-2 cursor-pointer border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
              snapshot.isDragging && 'rotate-2 shadow-lg',
            )}
            onClick={onClick}  
            style={{
              // borderLeftWidth: card.cover_color ? '4px' : undefined,
              // borderLeftColor: card.cover_color || undefined,
              backgroundColor: card.cover_color || undefined,

            }}
          >
            {/* Card Title */}
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-sm font-medium">{card.title}</h4>
              {card.is_completed && (
                <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-green-600" />
              )}
            </div>

            {/* Category Badge */}
            {/* {hasCategory && (
              <div className="mb-2">
                <Badge
                  variant="secondary"
                  className="text-xs font-medium"
                  style={{
                    backgroundColor: (CATEGORY_COLORS[card.category!] || '#6B7280') + '20',
                    borderColor: CATEGORY_COLORS[card.category!] || '#6B7280',
                    color: CATEGORY_COLORS[card.category!] || '#6B7280',
                  }}
                >
                  <FolderKanban className="mr-1 h-3 w-3" />
                  {CATEGORY_LABELS[card.category!] || card.category}
                </Badge>
              </div>
            )} */}

            {/* Labels */}
            {hasLabels && (
              <div className="mb-2 flex flex-wrap gap-1">
                {card.labels?.map((label) => (
                  <Badge
                    key={label.id}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: label.color + '20',
                      borderColor: label.color,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Card Footer */}
            <div className="flex items-center justify-between text-xs ">
              <div className="flex items-center gap-2">
                {hasDeadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(card.due_date!).toLocaleDateString()}</span>
                  </div>
                )}
                {commentCount > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{commentCount}</span>
                  </div>
                )}
              </div>

              {/* Members */}
              {hasMembers && (
                <div className="flex -space-x-2">
                  {card.members?.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
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
}
