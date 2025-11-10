import AppLayout from '@/layouts/app-layout'
import { Board } from '@/lib/store'
import { type BreadcrumbItem } from '@/types'
import { Head, router, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Plus, Users, Lock, Globe } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'team':
        return <Users className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Boards" />

      <div className="flex h-full flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Boards</h1>
            <p className="text-muted-foreground">Manage your projects and tasks</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBoard}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Board Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter board title"
                      value={data.title}
                      onChange={(e) => setData('title', e.target.value)}
                      error={errors.title}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Enter board description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={data.visibility}
                      onChange={(e) =>
                        setData('visibility', e.target.value as 'private' | 'team' | 'public')
                      }
                    >
                      <option value="private">Private</option>
                      <option value="team">Team</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Background Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={data.background_color}
                      onChange={(e) => setData('background_color', e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Board'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boards Grid */}
        {initialBoards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">No boards yet</h2>
              <p className="mt-2 text-muted-foreground">Create your first board to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Board
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {initialBoards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => router.visit(`/boards/${board.id}`)}
                  style={{
                    borderTop: `4px solid ${board.background_color}`,
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1">{board.title}</CardTitle>
                      {getVisibilityIcon(board.visibility)}
                    </div>
                    {board.description && (
                      <CardDescription className="line-clamp-2">{board.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{board.lists?.length || 0} lists</span>
                      {board.members && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{board.members.length} members</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
