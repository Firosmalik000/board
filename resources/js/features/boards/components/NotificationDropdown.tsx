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
}

export function NotificationDropdown({ activities }: NotificationDropdownProps) {
  const unreadCount = activities.length > 0 ? activities.slice(0, 5).length : 0

  const getActivityMessage = (activity: Activity) => {
    const entityName = activity.metadata?.entity_name || activity.entity_type
    const metadata = activity.metadata || {}

    switch (activity.action) {
      case 'created':
        if (activity.entity_type === 'card' && metadata.list_name) {
          return `created card "${entityName}" in list "${metadata.list_name}"`
        }
        if (activity.entity_type === 'list') {
          return `created list "${entityName}"`
        }
        return `created ${activity.entity_type} "${entityName}"`

      case 'updated':
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
          return `moved card "${entityName}" from "${metadata.from_list}" to "${metadata.to_list}"`
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

      default:
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
    <DropdownMenu>
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
