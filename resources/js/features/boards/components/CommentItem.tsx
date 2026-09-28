import { MentionInput } from '@/components/MentionInput';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { router, usePage } from '@inertiajs/react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Check, Pencil, Smile, Trash2, X } from 'lucide-react';
import { memo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Comment {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    };
}

interface CommentItemProps {
    comment: Comment;
    boardMembers?: Array<{
        id: number;
        name: string;
        email: string;
        avatar: string | null;
        username: string;
    }>;
}

export const CommentItem = memo(function CommentItem({
    comment,
    boardMembers = [],
}: CommentItemProps) {
    const { auth } = usePage().props as any;
    const currentUser = auth?.user;
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isOwner = currentUser?.id === comment.user.id;

    const handleEdit = () => {
        setIsEditing(true);
        setEditedContent(comment.content);
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedContent(comment.content);
    };

    const handleSaveEdit = () => {
        if (!editedContent.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        router.patch(
            `/comments/${comment.id}`,
            { content: editedContent },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Comment updated');
                    setIsEditing(false);
                },
                onError: () => {
                    toast.error('Failed to update comment');
                },
            },
        );
    };

    const handleDelete = () => {
        router.delete(`/comments/${comment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Comment deleted');
                setShowDeleteDialog(false);
            },
            onError: () => {
                toast.error('Failed to delete comment');
            },
        });
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = editedContent;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        setEditedContent(before + emojiData.emoji + after);
        setIsEmojiPickerOpen(false);

        // Set cursor position after emoji
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
                start + emojiData.emoji.length;
            textarea.focus();
        }, 0);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isEdited = comment.created_at !== comment.updated_at;

    return (
        <>
            <div className="flex gap-3">
                <Avatar className="mt-1 h-8 w-8 shrink-0">
                    <AvatarImage
                        src={
                            comment.user.avatar
                                ? `/storage/${comment.user.avatar}`
                                : undefined
                        }
                        alt={comment.user.name}
                    />
                    <AvatarFallback className="text-xs">
                        {getInitials(comment.user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                            {comment.user.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                            {isEdited && ' (edited)'}
                        </span>
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <MentionInput
                                    value={editedContent}
                                    onChange={setEditedContent}
                                    members={boardMembers}
                                    placeholder="Edit comment... (Type @ to mention)"
                                    multiline={true}
                                    rows={3}
                                    className="pr-10"
                                />
                                <Popover
                                    open={isEmojiPickerOpen}
                                    onOpenChange={setIsEmojiPickerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2 z-10 h-7 w-7 p-0"
                                        >
                                            <Smile className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-full border-0 p-0"
                                        align="end"
                                    >
                                        <EmojiPicker
                                            onEmojiClick={handleEmojiClick}
                                            width={350}
                                            height={400}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSaveEdit} size="sm">
                                    <Check className="mr-1 h-3 w-3" />
                                    Save
                                </Button>
                                <Button
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    size="sm"
                                >
                                    <X className="mr-1 h-3 w-3" />
                                    Cancel
                                </Button>
                                <span className="ml-2 self-center text-xs text-muted-foreground">
                                    Press Ctrl+Enter to save
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="group relative rounded-md border bg-muted/30 p-3">
                                <p className="text-sm break-words whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                                {isOwner && (
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={handleEdit}
                                            title="Edit comment"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            onClick={() =>
                                                setShowDeleteDialog(true)
                                            }
                                            title="Delete comment"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this comment? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
});
