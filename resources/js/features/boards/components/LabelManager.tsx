import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Board } from '@/lib/store'
import { router } from '@inertiajs/react'
import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface LabelManagerProps {
  board: Board
  selectedCard: any
}

export function LabelManager({ board, selectedCard }: LabelManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#0079bf')

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) {
      toast.error('Label name is required')
      return
    }

    router.post(
      `/boards/${board.id}/labels`,
      { name: newLabelName, color: newLabelColor },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Label created successfully')
          setNewLabelName('')
          setNewLabelColor('#0079bf')
          setIsCreatingLabel(false)
        },
        onError: (errors) => {
          toast.error(errors.name || 'Failed to create label')
        },
      }
    )
  }

  const handleAttachLabel = (labelId: number) => {
    router.post(
      `/cards/${selectedCard.id}/labels/${labelId}/attach`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success('Label attached'),
        onError: () => toast.error('Failed to attach label'),
      }
    )
  }

  const handleDeleteLabel = (labelId: number) => {
    if (!confirm('Delete this label? It will be removed from all cards.')) return

    router.delete(`/labels/${labelId}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Label deleted'),
      onError: () => toast.error('Failed to delete label'),
    })
  }

  const availableLabels = board.labels?.filter(
    (label) => !selectedCard.labels?.some((cl: any) => cl.id === label.id)
  ) || []

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Label
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Labels</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Available Labels to Attach */}
          {availableLabels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Available labels:</p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {availableLabels.map((label) => (
                  <div
                    key={label.id}
                    className="group flex items-center justify-between rounded border p-2 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm">{label.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAttachLabel(label.id)}
                        className="h-7 px-2"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLabel(label.id)}
                        className="h-7 px-2 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableLabels.length === 0 && !isCreatingLabel && (
            <p className="text-sm text-muted-foreground text-center py-2">
              All labels are already attached
            </p>
          )}

          {/* Create New Label */}
          {!isCreatingLabel ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsCreatingLabel(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Label
            </Button>
          ) : (
            <div className="space-y-3 rounded border p-3 bg-muted/30">
              <div className="space-y-2">
                <Label className="text-xs">Label Name</Label>
                <Input
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="e.g., Bug, Feature, Priority"
                  className="h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateLabel()
                    if (e.key === 'Escape') {
                      setIsCreatingLabel(false)
                      setNewLabelName('')
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="h-8 w-16 cursor-pointer"
                  />
                  <Input
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    placeholder="#0079bf"
                    className="h-8 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateLabel} className="flex-1">
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingLabel(false)
                    setNewLabelName('')
                    setNewLabelColor('#0079bf')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
