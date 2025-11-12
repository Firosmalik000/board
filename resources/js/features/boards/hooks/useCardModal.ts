import { useState, useRef } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'

export function useCardModal() {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [cardMode, setCardMode] = useState<'view' | 'create'>('view')
  const [createInListId, setCreateInListId] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
    })
    setHasChanges(false)
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
  }

  const handleCardFieldChange = (field: string, value: any) => {
    setSelectedCard({ ...selectedCard, [field]: value })
    setHasChanges(true)
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
      router.post(
        `/lists/${createInListId}/cards`,
        {
          title: selectedCard.title,
          description: selectedCard.description,
          category: selectedCard.category,
          due_date: selectedCard.due_date,
          cover_color: selectedCard.cover_color,
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            toast.success('Card created successfully')
            setSelectedCardId(null)
            setSelectedCard(null)
            setCardMode('view')
            setCreateInListId(null)
            setNewComment('')
            setHasChanges(false)
          },
          onError: (errors) => {
            toast.error(errors.title || 'Failed to create card')
          },
          onFinish: () => {
            setIsSaving(false)
          },
        }
      )
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
          onError: (errors) => {
            toast.error('Failed to update card')
            console.log(errors)
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
        onError: (errors) => {
          toast.error('Failed to add comment')
          console.log(errors)
        },
      }
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedCard) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploadingFile(true)

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
      onError: (errors) => {
        toast.error('Failed to upload file')
        console.log(errors)
      },
      onFinish: () => {
        setIsUploadingFile(false)
      },
    })
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

  const handleToggleMember = (userId: number) => {
    if (!selectedCard) return

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
    handleToggleMember,
    syncSelectedCard,
  }
}
