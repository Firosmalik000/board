import { useState, useRef } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { uploadFileInChunks } from '@/utils/chunkedUpload'

export function useCardModal() {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [cardMode, setCardMode] = useState<'view' | 'create'>('view')
  const [createInListId, setCreateInListId] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingChecklists, setPendingChecklists] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const findCard = (cardId: number, lists: any[]) => {
    for (const list of lists || []) {
      const card = list.cards?.find((c: any) => c.id === cardId)
      if (card) {
        return { ...card, list: { id: list.id, title: list.title } }
      }
    }
    return null
  }

  const handleCardClick = (cardId: number, lists: any[]) => {
    setSelectedCardId(cardId)
    setCardMode('view')
    const card = findCard(cardId, lists)
    if (card) {
      setSelectedCard({ ...card, category: card.list.id })
      setHasChanges(false)
    } else {
      toast.error('Card not found')
    }
  }

  const handleCreateCard = (listId: number) => {
    setCardMode('create')
    setCreateInListId(listId)
    setSelectedCardId(null)
    setSelectedCard({
      title: '',
      description: '',
      category: listId,
      due_date: null,
      is_completed: false,
      cover_color: '#0079bf',
      members: [],
    })
    setHasChanges(false)
    setPendingFiles([])
    setPendingChecklists([])
  }

  const handleCloseCardModal = () => {
    // Don't process if already saving (prevent double save)
    if (isSaving) return

    // For create mode: just close without saving (saving handled by button only)
    if (cardMode === 'create') {
      // Discard the draft
      setSelectedCardId(null)
      setSelectedCard(null)
      setCardMode('view')
      setCreateInListId(null)
      setNewComment('')
      setHasChanges(false)
      setPendingFiles([])
      setPendingChecklists([])
      return
    }

    // For edit mode: warn if there are unsaved changes
    if (hasChanges && cardMode === 'view') {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }

    setSelectedCardId(null)
    setSelectedCard(null)
    setCardMode('view')
    setCreateInListId(null)
    setNewComment('')
    setHasChanges(false)
    setPendingFiles([])
    setPendingChecklists([])
  }

  const handleCardFieldChange = (field: string, value: any) => {
    setSelectedCard({ ...selectedCard, [field]: value })
    setHasChanges(true)
  }

  const resetCardModal = () => {
    setSelectedCardId(null)
    setSelectedCard(null)
    setCardMode('view')
    setCreateInListId(null)
    setNewComment('')
    setHasChanges(false)
    setPendingFiles([])
    setPendingChecklists([])
    setIsSaving(false)
  }

  const uploadPendingFiles = async (cardId: number) => {
    let successCount = 0
    let failCount = 0

    for (const file of pendingFiles) {
      // Use chunked upload for files > 10MB
      if (file.size > 10 * 1024 * 1024) {
        const success = await uploadFileInChunks(file, cardId)
        if (success) {
          successCount++
        } else {
          failCount++
        }
      } else {
        // Use normal upload for small files
        const formData = new FormData()
        formData.append('file', file)

        try {
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          const xsrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1]

          const response = await fetch(`/cards/${cardId}/attachments`, {
            method: 'POST',
            headers: {
              'X-CSRF-TOKEN': csrfToken || '',
              'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json',
            },
            credentials: 'same-origin',
            body: formData,
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
        }
      }
    }

    // Show result
    if (failCount === 0) {
      toast.success(`Card created with ${successCount} file(s) uploaded`)
    } else {
      toast.warning(`Card created. ${successCount} uploaded, ${failCount} failed`)
    }

    // Reload board and close modal
    router.reload({ only: ['board'] })
    resetCardModal()
  }

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCard || isSaving) return

    if (cardMode === 'create') {
      if (!selectedCard.title?.trim()) {
        toast.error('Card title is required')
        return
      }

      setIsSaving(true)

      // Prepare payload WITHOUT files
      const payload: any = {
        title: selectedCard.title,
        description: selectedCard.description,
        category: selectedCard.category,
        due_date: selectedCard.due_date,
        cover_color: selectedCard.cover_color,
        is_completed: selectedCard.is_completed,
      }

      // Add checklists as JSON
      if (pendingChecklists.length > 0) {
        payload.checklists = JSON.stringify(pendingChecklists)
      }

      // Add member IDs
      const memberIds = selectedCard?.members?.map((m: any) => m.id) || []
      if (memberIds.length > 0) {
        payload.member_ids = memberIds
      }

      router.post(`/lists/${createInListId}/cards`, payload, {
        preserveScroll: true,
        onSuccess: (page: any) => {
          const newCardId = page.props?.flash?.cardId

          // Upload files after card created using chunked upload
          if (pendingFiles.length > 0 && newCardId) {
            uploadPendingFiles(newCardId)
          } else {
            toast.success('Card created successfully')
            resetCardModal()
            setIsSaving(false)
          }
        },
        onError: (errors) => {
          toast.error(errors.title || 'Failed to create card')
          setIsSaving(false)
        },
      })
    } else {
      setIsSaving(true)
      router.patch(
        `/cards/${selectedCard.id}`,
        {
          title: selectedCard.title,
          description: selectedCard.description,
          category: selectedCard.category,
          due_date: selectedCard.due_date,
          is_completed: selectedCard.is_completed,
          cover_color: selectedCard.cover_color,
        },
        {
          preserveScroll: true,
          preserveState: true,
          onSuccess: () => {
            toast.success('Card updated successfully')
            setHasChanges(false)
          },
          onError: () => {
            toast.error('Failed to update card')
          },
          onFinish: () => {
            setIsSaving(false)
          },
        }
      )
    }
  }

  const handleAddComment = async (onBoardUpdate: () => void) => {
    if (!selectedCard || !newComment.trim()) return

    router.post(
      `/cards/${selectedCard.id}/comments`,
      {
        content: newComment,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setNewComment('')
          toast.success('Comment added')
          onBoardUpdate()
        },
        onError: () => {
          toast.error('Failed to add comment')
        },
      }
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedCard) return

    // Validate file sizes - 100MB max
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    const invalidFiles = Array.from(files).filter(file => file.size > maxSize)
    if (invalidFiles.length > 0) {
      toast.error('Some files exceed 100MB limit')
      return
    }

    // In create mode, add to pending files
    if (cardMode === 'create') {
      const newFiles = Array.from(files)
      setPendingFiles([...pendingFiles, ...newFiles])
      toast.success(`${newFiles.length} file(s) added`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // In view mode, upload immediately
    setIsUploadingFile(true)

    const file = files[0]

    // Use chunked upload for files > 10MB
    if (file.size > 10 * 1024 * 1024) {
      uploadFileInChunks(file, selectedCard.id)
        .then((success) => {
          if (success) {
            toast.success('File uploaded successfully')
            router.reload({ only: ['board'] })
          } else {
            toast.error('Failed to upload file')
          }
        })
        .finally(() => {
          setIsUploadingFile(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        })
    } else {
      // Use normal upload for small files
      const formData = new FormData()
      formData.append('file', file)

      router.post(`/cards/${selectedCard.id}/attachments`, formData, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          toast.success('File uploaded successfully')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
        onError: () => {
          toast.error('Failed to upload file')
        },
        onFinish: () => {
          setIsUploadingFile(false)
        },
      })
    }
  }

  const handleDeleteAttachment = (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    router.delete(`/attachments/${attachmentId}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Attachment deleted')
      },
      onError: () => {
        toast.error('Failed to delete attachment')
      },
    })
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index))
    toast.success('File removed')
  }

  const handleAddPendingChecklist = (title: string) => {
    if (!title.trim()) {
      toast.error('Please enter checklist item')
      return
    }
    setPendingChecklists([...pendingChecklists, title.trim()])
    toast.success('Checklist item added')
  }

  const handleRemovePendingChecklist = (index: number) => {
    setPendingChecklists(pendingChecklists.filter((_, i) => i !== index))
    toast.success('Checklist item removed')
  }

  const handleToggleMember = (userId: number) => {
    if (!selectedCard) return

    // In create mode, just update the local state
    if (cardMode === 'create') {
      const currentMembers = selectedCard.members || []
      const isMember = currentMembers.some((m: any) => m.id === userId)

      if (isMember) {
        // Remove member
        setSelectedCard({
          ...selectedCard,
          members: currentMembers.filter((m: any) => m.id !== userId)
        })
        toast.success('Member removed')
      } else {
        // Add member - we need to get the full member object
        // This will be handled in the CardDetailModal by finding the member from board.members
        setSelectedCard({
          ...selectedCard,
          members: [...currentMembers, { id: userId }]
        })
        toast.success('Member added')
      }
      setHasChanges(true)
      return
    }

    // In view mode, call the API
    router.post(
      `/cards/${selectedCard.id}/members/${userId}`,
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          const isMember = selectedCard.members?.some((m: any) => m.id === userId)
          toast.success(isMember ? 'Member removed from card' : 'Member added to card')
        },
        onError: () => {
          toast.error('Failed to update card members')
        },
      }
    )
  }

  const handleDeleteCard = () => {
    if (!selectedCard || cardMode === 'create') return

    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return
    }

    router.delete(`/cards/${selectedCard.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Card deleted successfully')
        setSelectedCardId(null)
        setSelectedCard(null)
        setCardMode('view')
        setNewComment('')
        setHasChanges(false)
      },
      onError: () => {
        toast.error('Failed to delete card')
      },
    })
  }

  const syncSelectedCard = (cardId: number | null, lists: any[]) => {
    // Don't sync if user has unsaved changes
    if (cardId && !hasChanges) {
      for (const list of lists || []) {
        const card = list.cards?.find((c: any) => c.id === cardId)
        if (card) {
          setSelectedCard({ ...card, list: { id: list.id, title: list.title }, category: list.id })
          break
        }
      }
    }
  }

  return {
    selectedCardId,
    selectedCard,
    cardMode,
    createInListId,
    newComment,
    hasChanges,
    isUploadingFile,
    isSaving,
    pendingFiles,
    pendingChecklists,
    fileInputRef,
    setNewComment,
    handleCardClick,
    handleCreateCard,
    handleCloseCardModal,
    handleCardFieldChange,
    handleSaveCard,
    handleAddComment,
    handleFileUpload,
    handleDeleteAttachment,
    handleRemovePendingFile,
    handleAddPendingChecklist,
    handleRemovePendingChecklist,
    handleDeleteCard,
    handleToggleMember,
    syncSelectedCard,
  }
}
