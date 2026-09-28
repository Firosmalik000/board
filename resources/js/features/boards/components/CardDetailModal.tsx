import { MentionInput } from '@/components/MentionInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Board } from '@/lib/store';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Check,
    CheckSquare,
    Download,
    Edit2,
    Eye,
    FileIcon,
    FolderKanban,
    Loader2,
    MessageSquare,
    MoreVertical,
    Paperclip,
    Plus,
    Smile,
    Tag,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CommentItem } from './CommentItem';
import { LabelManager } from './LabelManager';

interface CardDetailModalProps {
    open: boolean;
    onClose: () => void;
    selectedCard: any;
    cardMode: 'view' | 'create';
    board: Board;
    onFieldChange: (field: string, value: any) => void;
    onSave: (e: React.FormEvent) => void;
    onDeleteCard?: () => void;
    hasChanges: boolean;
    newComment: string;
    onCommentChange: (value: string) => void;
    onAddComment: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteAttachment: (attachmentId: number) => void;
    onAddPendingFile?: (file: File) => void;
    onRemovePendingFile?: (index: number) => void;
    onOpenPreview: (url: string, filename: string) => void;
    onToggleMember: (userId: number) => void;
    isUploadingFile: boolean;
    isSaving?: boolean;
    pendingFiles?: File[];
    pendingChecklists?: string[];
    onAddPendingChecklist?: (title: string) => void;
    onRemovePendingChecklist?: (index: number) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export function CardDetailModal({
    open,
    onClose,
    selectedCard,
    cardMode,
    board,
    onFieldChange,
    onSave,
    onDeleteCard,
    hasChanges: _hasChanges,
    newComment,
    onCommentChange,
    onAddComment,
    onFileUpload,
    onDeleteAttachment,
    onAddPendingFile,
    onRemovePendingFile,
    onOpenPreview,
    onToggleMember,
    isUploadingFile,
    isSaving = false,
    pendingFiles = [],
    pendingChecklists = [],
    onAddPendingChecklist,
    onRemovePendingChecklist,
    fileInputRef,
}: CardDetailModalProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth?.user;
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const commentInputRef = useRef<HTMLInputElement>(null);

    // Format board members for mention autocomplete (memoized for performance)
    const boardMembers = useMemo(() => {
        return (
            board?.members?.map((member: any) => ({
                id: member.id,
                name: member.name,
                email: member.email,
                avatar: member.avatar ? `/storage/${member.avatar}` : null,
                username: member.email.split('@')[0], // Extract username from email
            })) || []
        );
    }, [board?.members]);

    if (!selectedCard) return null;

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const input = commentInputRef.current;
        if (!input) return;

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const text = newComment;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        onCommentChange(before + emojiData.emoji + after);
        setIsEmojiPickerOpen(false);

        // Set cursor position after emoji
        setTimeout(() => {
            if (input) {
                input.selectionStart = input.selectionEnd =
                    start + emojiData.emoji.length;
                input.focus();
            }
        }, 0);
    };

    // Check if current user is admin in this board
    const currentUserMembership = board.members?.find(
        (m: any) => m.id === currentUser?.id,
    );
    const isAdmin =
        currentUserMembership?.pivot?.role === 'admin' ||
        board.owner_id === currentUser?.id;

    // In create mode, enrich member objects with full data from board.members
    const enrichedMembers =
        cardMode === 'create'
            ? selectedCard.members?.map((m: any) => {
                  const fullMember = board.members?.find(
                      (bm: any) => bm.id === m.id,
                  );
                  return fullMember || m;
              })
            : selectedCard.members;

    const handleEditorPasteFile = async (file: File, editor: any) => {
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            toast.error('Ukuran file melebihi batas 100MB');
            return;
        }

        const isImg = file.type.startsWith('image/');

