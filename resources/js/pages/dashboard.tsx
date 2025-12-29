import AppLayout from '@/layouts/app-layout'
import { dashboard } from '@/routes'
import { type BreadcrumbItem } from '@/types'
import { Head, Link, router } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutGrid,
  CheckSquare,
  TrendingUp,
  Plus,
  Users,
  User,
  Clock,
  Trello,
  Sparkles,
  ArrowRight,
  Calendar,
  Target,
  Zap,
  UserPlus
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
]

interface Board {
  id: number
  title: string
  description?: string
  background_color: string
  background_image?: string
  is_owner: boolean
  owner: {
    id: number
    name: string
  }
  members?: Array<{
    id: number
    name: string
  }>
}

interface Card {
  id: number
  title: string
  is_completed: boolean
  created_at: string
  is_creator: boolean
  list: {
    title: string
    board: {
      id: number
      title: string
    }
  }
}

interface Statistics {
  totalBoards: number
  totalCards: number
  completedTasks: number
  createdCards: number
  assignedCards: number
}

interface DashboardProps {
  statistics: Statistics
  recentBoards: Board[]
  recentCards: Card[]
  error?: string
}

export default function Dashboard({ statistics, recentBoards, recentCards, error }: DashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load form data from localStorage for persistence
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('dashboard_board_form')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {
          title: '',
          description: '',
          visibility: 'private',
          background_color: '#0079bf',
        }
      }
    }
    return {
      title: '',
      description: '',
      visibility: 'private',
      background_color: '#0079bf',
    }
  })

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboard_board_form', JSON.stringify(formData))
  }, [formData])

  // Show error toast if there's an error from backend
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      })
    }
  }, [error])

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter a board title')
      return
    }

    setIsLoading(true)
    router.post('/boards', formData, {
      onSuccess: () => {
        toast.success('Board created successfully! 🎉')
        setIsCreateDialogOpen(false)
        const resetData = {
          title: '',
          description: '',
          visibility: 'private',
          background_color: '#0079bf',
        }
        setFormData(resetData)
        // Clear localStorage after successful creation
        localStorage.removeItem('dashboard_board_form')
      },
      onError: (errors) => {
        const errorMessage = errors.title || errors.description || 'Failed to create board. Please try again.'
        toast.error(errorMessage)
      },
      onFinish: () => {
        setIsLoading(false)
      },
    })
  }

  const colors = [
    '#0079bf', '#d29034', '#519839', '#b04632', '#89609e',
    '#cd5a91', '#4bbf6b', '#00aecc', '#838c91'
  ]

  const completionRate = statistics.totalCards > 0
    ? Math.round((statistics.completedTasks / statistics.totalCards) * 100)
    : 0

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex h-full flex-1 flex-col gap-8 p-6">
        {/* Welcome Section with Enhanced Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLS41IDM5LjVoNDF2MWgtNDF6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2 mb-2"
            >
              <Sparkles className="h-6 w-6 animate-pulse" />
              <span className="text-sm font-medium opacity-90">Welcome back!</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl font-bold mb-2 tracking-tight"
            >
              Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg opacity-90"
            >
              Here's what's happening with your projects today
            </motion.p>
          </div>
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl animate-pulse" />
        </motion.div>

        {/* Statistics Cards with Gradients */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {/* Total Boards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Boards</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {statistics.totalBoards}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Active workspaces
              </p>
            </CardContent>
          </Card>
          </motion.div>

          {/* Total Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cards</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {statistics.totalCards}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Tasks created
              </p>
            </CardContent>
          </Card>
          </motion.div>

          {/* Completed Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {statistics.completedTasks}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{completionRate}%</span>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Created Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">
                {statistics.createdCards}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Cards you created
              </p>
            </CardContent>
          </Card>
          </motion.div>

          {/* Assigned Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {statistics.assignedCards}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Cards assigned to you
              </p>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Recent Boards Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trello className="h-6 w-6 text-primary" />
                Your Boards
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Quick access to your recent workspaces</p>
            </div>
            <Button asChild variant="outline" className="group">
              <Link href="/boards">
                View All
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Create New Board Card */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Card className="group cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5 transition-all duration-300 h-40 relative overflow-hidden hover:shadow-lg hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <CardContent className="flex flex-col items-center justify-center h-full space-y-3 relative z-10">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 shadow-lg">
                      <Plus className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg group-hover:text-primary transition-colors">Create New Board</p>
                      <p className="text-xs text-muted-foreground mt-1">Start organizing your tasks</p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    Create New Board
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Create a new board to organize your tasks and projects efficiently
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBoard} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold">Board Title *</Label>
                    <Input
                      id="title"
                      placeholder="My Awesome Board"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="focus-visible:ring-2 focus-visible:ring-primary transition-all h-11"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                    <Input
                      id="description"
                      placeholder="What's this board about?"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="transition-all h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility" className="text-sm font-semibold">Visibility</Label>
                    <select
                      id="visibility"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:border-primary/50"
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    >
                      <option value="private">🔒 Private - Only you can see</option>
                      <option value="team">👥 Team - Visible to team members</option>
                      <option value="public">🌍 Public - Everyone can see</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Background Color</Label>
                    <div className="grid grid-cols-9 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-11 w-11 rounded-lg transition-all hover:scale-110 shadow-md hover:shadow-lg ${
                            formData.background_color === color
                              ? 'ring-2 ring-primary ring-offset-2 scale-110'
                              : 'hover:ring-2 hover:ring-muted-foreground/30'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, background_color: color })}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-6 border-t mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="h-11 hover:bg-muted transition-colors"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 h-11 px-6 shadow-lg hover:shadow-xl transition-all"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Create Board
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Recent Boards */}
            {recentBoards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
              <Link href={`/boards/${board.id}`}>
                <Card
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 h-40 overflow-hidden border-0 shadow-md relative ring-2 ring-transparent hover:ring-primary/20"
                  style={{
                    backgroundColor: board.background_color,
                    backgroundImage: board.background_image
                      ? `url(/storage/${board.background_image})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/30 transition-all duration-300" />
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>

                  <CardContent className="relative z-10 h-full flex flex-col justify-between pb-4 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-lg drop-shadow-lg line-clamp-2 flex-1">{board.title}</h3>
                      {board.is_owner && (
                        <Badge className="bg-yellow-500/90 text-white border-0 text-xs shadow-lg">
                          Owner
                        </Badge>
                      )}
                    </div>
                    {board.description && (
                      <p className="text-xs text-white/80 line-clamp-2 mt-1 drop-shadow">{board.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3 text-xs text-white/90">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{board.members?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title={`Owner: ${board.owner.name}`}>
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[80px]">{board.owner.name}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </motion.div>
            ))}

            {recentBoards.length === 0 && (
              <Card className="sm:col-span-2 lg:col-span-2 border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center h-40 text-center">
                  <Trello className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No boards yet</p>
                  <p className="text-xs text-muted-foreground">Create your first board to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {recentCards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Your latest tasks and updates</p>
              </div>
            </div>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    >
                    <Link
                      href={`/boards/${card.list.board.id}`}
                      className="group flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm ${
                            card.is_completed
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                              : 'bg-gradient-to-br from-blue-400 to-cyan-500'
                          }`}
                        >
                          <CheckSquare className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold group-hover:text-primary transition-colors truncate">{card.title}</p>
                            {!card.is_creator && (
                              <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs shrink-0">
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {card.list.title}
                            </Badge>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground truncate">{card.list.board.title}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(card.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State for Activity */}
        {recentCards.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No recent activity</h3>
              <p className="text-sm text-muted-foreground">Start creating cards to see your activity here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
