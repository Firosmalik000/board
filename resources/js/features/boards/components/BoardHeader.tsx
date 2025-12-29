import { Board } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { MoreHorizontal, Users, Star, Archive, Trash2, UserPlus, Globe, Lock, RefreshCw, Image, Filter, X, BarChart3 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { router, usePage } from '@inertiajs/react'
import { NotificationDropdown } from './NotificationDropdown'
import { StatisticsDialog } from './StatisticsDialog'
import { cn } from '@/lib/utils'

interface BoardHeaderProps {
  board: Board
  onBoardUpdate: () => void
  lastSyncTime?: Date
  isPolling?: boolean
  onTogglePolling?: () => void
  activities?: any[]
  totalActivities?: number
  filterByUser?: number | null
  onFilterChange?: (userId: number | null) => void
  onCardClick?: (cardId: number) => void
}

export function BoardHeader({ board, onBoardUpdate, lastSyncTime, isPolling, onTogglePolling, activities = [], totalActivities, filterByUser, onFilterChange, onCardClick }: BoardHeaderProps) {
  const { auth } = usePage().props as any
  const currentUser = auth?.user
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [isStatisticsDialogOpen, setIsStatisticsDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isLoading, setIsLoading] = useState(false)
  const [timeSinceSync, setTimeSinceSync] = useState('')
  const backgroundImageInputRef = useRef<HTMLInputElement>(null)
  // Check if current user is admin or owner
  const isCurrentUserAdmin = () => {
    if (!currentUser) return false
    if (board.owner_id === currentUser.id) return true
    const currentMember = board.members?.find((m: any) => m.id === currentUser.id)
    return currentMember?.pivot?.role === 'admin' || currentMember?.pivot?.role === 'owner'
  }

  // Update time since last sync
  useEffect(() => {
    if (!lastSyncTime) return

    const updateTime = () => {
      const seconds = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 1000)
      if (seconds < 5) {
        setTimeSinceSync('just now')
      } else if (seconds < 60) {
        setTimeSinceSync(`${seconds}s ago`)
      } else {
        const minutes = Math.floor(seconds / 60)
        setTimeSinceSync(`${minutes}m ago`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [lastSyncTime])

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsLoading(true)
    router.post(
      `/boards/${board.id}/invite`,
      {
        email: inviteEmail,
        role: inviteRole,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setInviteEmail('')
          setIsInviteDialogOpen(false)
          toast.success('Invitation sent successfully')
          onBoardUpdate()
        },
        onError: (errors) => {
          if (errors.email) {
            toast.error(errors.email)
          } else {
            toast.error('Failed to invite member')
          }
        },
        onFinish: () => {
          setIsLoading(false)
        },
      }
    )
  }

  const handleArchiveBoard = () => {
    if (!confirm('Are you sure you want to archive this board?')) return

    router.patch(
      `/boards/${board.id}`,
      { is_archived: true },
      {
        onSuccess: () => {
          toast.success('Board archived')
          router.visit('/boards')
        },
        onError: () => {
          toast.error('Failed to archive board')
        },
      }
    )
  }

  const handleDeleteBoard = () => {
    if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) return

    router.delete(`/boards/${board.id}`, {
      onSuccess: () => {
        toast.success('Board deleted')
        router.visit('/boards')
      },
      onError: () => {
        toast.error('Failed to delete board')
      },
    })
  }

  const handleUpdateMemberRole = (userId: number, newRole: 'admin' | 'member') => {
    router.patch(
      `/boards/${board.id}/members/${userId}`,
      { role: newRole },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Member role updated')
          onBoardUpdate()
        },
        onError: () => {
          toast.error('Failed to update member role')
        },
      }
    )
  }

  const handleRemoveMember = (userId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this board?`)) return

    router.delete(`/boards/${board.id}/members/${userId}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Member removed successfully')
        onBoardUpdate()
      },
      onError: () => {
        toast.error('Failed to remove member')
      },
    })
  }

  const handleUploadBackgroundImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('background_image', file)

    router.post(`/boards/${board.id}/background-image`, formData, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Background image updated')
        onBoardUpdate()
        if (backgroundImageInputRef.current) {
          backgroundImageInputRef.current.value = ''
        }
      },
      onError: (errors) => {
        console.error(errors)
        toast.error('Failed to upload background image')
      },
    })
  }

  const handleRemoveBackgroundImage = () => {
    if (!confirm('Are you sure you want to remove the background image?')) return

    router.delete(`/boards/${board.id}/background-image`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Background image removed')
        onBoardUpdate()
      },
      onError: () => {
        toast.error('Failed to remove background image')
      },
    })
  }

  const getVisibilityIcon = () => {
    switch (board.visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'team':
        return <Users className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Sidebar Toggle - Only visible on mobile */}
          <SidebarTrigger className="md:hidden shrink-0" />

          <div
            className="h-8 w-8 sm:h-10 sm:w-10 rounded shrink-0"
            style={{ backgroundColor: board.background_color }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate">{board.title}</h1>
            {board.description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{board.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="gap-1 hidden sm:flex">
            {getVisibilityIcon()}
            <span className="capitalize">{board.visibility}</span>
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Sync Indicator */}
          {lastSyncTime && (
            <button
              onClick={onTogglePolling}
              className="flex items-center gap-1.5 sm:gap-2 rounded-md border px-2 sm:px-3 py-1.5 text-xs hover:bg-muted transition-colors shrink-0"
              title={isPolling ? 'Auto-sync enabled (click to disable)' : 'Auto-sync disabled (click to enable)'}
            >
              <RefreshCw className={`h-3 w-3 ${isPolling ? 'animate-spin-slow' : ''}`} />
              <span className="text-muted-foreground hidden sm:inline">
                {isPolling ? `Synced ${timeSinceSync}` : 'Sync paused'}
              </span>
            </button>
          )}

          {/* Members Avatars - Clickable to open members dialog */}
          <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex -space-x-2 hover:opacity-80 transition-opacity shrink-0">
                {board.members?.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-background">
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
                {(board.members?.length || 0) > 3 && (
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                    +{(board.members?.length || 0) - 3}
                  </div>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Board Members ({board.members?.length || 0})</DialogTitle>
                <DialogDescription>
                  Manage members and their roles on this board
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
                {board.members?.map((member) => {
                  const memberRole = member.pivot?.role || 'member'
                  const isOwner = board.owner_id === member.id

                  return (
                    <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar ? `/storage/${member.avatar}` : undefined} alt={member.name} />
                          <AvatarFallback>
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <Badge variant="default">Owner</Badge>
                        ) : isCurrentUserAdmin() ? (
                          <>
                            <select
                              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                              value={memberRole}
                              onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'admin' | 'member')}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary" className="capitalize">{memberRole}</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Notification Dropdown */}
          <NotificationDropdown activities={activities} boardId={board.id} totalActivities={totalActivities} onCardClick={onCardClick} />

          {/* Statistics Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatisticsDialogOpen(true)}
            className="gap-1 sm:gap-2 transition-all duration-200 shadow-sm hover:shadow shrink-0"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium hidden sm:inline">Statistics</span>
          </Button>

          {/* Filter by Assigned User */}
          {onFilterChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1 sm:gap-2 transition-all duration-200 shadow-sm shrink-0",
                    filterByUser && 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span className="font-medium hidden sm:inline">
                    {filterByUser
                      ? board.members?.find(m => m.id === filterByUser)?.name?.split(' ')[0] || 'Filter'
                      : 'Filter'}
                  </span>
                  {filterByUser && (
                    <X
                      className="h-3.5 w-3.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onFilterChange(null) }}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">Filter by assigned user</div>
                <DropdownMenuSeparator />
                {board.members?.map((member) => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => onFilterChange(member.id)}
                    className={filterByUser === member.id ? 'bg-accent' : ''}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={member.avatar ? `/storage/${member.avatar}` : undefined} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                  </DropdownMenuItem>
                ))}
                {filterByUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onFilterChange(null)}>
                      <X className="mr-2 h-4 w-4" />
                      Clear filter
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Invite Member Button - Only for Admin */}
          {isCurrentUserAdmin() && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 shadow-sm hover:shadow transition-all shrink-0">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium hidden sm:inline">Invite</span>
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Member to Board</DialogTitle>
                <DialogDescription>
                  Send an invitation to collaborate on this board
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button onClick={handleInviteMember} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          )}

          {/* Board Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                Add to Favorites
              </DropdownMenuItem>
              {isCurrentUserAdmin() && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => backgroundImageInputRef.current?.click()}>
                    <Image className="mr-2 h-4 w-4" />
                    Change Background Image
                  </DropdownMenuItem>
                  {board.background_image && (
                    <DropdownMenuItem onClick={handleRemoveBackgroundImage}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Background Image
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchiveBoard}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Board
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteBoard} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Board
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file input for background image */}
          <input
            ref={backgroundImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadBackgroundImage}
            className="hidden"
          />
        </div>
      </div>

      {/* Statistics Dialog */}
      <StatisticsDialog
        open={isStatisticsDialogOpen}
        onOpenChange={setIsStatisticsDialogOpen}
        board={board}
      />
    </div>
  )
}
