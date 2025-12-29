import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface ActivityLog {
  id: number
  description: string
  created_at: string
  log_type: string
}

interface PaginatedResponse {
  data: ActivityLog[]
  current_page: number
  last_page: number
  next_page_url: string | null
  prev_page_url: string | null
}

export default function ActivityHistory() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginatedResponse | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchActivityLogs = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/user/profile/activity?page=${page}`)
        const data: PaginatedResponse = await response.json()
        setActivityLogs(data.data)
        setPagination(data)
      } catch (error) {
        console.error('Failed to fetch activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivityLogs()
  }, [page])

  const handleNextPage = () => {
    if (pagination?.next_page_url) {
      setPage((prevPage) => prevPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (pagination?.prev_page_url) {
      setPage((prevPage) => prevPage - 1)
    }
  }

  return (
    <Card className="border-2 hover:border-orange-500/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Activity className="h-5 w-5 text-orange-500" />
          </div>
          Activity History
        </CardTitle>
        <CardDescription>Recent activities and actions performed on your account</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.log_type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between items-center">
              <Button
                onClick={handlePrevPage}
                disabled={!pagination?.prev_page_url || loading}
              >
                Previous
              </Button>
              <span>
                Page {pagination?.current_page} of {pagination?.last_page}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={!pagination?.next_page_url || loading}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