        if (cardMode === 'create') {
            onAddPendingFile?.(file);
            if (isImg) {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        editor
                            .chain()
                            .focus()
                            .setImage({ src: reader.result, alt: file.name })
                            .run();
                    }
                };
                reader.readAsDataURL(file);
                toast.success(
                    `Gambar disisipkan & ditambahkan ke lampiran kartu`,
                );
            } else {
                editor
                    .chain()
                    .focus()
                    .insertContent(
                        `<p>📎 <strong>${file.name}</strong> <em>(${(file.size / 1024 / 1024).toFixed(2)} MB - akan diunggah saat kartu dibuat)</em></p>`,
                    )
                    .run();
                toast.success(
                    `File "${file.name}" ditambahkan ke lampiran kartu`,
                );
            }
            return;
        }

        // View mode: upload immediately to server
        const toastId = toast.loading(
            `Mengunggah "${file.name || 'file'}" dari clipboard...`,
        );
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `/cards/${selectedCard.id}/attachments`,
                formData,
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            if (response.data?.success && response.data.attachment) {
                const attachment = response.data.attachment;
                if (attachment.is_image) {
                    editor
                        .chain()
                        .focus()
                        .setImage({
                            src: attachment.url,
                            alt: attachment.original_filename,
                        })
                        .run();
                    toast.success(
                        'Gambar berhasil diunggah & disisipkan ke deskripsi!',
                        { id: toastId },
                    );
                } else {
                    editor
                        .chain()
                        .focus()
                        .insertContent(
                            `<p><a href="${attachment.url}" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium">📎 ${attachment.original_filename} (${attachment.human_file_size})</a></p>`,
                        )
                        .run();
                    toast.success(
                        'File berhasil diunggah & ditautkan di deskripsi!',
                        { id: toastId },
                    );
                }

                const currentAttachments = selectedCard.attachments || [];
                onFieldChange('attachments', [
                    ...currentAttachments,
                    attachment,
                ]);
            } else {
                toast.error('Gagal mengunggah file', { id: toastId });
            }
        } catch (err: any) {
            console.error('Paste upload error:', err);
            toast.error(
                err.response?.data?.message || 'Gagal mengunggah file',
                { id: toastId },
            );
        }
    };

    const handleDialogPaste = (e: React.ClipboardEvent) => {
        const target = e.target as HTMLElement;
        const isTextEditing =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;
        if (isTextEditing) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    if (cardMode === 'create') {
                        onAddPendingFile?.(file);
                        toast.success(
                            `File "${file.name}" ditambahkan ke lampiran`,
                        );
                    } else {
                        const toastId = toast.loading(
                            `Mengunggah "${file.name}" ke lampiran...`,
                        );
                        const formData = new FormData();
                        formData.append('file', file);
                        axios
                            .post(
                                `/cards/${selectedCard.id}/attachments`,
                                formData,
                                {
                                    headers: {
                                        Accept: 'application/json',
                                        'Content-Type': 'multipart/form-data',
                                    },
                                },
                            )
                            .then((res) => {
                                if (res.data?.success && res.data.attachment) {
                                    toast.success(
                                        `"${file.name}" berhasil ditambahkan ke lampiran!`,
                                        { id: toastId },
                                    );
                                    onFieldChange('attachments', [
                                        ...(selectedCard.attachments || []),
                                        res.data.attachment,
                                    ]);
                                }
                            })
                            .catch(() => {
                                toast.error('Gagal mengunggah lampiran', {
                                    id: toastId,
                                });
                            });
                    }
                    break;
                }
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                onPaste={handleDialogPaste}
                className="max-h-[95vh] w-full max-w-full overflow-y-auto border-0 bg-gradient-to-br from-background via-background to-background/95 p-3 shadow-2xl sm:w-[1600px] sm:max-w-[95vw] sm:min-w-[60vw] sm:p-6"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 sm:space-y-6"
                >
                    <DialogHeader className="border-b pb-3 sm:pb-5">
                        <DialogTitle className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-lg font-bold sm:text-2xl">
                            {cardMode === 'create'
                                ? '✨ Create New Card'
                                : selectedCard.title || 'Edit Card'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {cardMode === 'create'
                                ? 'Create a new card with details, attachments, and assignments'
                                : 'View and edit card details, manage attachments, checklists, and comments'}
                        </DialogDescription>
                        {cardMode === 'view' && selectedCard.list && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                                <span className="text-muted-foreground/50">
                                    in
                                </span>
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                                    {selectedCard.list?.title}
                                </span>
                            </p>
                        )}
                    </DialogHeader>

                    {/* Card Details */}
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
                            {/* Title */}
                            <div className="space-y-2 sm:space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                                    <span className="text-primary">●</span>{' '}
                                    Title
                                    <span className="text-xs text-destructive">
                                        *
                                    </span>
                                </Label>
                                <Input
                                    value={selectedCard.title || ''}
                                    onChange={(e) =>
                                        onFieldChange('title', e.target.value)
                                    }
                                    placeholder="Enter a descriptive title for this card..."
                                    className="h-9 border-border/50 text-sm shadow-sm focus:border-primary sm:h-11 sm:text-base"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2 sm:space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                                    <MessageSquare className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                                    Description
                                    <span className="ml-auto hidden text-xs font-normal text-muted-foreground sm:inline">
                                        Rich text editor
                                    </span>
                                </Label>
                                <div className="overflow-hidden rounded-lg border border-border/50 bg-background shadow-sm transition-colors hover:border-primary/50">
                                    <RichTextEditor
                                        content={selectedCard.description || ''}
                                        onChange={(content) =>
                                            onFieldChange(
                                                'description',
                                                content,
                                            )
                                        }
                                        onPasteFile={handleEditorPasteFile}
                                        placeholder="Add detailed information, requirements, or notes... Gunakan toolbar atau tekan Ctrl+V untuk menempelkan gambar/file langsung."
                                        className="min-h-[150px] sm:min-h-[200px]"
                                    />
                                </div>
                            </div>

                            {/* Attachments */}
                            <div>
                                <Label className="text-sm font-semibold sm:text-base">
                                    <Paperclip className="mr-2 inline h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Attachments
                                </Label>

                                <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                                    {/* Pending files (create mode only) */}
                                    {cardMode === 'create' &&
                                        pendingFiles.length > 0 && (
                                            <>
                                                {pendingFiles.map(
                                                    (file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 rounded-md border border-dashed p-3 transition-colors hover:bg-muted/50"
                                                        >
                                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted">
                                                                <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(
                                                                        file.size /
                                                                        1024 /
                                                                        1024
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{' '}
                                                                    MB • Pending
                                                                    upload
                                                                </p>
                                                            </div>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    onRemovePendingFile?.(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </>
                                        )}

                                    {/* Existing attachments (view mode only) */}
                                    {selectedCard.attachments?.map(
                                        (attachment: any) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                {attachment.is_image ? (
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                                                        <img
                                                            src={attachment.url}
                                                            alt={
                                                                attachment.original_filename
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted">
                                                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {
                                                            attachment.original_filename
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            attachment.human_file_size
                                                        }{' '}
                                                        • Uploaded by{' '}
                                                        {
                                                            attachment.uploader
                                                                ?.name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            attachment.created_at,
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {attachment.is_image && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onOpenPreview(
                                                                        attachment.url,
                                                                        attachment.original_filename,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Preview
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    attachment.url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download
                                                            </a>
                                                        </DropdownMenuItem>
                                                        {cardMode ===
                                                            'view' && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onDeleteAttachment(
                                                                        attachment.id,
                                                                    )
                                                                }
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ),
                                    )}

                                    {/* Upload Button */}
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={onFileUpload}
                                            className="hidden"
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                            multiple
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={isUploadingFile}
                                        >
                                            <Paperclip className="mr-2 h-4 w-4" />
                                            {isUploadingFile
                                                ? 'Uploading...'
                                                : 'Add Attachment'}
                                        </Button>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Max file size: 100MB{' '}
                                            {cardMode === 'create' &&
                                                '• Files will be uploaded when card is created'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Checklist */}
                            {cardMode === 'view' ? (
                                <ChecklistSection selectedCard={selectedCard} />
                            ) : (
                                <PendingChecklistSection
                                    pendingChecklists={pendingChecklists}
                                    onAddPendingChecklist={
                                        onAddPendingChecklist
                                    }
                                    onRemovePendingChecklist={
                                        onRemovePendingChecklist
                                    }
                                />
                            )}

                            {/* Comments - Only show in view mode */}
                            {cardMode === 'view' && (
                                <div>
                                    <Label className="text-sm font-semibold sm:text-base">
                                        <MessageSquare className="mr-2 inline h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Comments (
                                        {selectedCard.comments?.length || 0})
                                    </Label>
                                    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                                        {selectedCard.comments?.map(
                                            (comment: any) => (
                                                <CommentItem
                                                    key={comment.id}
                                                    comment={comment}
                                                    boardMembers={boardMembers}
                                                />
                                            ),
                                        )}

                                        {/* Add Comment */}
                                        <div className="flex items-start gap-2">
                                            <div className="relative flex-1">
                                                <MentionInput
                                                    value={newComment}
                                                    onChange={onCommentChange}
                                                    members={boardMembers}
                                                    placeholder="Write a comment... (Type @ to mention)"
                                                    className="pr-10"
                                                />
                                                <Popover
                                                    open={isEmojiPickerOpen}
                                                    onOpenChange={
                                                        setIsEmojiPickerOpen
                                                    }
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute top-1 right-1 h-7 w-7 p-0"
                                                            type="button"
                                                        >
                                                            <Smile className="h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-full border-0 p-0"
                                                        align="end"
                                                    >
                                                        <EmojiPicker
                                                            onEmojiClick={
                                                                handleEmojiClick
                                                            }
                                                            width={350}
                                                            height={400}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <Button
                                                onClick={onAddComment}
                                                disabled={!newComment.trim()}
                                            >
                                                Post
                                            </Button>
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
                                    value={
                                        selectedCard.list_id?.toString() ||
                                        'none'
                                    }
                                    onValueChange={(value) =>
                                        onFieldChange(
                                            'list_id',
                                            value === 'none'
                                                ? null
                                                : parseInt(value),
                                        )
                                    }
                                >
                                    <SelectTrigger className="mt-2 w-full">
                                        <SelectValue placeholder="Select list..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {board.lists?.map((list) => (
                                            <SelectItem
                                                key={list.id}
                                                value={list.id.toString()}
                                            >
                                                {list.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {cardMode === 'view' && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Changing list will move this card
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <Label className="text-sm font-semibold">
                                    Status
                                </Label>
                                <Button
                                    variant={
                                        selectedCard.is_completed
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="mt-2 w-full"
                                    onClick={() =>
                                        onFieldChange(
                                            'is_completed',
                                            !selectedCard.is_completed,
                                        )
                                    }
                                >
                                    {selectedCard.is_completed
                                        ? 'Completed'
                                        : 'Mark Complete'}
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
                                        selectedCard.due_date
                                            ? new Date(selectedCard.due_date)
                                                  .toISOString()
                                                  .split('T')[0]
                                            : ''
                                    }
                                    onChange={(e) =>
                                        onFieldChange(
                                            'due_date',
                                            e.target.value || null,
                                        )
                                    }
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
                                    {enrichedMembers &&
                                    enrichedMembers.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {enrichedMembers.map(
                                                (member: any) => (
                                                    <div
                                                        key={member.id}
                                                        className="group relative"
                                                        title={member.name}
                                                    >
                                                        <Avatar className="h-8 w-8 cursor-pointer">
                                                            <AvatarImage
                                                                src={
                                                                    member.avatar
                                                                        ? `/storage/${member.avatar}`
                                                                        : undefined
                                                                }
                                                                alt={
                                                                    member.name
                                                                }
                                                            />
                                                            <AvatarFallback className="text-xs">
                                                                {member.name
                                                                    ?.split(' ')
                                                                    .map(
                                                                        (
                                                                            n: string,
                                                                        ) =>
                                                                            n[0],
                                                                    )
                                                                    .join('')
                                                                    .toUpperCase() ||
                                                                    '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() =>
                                                                    onToggleMember(
                                                                        member.id,
                                                                    )
                                                                }
                                                                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                                title="Remove member"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No members assigned yet
                                        </p>
                                    )}

                                    {/* Add Member Select - Available in both create and view mode if user is admin */}
                                    {isAdmin && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">
                                                Assign member
                                            </Label>
                                            <Select
                                                value=""
                                                onValueChange={(value) => {
                                                    if (value) {
                                                        onToggleMember(
                                                            parseInt(value),
                                                        );
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
                                                                !enrichedMembers?.some(
                                                                    (
                                                                        cardMember: any,
                                                                    ) =>
                                                                        cardMember.id ===
                                                                        boardMember.id,
                                                                ),
                                                        )
                                                        .map((member) => (
                                                            <SelectItem
                                                                key={member.id}
                                                                value={member.id.toString()}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarImage
                                                                            src={
                                                                                member.avatar
                                                                                    ? `/storage/${member.avatar}`
                                                                                    : undefined
                                                                            }
                                                                            alt={
                                                                                member.name
                                                                            }
                                                                        />
                                                                        <AvatarFallback className="text-xs">
                                                                            {member.name
                                                                                .split(
                                                                                    ' ',
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        n,
                                                                                    ) =>
                                                                                        n[0],
                                                                                )
                                                                                .join(
                                                                                    '',
                                                                                )
                                                                                .toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">
                                                                            {
                                                                                member.name
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {
                                                                                member.email
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    {board.members?.filter(
                                                        (boardMember) =>
                                                            !enrichedMembers?.some(
                                                                (
                                                                    cardMember: any,
                                                                ) =>
                                                                    cardMember.id ===
                                                                    boardMember.id,
                                                            ),
                                                    ).length === 0 && (
                                                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                            All board members
                                                            are already assigned
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
                                <div className="mt-2 space-y-2">
                                    {/* Attached Labels */}
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCard.labels?.map(
                                            (label: any) => (
                                                <Badge
                                                    key={label.id}
                                                    variant="secondary"
                                                    className="group relative cursor-pointer pr-6 transition-all hover:opacity-80"
                                                    style={{
                                                        backgroundColor:
                                                            label.color + '20',
                                                        borderColor:
                                                            label.color,
                                                        color: label.color,
                                                    }}
                                                >
                                                    {label.name}
                                                    {cardMode === 'view' && (
                                                        <button
                                                            onClick={() => {
                                                                router.delete(
                                                                    `/cards/${selectedCard.id}/labels/${label.id}/detach`,
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess:
                                                                            () =>
                                                                                toast.success(
                                                                                    'Label removed',
                                                                                ),
                                                                        onError:
                                                                            () =>
                                                                                toast.error(
                                                                                    'Failed to remove label',
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                            className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </Badge>
                                            ),
                                        )}
                                        {selectedCard.labels?.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No labels attached
                                            </p>
                                        )}
                                    </div>

                                    {/* Add Label (Only in view mode) */}
                                    {cardMode === 'view' && (
                                        <LabelManager
                                            board={board}
                                            selectedCard={selectedCard}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Cover Color */}
                            <div>
                                <Label className="text-sm font-semibold">
                                    Cover Color
                                </Label>
                                <Input
                                    type="color"
                                    value={
                                        selectedCard.cover_color || '#0079bf'
                                    }
                                    onChange={(e) =>
                                        onFieldChange(
                                            'cover_color',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-col justify-between gap-2 border-t border-border/50 pt-4 sm:mt-8 sm:flex-row sm:gap-3 sm:pt-6">
                        {/* Delete Button - Only in view mode */}
                        {cardMode === 'view' && onDeleteCard && (
                            <Button
                                variant="destructive"
                                onClick={onDeleteCard}
                                className="gap-2 text-xs shadow-sm hover:shadow sm:text-sm"
                            >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">
                                    Delete Card
                                </span>
                                <span className="sm:hidden">Delete</span>
                            </Button>
                        )}
                        <div
                            className={`flex gap-2 sm:gap-3 ${cardMode === 'create' ? 'w-full justify-end' : 'sm:ml-auto'}`}
                        >
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="h-9 flex-1 text-xs shadow-sm sm:h-10 sm:min-w-[100px] sm:flex-none sm:text-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onSave}
                                disabled={
                                    (cardMode === 'create' &&
                                        !selectedCard.title?.trim()) ||
                                    isSaving
                                }
                                className="h-9 flex-1 gap-2 text-xs shadow-sm hover:shadow sm:h-10 sm:min-w-[140px] sm:flex-none sm:text-sm"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="inline-block animate-spin">
                                            ⏳
                                        </span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {cardMode === 'create'
                                            ? '✨ Create'
                                            : '💾 Save'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}

// Pending Checklist Section Component (for create mode)
function PendingChecklistSection({
    pendingChecklists,
    onAddPendingChecklist,
    onRemovePendingChecklist,
}: {
    pendingChecklists: string[];
    onAddPendingChecklist?: (title: string) => void;
    onRemovePendingChecklist?: (index: number) => void;
}) {
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAdd = () => {
        if (!newChecklistItem.trim()) {
            toast.error('Ketik judul checklist terlebih dahulu');
            return;
        }
        onAddPendingChecklist?.(newChecklistItem.trim());
        setNewChecklistItem('');
        toast.success('Checklist ditambahkan ke daftar');
        // Keep input focused for rapid continuous addition
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    Checklist
                    {pendingChecklists.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                        >
                            {pendingChecklists.length} item
                        </Badge>
                    )}
                </Label>
            </div>

            <div className="space-y-2">
                {/* Pending Checklist Items */}
                {pendingChecklists.map((item, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-3 rounded-md border border-dashed border-border/80 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
                    >
                        <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">
                            {item}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemovePendingChecklist?.(index)}
                            className="h-7 w-7 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus checklist"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}

                {/* Add New Checklist Item */}
                {!isAdding ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="w-full border-dashed text-xs font-medium hover:border-primary/50 hover:bg-primary/5"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Tambah butir checklist
                    </Button>
                ) : (
                    <div className="flex gap-2 rounded-lg border bg-muted/20 p-2">
                        <Input
                            ref={inputRef}
                            value={newChecklistItem}
                            onChange={(e) =>
                                setNewChecklistItem(e.target.value)
                            }
                            placeholder="Ketik butir checklist lalu tekan Enter..."
                            className="h-8 bg-background text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAdd();
                                }
                                if (e.key === 'Escape') {
                                    setIsAdding(false);
                                    setNewChecklistItem('');
                                }
                            }}
                            autoFocus
                        />
                        <Button
                            type="button"
                            onClick={handleAdd}
                            size="sm"
                            className="h-8 px-3 text-xs"
                        >
                            Tambah
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsAdding(false);
                                setNewChecklistItem('');
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            Batal
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Checklist Section Component (for view mode)
function ChecklistSection({ selectedCard }: { selectedCard: any }) {
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [syncingIds, setSyncingIds] = useState<number[]>([]);
    const [deletingIds, setDeletingIds] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const checklists = selectedCard.checklists || [];
    const completedCount = checklists.filter(
        (item: any) => item.is_completed,
    ).length;
    const totalCount = checklists.length;
    const percent =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const handleAddChecklist = () => {
        if (!newChecklistItem.trim() || isSubmitting) {
            if (!newChecklistItem.trim())
                toast.error('Ketik judul checklist terlebih dahulu');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Menambahkan butir checklist...');

        router.post(
            `/cards/${selectedCard.id}/checklists`,
            { title: newChecklistItem.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setNewChecklistItem('');
                    toast.success('Checklist berhasil ditambahkan!', {
                        id: toastId,
                        duration: 1800,
                    });
                    // Keep input focused for next rapid entry
                    setTimeout(() => {
                        inputRef.current?.focus();
                    }, 50);
                },
                onError: () => {
                    toast.error('Gagal menambahkan checklist', { id: toastId });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleToggleChecklist = (
        checklistId: number,
        isCompleted: boolean,
    ) => {
        if (syncingIds.includes(checklistId)) return;

        setSyncingIds((prev) => [...prev, checklistId]);

        router.patch(
            `/checklists/${checklistId}`,
            { is_completed: !isCompleted },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        !isCompleted
                            ? '✓ Checklist selesai!'
                            : 'Ditandai belum selesai',
                        {
                            id: `chk-${checklistId}`,
                            duration: 1500,
                        },
                    );
                },
                onError: () => {
                    toast.error('Gagal mengubah status checklist', {
                        id: `chk-${checklistId}`,
                    });
                },
                onFinish: () => {
                    setSyncingIds((prev) =>
                        prev.filter((id) => id !== checklistId),
                    );
                },
            },
        );
    };

    const handleStartEdit = (item: any) => {
        setEditingId(item.id);
        setEditingTitle(item.title);
    };

    const handleSaveEdit = (checklistId: number) => {
        if (!editingTitle.trim() || isSavingEdit) return;

        setIsSavingEdit(true);
        const toastId = toast.loading('Memperbarui checklist...');

        router.patch(
            `/checklists/${checklistId}`,
            { title: editingTitle.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Checklist diperbarui', {
                        id: toastId,
                        duration: 1500,
                    });
                    setEditingId(null);
                    setEditingTitle('');
                },
                onError: () => {
                    toast.error('Gagal memperbarui checklist', { id: toastId });
                },
                onFinish: () => {
                    setIsSavingEdit(false);
                },
            },
        );
    };

    const handleDeleteChecklist = (checklistId: number, title: string) => {
        if (deletingIds.includes(checklistId)) return;
        setDeletingIds((prev) => [...prev, checklistId]);

        const toastId = toast.loading(`Menghapus "${title}"...`);

        router.delete(`/checklists/${checklistId}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Checklist berhasil dihapus', {
                    id: toastId,
                    duration: 1500,
                });
            },
            onError: () => {
                toast.error('Gagal menghapus checklist', { id: toastId });
            },
            onFinish: () => {
                setDeletingIds((prev) =>
                    prev.filter((id) => id !== checklistId),
                );
            },
        });
    };

    return (
        <div className="space-y-3">
            {/* Header & Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        Checklist
                        {totalCount > 0 && (
                            <span className="text-xs font-normal text-muted-foreground">
                                ({completedCount}/{totalCount})
                            </span>
                        )}
                    </Label>
                    {totalCount > 0 && (
                        <Badge
                            variant={percent === 100 ? 'default' : 'secondary'}
                            className={
                                percent === 100
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                                    : ''
                            }
                        >
                            {percent === 100
                                ? '✓ Selesai Semua!'
                                : `${percent}%`}
                        </Badge>
                    )}
                </div>

                {/* Trello-like Progress Bar */}
                {totalCount > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="w-7 text-right text-[11px] font-semibold text-muted-foreground">
                            {percent}%
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    percent === 100
                                        ? 'bg-emerald-500'
                                        : 'bg-primary'
                                }`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {/* Checklist Items */}
                {checklists.map((item: any) => {
                    const isSyncing = syncingIds.includes(item.id);
                    const isDeleting = deletingIds.includes(item.id);
                    const isEditing = editingId === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`group flex items-center gap-3 rounded-md border p-2.5 transition-all ${
                                item.is_completed
                                    ? 'border-border/50 bg-muted/30'
                                    : 'bg-background hover:bg-muted/30'
                            } ${isDeleting ? 'pointer-events-none opacity-40' : ''}`}
                        >
                            {/* Checkbox or Loading Spinner */}
                            <div className="flex size-5 shrink-0 items-center justify-center">
                                {isSyncing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                ) : (
                                    <Checkbox
                                        checked={item.is_completed}
                                        onCheckedChange={() =>
                                            handleToggleChecklist(
                                                item.id,
                                                item.is_completed,
                                            )
                                        }
                                        disabled={isSyncing || isDeleting}
                                        className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                                    />
                                )}
                            </div>

                            {/* Title / Inline Edit */}
                            {isEditing ? (
                                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                    <Input
                                        value={editingTitle}
                                        onChange={(e) =>
                                            setEditingTitle(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter')
                                                handleSaveEdit(item.id);
                                            if (e.key === 'Escape')
                                                setEditingId(null);
                                        }}
                                        autoFocus
                                        className="h-7 bg-background text-xs"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleSaveEdit(item.id)}
                                        disabled={isSavingEdit}
                                        className="h-7 px-2 text-xs"
                                    >
                                        {isSavingEdit ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Check className="h-3 w-3" />
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingId(null)}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <span
                                    onDoubleClick={() => handleStartEdit(item)}
                                    className={`flex-1 cursor-pointer text-sm transition-colors select-none ${
                                        item.is_completed
                                            ? 'text-muted-foreground line-through'
                                            : 'text-foreground'
                                    }`}
                                    title="Klik 2x untuk mengedit teks"
                                >
                                    {item.title}
                                </span>
                            )}

                            {/* Action Buttons */}
                            {!isEditing && (
                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEdit(item)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                        title="Edit teks"
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleDeleteChecklist(
                                                item.id,
                                                item.title,
                                            )
                                        }
                                        disabled={isDeleting}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        title="Hapus checklist"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add New Checklist Item Form */}
                {!isAdding ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="w-full border-dashed text-xs font-medium hover:border-primary/50 hover:bg-primary/5"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Tambah butir checklist
                    </Button>
                ) : (
                    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-2.5">
                        <Input
                            ref={inputRef}
                            value={newChecklistItem}
                            onChange={(e) =>
                                setNewChecklistItem(e.target.value)
                            }
                            placeholder="Ketik butir checklist baru (tekan Enter untuk simpan)..."
                            disabled={isSubmitting}
                            className="h-8 bg-background text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddChecklist();
                                }
                                if (e.key === 'Escape') {
                                    setIsAdding(false);
                                    setNewChecklistItem('');
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={handleAddChecklist}
                                disabled={isSubmitting}
                                size="sm"
                                className="h-8 px-3 text-xs"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Tambah'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewChecklistItem('');
                                }}
                                className="h-8 px-2 text-xs"
                            >
                                Batal
                            </Button>
                            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
                                Tekan{' '}
                                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                                    Enter
                                </kbd>{' '}
                                untuk simpan beruntun
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
