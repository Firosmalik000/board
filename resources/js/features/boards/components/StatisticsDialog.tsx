import { Board } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BarChart3 } from 'lucide-react'

interface StatisticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board: Board
}

interface UserStats {
  id: number
  name: string
  email: string
  avatar?: string
  totalCards: number
  completedCards: number
  percentage: number
}

// Get progress color based on percentage
const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-blue-500'
  if (percentage >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Get text color based on percentage
const getTextColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400'
  if (percentage >= 50) return 'text-blue-600 dark:text-blue-400'
  if (percentage >= 30) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export function StatisticsDialog({ open, onOpenChange, board }: StatisticsDialogProps) {
  // Calculate statistics for each user
  const calculateUserStats = (): UserStats[] => {
    const statsMap = new Map<number, UserStats>()

    // Initialize stats for all board members
    board.members?.forEach((member) => {
      statsMap.set(member.id, {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: (member as any).avatar,
        totalCards: 0,
        completedCards: 0,
        percentage: 0,
      })
    })

    // Count cards for each user
    board.lists?.forEach((list) => {
      list.cards?.forEach((card) => {
        card.members?.forEach((member) => {
          const stats = statsMap.get(member.id)
          if (stats) {
            stats.totalCards++
            if (card.is_completed) {
              stats.completedCards++
            }
          }
        })
      })
    })

    // Calculate percentages
    statsMap.forEach((stats) => {
      if (stats.totalCards > 0) {
        stats.percentage = Math.round((stats.completedCards / stats.totalCards) * 100)
      }
    })

    // Convert to array, filter users with no cards, and sort by total cards descending
    return Array.from(statsMap.values())
      .filter((stats) => stats.totalCards > 0)
      .sort((a, b) => b.totalCards - a.totalCards)
  }

  const userStats = calculateUserStats()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            User Statistics
          </DialogTitle>
          <DialogDescription>
            View progress and completion statistics for each board member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {userStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No statistics available yet. Assign cards to members to see their progress.
            </div>
          ) : (
            userStats.map((stats) => (
              <div
                key={stats.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={stats.avatar ? `/storage/${stats.avatar}` : undefined}
                      alt={stats.name}
                    />
                    <AvatarFallback>
                      {stats.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{stats.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{stats.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getTextColor(stats.percentage)}`}>
                      {stats.percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedCards}/{stats.totalCards} cards
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {stats.completedCards} completed of {stats.totalCards} total
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 ${getProgressColor(stats.percentage)}`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Overall Summary */}
        {userStats.length > 0 && (
          <div className="border-t border-border pt-4 mt-2">
            <h3 className="font-semibold mb-3 text-sm text-foreground">Overall Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border">
                <p className="text-2xl font-bold text-primary">
                  {userStats.reduce((sum, s) => sum + s.totalCards, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Cards</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {userStats.reduce((sum, s) => sum + s.completedCards, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {userStats.reduce((sum, s) => sum + (s.totalCards - s.completedCards), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">In Progress</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
