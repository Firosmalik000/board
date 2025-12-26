import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect } from 'react'

interface Activity {
  id: number
  user: {
    id: number
    name: string
    email: string
    avatar: string | null
  }
  action: string
  entity_type: string
  metadata?: {
    entity_name?: string
    board_name?: string
  }
  created_at: string
}

interface NotificationDropdownProps {
  activities: Activity[]
  boardId: number
}

export function NotificationDropdown({ activities, boardId }: NotificationDropdownProps) {
  const [lastReadTime, setLastReadTime] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load last read time from localStorage on mount
  useEffect(() => {
    const storageKey = `board_${boardId}_last_read`
    const savedTime = localStorage.getItem(storageKey)
    setLastReadTime(savedTime)
  }, [boardId])

  // Calculate unread count - activities newer than last read time
  const unreadCount = activities.filter(activity => {
    if (!lastReadTime) return true // If never read, all are unread
    return new Date(activity.created_at) > new Date(lastReadTime)
  }).length

  // Mark all as read when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (open && activities.length > 0) {
      // Save current timestamp as last read time
      const now = new Date().toISOString()
      const storageKey = `board_${boardId}_last_read`
      localStorage.setItem(storageKey, now)
      setLastReadTime(now)
    }
  }

  const getActivityMessage = (activity: Activity) => {
    const entityName = activity.metadata?.entity_name || activity.entity_type
    const metadata = activity.metadata || {}

    switch (activity.action) {
      case 'created':
        if (activity.entity_type === 'card' && metadata.list_name) {
          const cardName = metadata.card_title || entityName
          return `created card "${cardName}" in list "${metadata.list_name}"`
        }
        if (activity.entity_type === 'list') {
          return `created list "${entityName}"`
        }
        return `created ${activity.entity_type} "${entityName}"`

      case 'updated':
        if (activity.entity_type === 'card' && metadata.changed_fields) {
          const fields = metadata.changed_fields as string[]

          // Handle list_id change specially - it's a move action
          if (fields.includes('list_id') && fields.length === 1) {
            return `moved card "${metadata.card_title || entityName}"${metadata.list_name ? ` to list "${metadata.list_name}"` : ''}`
          }

          const fieldLabels: Record<string, string> = {
            title: 'title',
            description: 'description',
            due_date: 'due date',
            is_completed: 'completion status',
            list_id: 'list',
            category: 'category',
            is_archived: 'archive status',
            cover_color: 'cover color',
            position: 'position',
            member_ids: 'assigned members'
          }

          // Filter out list_id if there are other changes (show it separately)
          const fieldsToShow = fields.filter(f => f !== 'list_id' && f !== 'position')

          if (fieldsToShow.length === 0 && fields.includes('list_id')) {
            return `moved card "${metadata.card_title || entityName}"${metadata.list_name ? ` to list "${metadata.list_name}"` : ''}`
          }

          const changedFieldLabels = fieldsToShow.map(f => fieldLabels[f] || f).join(', ')
          let message = `updated ${changedFieldLabels} of card "${metadata.card_title || entityName}"`

          // Add list info if available
          if (metadata.list_name) {
            message += ` in list "${metadata.list_name}"`
          }

          // If list was also changed, mention it
          if (fields.includes('list_id') && fieldsToShow.length > 0) {
            message += ' and moved it to another list'
          }

          return message
        }
        if (activity.entity_type === 'card' && metadata.list_name) {
          return `updated card "${entityName}" in list "${metadata.list_name}"`
        }
        if (metadata.change === 'background_image') {
          return `updated board background image`
        }
        if (metadata.change === 'removed_background_image') {
          return `removed board background image`
        }
        return `updated ${activity.entity_type} "${entityName}"`

      case 'deleted':
        if (activity.entity_type === 'card' && metadata.list_name) {
          return `deleted card "${metadata.card_title || entityName}" from list "${metadata.list_name}"`
        }
        return `deleted ${activity.entity_type} "${entityName}"`

      case 'moved':
        if (activity.entity_type === 'card' && metadata.from_list && metadata.to_list) {
          const cardName = metadata.card_title || entityName
          return `moved card "${cardName}" from "${metadata.from_list}" to "${metadata.to_list}"`
        }
        if (activity.entity_type === 'list') {
          return `reordered list "${entityName}"`
        }
        return `moved ${activity.entity_type} "${entityName}"`

      case 'commented':
        if (metadata.card_title) {
          return `commented on card "${metadata.card_title}"`
        }
        return `commented on ${activity.entity_type} "${entityName}"`

      case 'updated_comment':
        if (metadata.card_title) {
          return `edited a comment on card "${metadata.card_title}"`
        }
        return `edited a comment`

      case 'deleted_comment':
        if (metadata.card_title) {
          return `deleted a comment from card "${metadata.card_title}"`
        }
        return `deleted a comment`

      case 'assigned_member':
        if (metadata.member_name && metadata.card_title) {
          return `assigned ${metadata.member_name} to card "${metadata.card_title}"`
        }
        return `assigned a member to card "${entityName}"`

      case 'unassigned_member':
        if (metadata.member_name && metadata.card_title) {
          return `removed ${metadata.member_name} from card "${metadata.card_title}"`
        }
        return `removed a member from card "${entityName}"`

      case 'uploaded_attachment':
        if (metadata.card_title) {
          return `uploaded an attachment to card "${metadata.card_title}"`
        }
        return `uploaded an attachment`

      case 'deleted_attachment':
        if (metadata.card_title) {
          return `deleted an attachment from card "${metadata.card_title}"`
        }
        return `deleted an attachment`

      case 'invited':
        if (metadata.email) {
          return `invited ${metadata.email} to the board`
        }
        return `invited a new member to the board`

      case 'updated_member_role':
        if (metadata.member_name && metadata.new_role) {
          return `changed ${metadata.member_name}'s role to ${metadata.new_role}`
        }
        return `updated a member's role`

      case 'removed_member':
        if (metadata.member_name) {
          return `removed ${metadata.member_name} from the board`
        }
        return `removed a member from the board`

      case 'added_checklist_item':
        if (metadata.card_title) {
          return `added a checklist item to card "${metadata.card_title}"`
        }
        return `added a checklist item`

      case 'updated_checklist_item':
        if (metadata.card_title) {
          return `updated a checklist item in card "${metadata.card_title}"`
        }
        return `updated a checklist item`

      case 'deleted_checklist_item':
        if (metadata.card_title) {
          return `deleted a checklist item from card "${metadata.card_title}"`
        }
        return `deleted a checklist item`

      case 'attached_label':
        if (metadata.card_title && metadata.label_name) {
          return `attached label "${metadata.label_name}" to card "${metadata.card_title}"`
        }
        return `attached a label to a card`

      case 'detached_label':
        if (metadata.card_title && metadata.label_name) {
          return `removed label "${metadata.label_name}" from card "${metadata.card_title}"`
        }
        return `removed a label from a card`

      case 'mentioned':
        if (activity.entity_type === 'comment' && metadata.card_title) {
          return `mentioned you in a comment on card "${metadata.card_title}"`
        }
        if (activity.entity_type === 'card' && metadata.card_title) {
          return `mentioned you in the description of card "${metadata.card_title}"`
        }
        return `mentioned you`

      default:
        // Handle label entity type for create/update/delete
        if (activity.entity_type === 'label') {
          if (activity.action === 'created' && metadata.label_name) {
            return `created label "${metadata.label_name}"`
          }
          if (activity.action === 'updated' && metadata.label_name) {
            return `updated label "${metadata.label_name}"`
          }
          if (activity.action === 'deleted' && metadata.label_name) {
            return `deleted label "${metadata.label_name}"`
          }
        }
        return `${activity.action} ${activity.entity_type} "${entityName}"`
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Latest changes in this board
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="divide-y">
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={activity.user.avatar ? `/storage/${activity.user.avatar}` : undefined}
                        alt={activity.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {getActivityMessage(activity)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {activities.length > 10 && (
          <div className="px-4 py-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Showing 10 of {activities.length} activities
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
