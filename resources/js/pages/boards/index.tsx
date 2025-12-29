import AppLayout from '@/layouts/app-layout'
import { Board } from '@/lib/store'
import { type BreadcrumbItem } from '@/types'
import { Head, router, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Plus, Users, Lock, Globe, CheckCircle2, Clock, Layers, Search, SortAsc } from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Boards',
    href: '/boards',
  },
]

interface BoardsProps {
  boards: Board[]
}

export default function BoardsIndex({ boards: initialBoards }: BoardsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated')

  const { data, setData, post, processing, reset, errors } = useForm({
    title: '',
    description: '',
    visibility: 'private' as 'private' | 'team' | 'public',
    background_color: '#0079bf',
  })

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault()

    if (!data.title.trim()) {
      toast.error('Please enter a board title')
      return
    }

    post('/boards', {
      onSuccess: () => {
        toast.success('Board created successfully')
        setIsCreateDialogOpen(false)
        reset()
      },
      onError: (errors) => {
        toast.error(errors.title || 'Failed to create board')
      },
    })
  }

  const getVisibilityConfig = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return {
          icon: <Globe className="h-3.5 w-3.5" />,
          label: 'Public',
          color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30'
        }
      case 'team':
        return {
          icon: <Users className="h-3.5 w-3.5" />,
          label: 'Team',
          color: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/20 dark:border-purple-500/30'
        }
      default:
        return {
          icon: <Lock className="h-3.5 w-3.5" />,
          label: 'Private',
          color: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-500/30'
        }
    }
  }

  // Calculate board statistics
  const getBoardStats = (board: Board) => {
    const totalCards = board.lists?.reduce((sum, list) => sum + (list.cards?.length || 0), 0) || 0
    const completedCards = board.lists?.reduce((sum, list) =>
      sum + (list.cards?.filter(card => card.is_completed).length || 0), 0
    ) || 0
    const completionPercentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0

    return {
      totalCards,
      completedCards,
      completionPercentage,
      totalLists: board.lists?.length || 0,
      totalMembers: board.members?.length || 0
    }
  }

  // Filter and sort boards
  const filteredAndSortedBoards = useMemo(() => {
    let filtered = initialBoards.filter(board =>
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        default:
          return 0
      }
    })
  }, [initialBoards, searchQuery, sortBy])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Boards" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              My Boards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {initialBoards.length} {initialBoards.length === 1 ? 'board' : 'boards'} • Manage your projects and tasks
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg hover:shadow-xl transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
                <DialogDescription>
                  Create a new board to organize your tasks and collaborate with your team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBoard}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Board Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Marketing Campaign 2024"
                      value={data.title}
                      onChange={(e) => setData('title', e.target.value)}
                      error={errors.title}
                      autoFocus
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of this board"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                      value={data.visibility}
                      onChange={(e) =>
                        setData('visibility', e.target.value as 'private' | 'team' | 'public')
                      }
                    >
                      <option value="private">🔒 Private - Only you can see</option>
                      <option value="team">👥 Team - Team members can see</option>
                      <option value="public">🌍 Public - Anyone can see</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Board Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="color"
                        type="color"
                        value={data.background_color}
                        onChange={(e) => setData('background_color', e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <div
                        className="flex-1 h-10 rounded-md border"
                        style={{ backgroundColor: data.background_color }}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Board'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Bar */}
        {initialBoards.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'updated' | 'created')}
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* Boards Grid */}
        {filteredAndSortedBoards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center max-w-md">
              {searchQuery ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted dark:bg-muted/50 border border-border flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold">No boards found</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search to find what you're looking for
                  </p>
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center mb-4">
                    <Layers className="h-8 w-8 text-primary dark:text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold">No boards yet</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first board to start organizing your tasks and collaborating with your team
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Board
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedBoards.map((board, index) => {
              const stats = getBoardStats(board)
              const visibilityConfig = getVisibilityConfig(board.visibility)

              return (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="group cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] overflow-hidden border-0 ring-1 ring-border/50 dark:ring-border hover:ring-2 hover:ring-primary/50 dark:hover:ring-primary/40 bg-card dark:bg-card"
                    onClick={() => router.visit(`/boards/${board.id}`)}
                  >
                    {/* Color Bar */}
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: board.background_color }}
                    />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
                          {board.title}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 gap-1 border ${visibilityConfig.color}`}
                        >
                          {visibilityConfig.icon}
                          <span className="text-xs font-medium">{visibilityConfig.label}</span>
                        </Badge>
                      </div>
                      {board.description && (
                        <CardDescription className="line-clamp-2 text-xs">
                          {board.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Progress Bar */}
                      {stats.totalCards > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Progress</span>
                            <span className="font-semibold text-primary">{stats.completionPercentage}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary dark:bg-secondary/50">
                            <div
                              className="h-full transition-all duration-500 bg-gradient-to-r from-primary via-primary to-primary/80 dark:from-primary dark:via-primary dark:to-primary/90"
                              style={{ width: `${stats.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50 dark:bg-muted/30 border border-border/50">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">{stats.totalLists}</span>
                          <span className="text-[10px] text-muted-foreground">Lists</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50 dark:bg-muted/30 border border-border/50">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">
                            {stats.completedCards}/{stats.totalCards}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Cards</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50 dark:bg-muted/30 border border-border/50">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">{stats.totalMembers}</span>
                          <span className="text-[10px] text-muted-foreground">Members</span>
                        </div>
                      </div>

                      {/* Members Avatars */}
                      {board.members && board.members.length > 0 && (
                        <div className="flex items-center gap-2 pt-2">
                          <div className="flex -space-x-2">
                            {board.members.slice(0, 4).map((member) => (
                              <Avatar
                                key={member.id}
                                className="h-7 w-7 border-2 border-background ring-1 ring-border"
                              >
                                <AvatarImage
                                  src={member.avatar ? `/storage/${member.avatar}` : undefined}
                                  alt={member.name}
                                />
                                <AvatarFallback className="text-[10px] font-semibold">
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {board.members.length > 4 && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold ring-1 ring-border">
                                +{board.members.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Last Updated */}
                      {board.updated_at && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Updated {formatDistanceToNow(new Date(board.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    {/* Hover Border Effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 dark:group-hover:border-primary/30 rounded-lg pointer-events-none transition-colors" />
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
