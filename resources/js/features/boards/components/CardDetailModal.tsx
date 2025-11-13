import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { Calendar, User, Tag, MessageSquare, FolderKanban, Paperclip, Download, Trash2, Eye, UserPlus, X, CheckSquare, Plus, MoreVertical } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Board } from '@/lib/store'
import { FileIcon } from 'lucide-react'
import { usePage } from '@inertiajs/react'
import { SharedData } from '@/types'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface CardDetailModalProps {
  open: boolean
  onClose: () => void
  selectedCard: any
  cardMode: 'view' | 'create'
  board: Board
  onFieldChange: (field: string, value: any) => void
  onSave: (e: React.FormEvent) => void
  hasChanges: boolean
  newComment: string
  onCommentChange: (value: string) => void
  onAddComment: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteAttachment: (attachmentId: number) => void
  onOpenPreview: (url: string, filename: string) => void
  onToggleMember: (userId: number) => void
  isUploadingFile: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function CardDetailModal({
  open,
  onClose,
  selectedCard,
  cardMode,
  board,
  onFieldChange,
  onSave,
  hasChanges,
  newComment,
  onCommentChange,
  onAddComment,
  onFileUpload,
  onDeleteAttachment,
  onOpenPreview,
  onToggleMember,
  isUploadingFile,
  fileInputRef,
}: CardDetailModalProps) {
  if (!selectedCard) return null

  const { auth } = usePage<SharedData>().props
  const currentUser = auth?.user

  // Check if current user is admin in this board
  const currentUserMembership = board.members?.find((m: any) => m.id === currentUser?.id)
  const isAdmin = currentUserMembership?.pivot?.role === 'admin' || board.owner_id === currentUser?.id

  // In create mode, enrich member objects with full data from board.members
  const enrichedMembers = cardMode === 'create'
    ? selectedCard.members?.map((m: any) => {
        const fullMember = board.members?.find((bm: any) => bm.id === m.id)
        return fullMember || m
      })
    : selectedCard.members

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-[90vw] max-w-[1600px] overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {cardMode === 'create' ? 'Create New Card' : selectedCard.title || 'Edit Card'}
            </DialogTitle>
            {cardMode === 'view' && selectedCard.list && (
              <p className="text-sm text-muted-foreground">
                in list <span className="font-medium">{selectedCard.list?.title}</span>
              </p>
            )}
          </DialogHeader>

          {/* Card Details */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              {/* Title */}
              <div>
                <Label className="text-base font-semibold">Title *</Label>
                <Input
                  value={selectedCard.title || ''}
                  onChange={(e) => onFieldChange('title', e.target.value)}
                  placeholder="Enter card title..."
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-base font-semibold">Description</Label>
                <Textarea
                  value={selectedCard.description || ''}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="mt-2 min-h-24"
                />
              </div>

              {/* Attachments */}
              <div>
                <Label className="text-base font-semibold">
                  <Paperclip className="mr-2 inline h-4 w-4" />
                  Attachments
                </Label>

                <div className="mt-4 space-y-3">
                  {selectedCard.attachments?.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                    >
                      {attachment.is_image ? (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                          <img
                            src={attachment.url}
                            alt={attachment.original_filename}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted">
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{attachment.original_filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.human_file_size} • Uploaded by {attachment.uploader?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attachment.created_at).toLocaleString()}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {attachment.is_image && (
                            <DropdownMenuItem
                              onClick={() => onOpenPreview(attachment.url, attachment.original_filename)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer" download>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </DropdownMenuItem>
                          {cardMode === 'view' && (
                            <DropdownMenuItem
                              onClick={() => onDeleteAttachment(attachment.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {/* Upload Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={onFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile || cardMode === 'create'}
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      {isUploadingFile ? 'Uploading...' : 'Add Attachment'}
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">Max file size: 10MB</p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              {cardMode === 'view' && <ChecklistSection selectedCard={selectedCard} />}

              {/* Comments - Only show in edit mode */}
              {cardMode === 'view' && (
                <div>
                  <Label className="text-base font-semibold">
                    <MessageSquare className="mr-2 inline h-4 w-4" />
                    Comments
                  </Label>
                  <div className="mt-4 space-y-4">
                    {selectedCard.comments?.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback>
                            {comment.user.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">{comment.user.name}</p>
                          <div className="rounded-md border p-3">
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground pl-3">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="Write a comment..."
                        onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
                      />
                      <Button onClick={onAddComment}>Post</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Category / Move to List */}
              <div>
                <Label className="text-sm font-semibold">
                  <FolderKanban className="mr-2 inline h-4 w-4" />
                  Move to List
                </Label>
                <Select
                  value={selectedCard.category?.toString() || selectedCard.list?.id?.toString() || 'none'}
                  onValueChange={(value) =>
                    onFieldChange('category', value === 'none' ? null : parseInt(value))
                  }
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Select list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {board.lists?.map((list) => (
                      <SelectItem key={list.id} value={list.id.toString()}>
                        {list.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cardMode === 'view' && (
                  <p className="mt-1 text-xs text-muted-foreground">Changing list will move this card</p>
                )}
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm font-semibold">Status</Label>
                <Button
                  variant={selectedCard.is_completed ? 'default' : 'outline'}
                  className="mt-2 w-full"
                  onClick={() => onFieldChange('is_completed', !selectedCard.is_completed)}
                >
                  {selectedCard.is_completed ? 'Completed' : 'Mark Complete'}
                </Button>
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-sm font-semibold">
                  <Calendar className="mr-2 inline h-4 w-4" />
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={
                    selectedCard.due_date ? new Date(selectedCard.due_date).toISOString().split('T')[0] : ''
                  }
                  onChange={(e) => onFieldChange('due_date', e.target.value || null)}
                  className="mt-2"
                />
              </div>

              {/* Members */}
              <div>
                <Label className="text-sm font-semibold">
                  <User className="mr-2 inline h-4 w-4" />
                  Members
                </Label>
                <div className="mt-2 space-y-3">
                  {/* Assigned Members */}
                  {enrichedMembers && enrichedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {enrichedMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="group relative"
                          title={member.name}
                        >
                          <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarFallback className="text-xs">
                              {member.name
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {isAdmin && (
                            <button
                              onClick={() => onToggleMember(member.id)}
                              className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Remove member"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No members assigned yet</p>
                  )}

                  {/* Add Member Select - Available in both create and view mode if user is admin */}
                  {isAdmin && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Assign member</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value) {
                            onToggleMember(parseInt(value))
                          }
                        }}
                      >
                        <SelectTrigger className="mt-2 w-full">
                          <SelectValue placeholder="Select member to assign..." />
                        </SelectTrigger>
                        <SelectContent>
                          {board.members
                            ?.filter(
                              (boardMember) =>
                                !enrichedMembers?.some((cardMember: any) => cardMember.id === boardMember.id)
                            )
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {member.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          {board.members?.filter(
                            (boardMember) =>
                              !enrichedMembers?.some((cardMember: any) => cardMember.id === boardMember.id)
                          ).length === 0 && (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              All board members are already assigned
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Labels */}
              <div>
                <Label className="text-sm font-semibold">
                  <Tag className="mr-2 inline h-4 w-4" />
                  Labels
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCard.labels?.map((label: any) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
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
              </div>

              {/* Cover Color */}
              <div>
                <Label className="text-sm font-semibold">Cover Color</Label>
                <Input
                  type="color"
                  value={selectedCard.cover_color || '#0079bf'}
                  onChange={(e) => onFieldChange('cover_color', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={cardMode === 'create' && !selectedCard.title?.trim()}>
              {cardMode === 'create' ? 'Create Card' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// Checklist Section Component
function ChecklistSection({ selectedCard }: { selectedCard: any }) {
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) {
      toast.error('Please enter checklist item')
      return
    }

    router.post(
      `/cards/${selectedCard.id}/checklists`,
      { title: newChecklistItem },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setNewChecklistItem('')
          setIsAdding(false)
          toast.success('Checklist item added')
        },
        onError: () => {
          toast.error('Failed to add checklist item')
        },
      }
    )
  }

  const handleToggleChecklist = (checklistId: number, isCompleted: boolean) => {
    router.patch(
      `/checklists/${checklistId}`,
      { is_completed: !isCompleted },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          // Success handled by page reload
        },
        onError: () => {
          toast.error('Failed to update checklist item')
        },
      }
    )
  }

  const handleDeleteChecklist = (checklistId: number) => {
    if (!confirm('Are you sure you want to delete this checklist item?')) return

    router.delete(`/checklists/${checklistId}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Checklist item deleted')
      },
      onError: () => {
        toast.error('Failed to delete checklist item')
      },
    })
  }

  const checklists = selectedCard.checklists || []
  const completedCount = checklists.filter((item: any) => item.is_completed).length
  const totalCount = checklists.length

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          <CheckSquare className="mr-2 inline h-4 w-4" />
          Checklist
          {totalCount > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </Label>
        {totalCount > 0 && completedCount === totalCount && totalCount > 0 && (
          <Badge variant="default" className="bg-green-600">
            Complete!
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {/* Checklist Items */}
        {checklists.map((item: any) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={() => handleToggleChecklist(item.id, item.is_completed)}
            />
            <span
              className={`flex-1 text-sm ${
                item.is_completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {item.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteChecklist(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {/* Add New Checklist Item */}
        {!isAdding ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Enter checklist item..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChecklist()
                if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewChecklistItem('')
                }
              }}
              autoFocus
            />
            <Button onClick={handleAddChecklist} size="sm">
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewChecklistItem('')
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
