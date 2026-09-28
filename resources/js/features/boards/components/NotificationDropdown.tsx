import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    format,
    formatDistanceToNow,
    isThisMonth,
    isThisWeek,
    isToday,
    isYesterday,
} from 'date-fns';
import {
    ArrowRight,
    AtSign,
    Bell,
    Calendar as CalendarIcon,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Edit,
    ExternalLink,
    Filter,
    Image as ImageIcon,
    Loader2,
    MessageSquare,
    Paperclip,
    Plus,
    Search,
    Settings,
    Tag,
    Trash2,
    User,
    UserMinus,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Activity {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    };
    action: string;
    entity_type: string;
    entity_id?: number;
    metadata?: {
        entity_name?: string;
        board_name?: string;
        card_id?: number;
    };
    created_at: string;
}

interface NotificationDropdownProps {
    activities: Activity[];
    boardId: number;
    totalActivities?: number;
    onCardClick?: (cardId: number) => void;
}

export function NotificationDropdown({
    activities: initialActivities,
    boardId,
    totalActivities: initialTotal,
    onCardClick,
}: NotificationDropdownProps) {
    const [lastReadTime, setLastReadTime] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination state
    const [allActivities, setAllActivities] =
        useState<Activity[]>(initialActivities);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalActivities, setTotalActivities] = useState(
        initialTotal || initialActivities.length,
    );
    const [isLoadingPage, setIsLoadingPage] = useState(false);
    const perPage = 50;

    // Load last read time from localStorage on mount
    useEffect(() => {
        const storageKey = `board_${boardId}_last_read`;
        const savedTime = localStorage.getItem(storageKey);
        setLastReadTime(savedTime);
    }, [boardId]);

    // Calculate total pages
    useEffect(() => {
        setTotalPages(Math.ceil(totalActivities / perPage));
    }, [totalActivities, perPage]);

    // Fetch activities for a specific page
    const fetchActivitiesPage = async (page: number) => {
        setIsLoadingPage(true);
        try {
            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
            });

            // Add filters
            if (selectedUser !== 'all') {
                params.append('user_id', selectedUser);
            }
            if (startDate) {
                params.append('start_date', startDate);
            }
            if (endDate) {
                params.append('end_date', endDate);
            }
            if (selectedFilters.length > 0) {
                params.append('actions', selectedFilters.join(','));
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = await fetch(
                `/boards/${boardId}/activities?${params.toString()}`,
            );
            const data = await response.json();

            setAllActivities(data.data);
            setCurrentPage(data.current_page);
            setTotalPages(data.last_page);
            setTotalActivities(data.total);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setIsLoadingPage(false);
        }
    };

    // Refetch when modal opens or filters change
    useEffect(() => {
        if (isModalOpen) {
            fetchActivitiesPage(1);
        }
    }, [
        isModalOpen,
        selectedUser,
        startDate,
        endDate,
        selectedFilters,
        searchQuery,
    ]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        fetchActivitiesPage(page);
        // Scroll to top of content
        const content = document.querySelector('[data-activity-content]');
        if (content) {
            content.scrollTop = 0;
        }
    };

    // Calculate unread count - activities newer than last read time
    const unreadCount = initialActivities.filter((activity) => {
        if (!lastReadTime) return true; // If never read, all are unread
        return new Date(activity.created_at) > new Date(lastReadTime);
    }).length;

    // Mark all as read when dropdown opens
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);

        if (open && initialActivities.length > 0) {
            // Save current timestamp as last read time
            const now = new Date().toISOString();
            const storageKey = `board_${boardId}_last_read`;
            localStorage.setItem(storageKey, now);
            setLastReadTime(now);
        }
    };

    const getActivityMessage = (activity: Activity) => {
        const entityName =
            activity.metadata?.entity_name || activity.entity_type;
        const metadata = activity.metadata || {};

        switch (activity.action) {
            case 'created':
                if (activity.entity_type === 'card' && metadata.list_name) {
                    const cardName = metadata.card_title || entityName;
                    return `created card "${cardName}" in list "${metadata.list_name}"`;
                }
                if (activity.entity_type === 'list') {
                    return `created list "${entityName}"`;
                }
                return `created ${activity.entity_type} "${entityName}"`;

            case 'updated':
                if (
                    activity.entity_type === 'card' &&
                    metadata.changed_fields
                ) {
                    const fields = metadata.changed_fields as string[];

                    // Handle list_id change specially - it's a move action
                    if (fields.includes('list_id') && fields.length === 1) {
                        return `moved card "${metadata.card_title || entityName}"${metadata.list_name ? ` to list "${metadata.list_name}"` : ''}`;
                    }

                    const fieldLabels: Record<string, string> = {
                        title: 'title',
                        description: 'description',
                        due_date: 'due date',
                        is_completed: 'completion status',
                        list_id: 'list',
                        category: 'category',
                        is_archived: 'archive status',
                        cover_color: 'cover color',
                        position: 'position',
                        member_ids: 'assigned members',
                    };

                    // Filter out list_id if there are other changes (show it separately)
                    const fieldsToShow = fields.filter(
                        (f) => f !== 'list_id' && f !== 'position',
                    );

                    if (
                        fieldsToShow.length === 0 &&
                        fields.includes('list_id')
                    ) {
                        return `moved card "${metadata.card_title || entityName}"${metadata.list_name ? ` to list "${metadata.list_name}"` : ''}`;
                    }

                    const changedFieldLabels = fieldsToShow
                        .map((f) => fieldLabels[f] || f)
                        .join(', ');
                    let message = `updated ${changedFieldLabels} of card "${metadata.card_title || entityName}"`;

                    // Add list info if available
                    if (metadata.list_name) {
                        message += ` in list "${metadata.list_name}"`;
                    }

                    // If list was also changed, mention it
                    if (fields.includes('list_id') && fieldsToShow.length > 0) {
                        message += ' and moved it to another list';
                    }

                    return message;
                }
                if (activity.entity_type === 'card' && metadata.list_name) {
                    return `updated card "${entityName}" in list "${metadata.list_name}"`;
                }
                if (metadata.change === 'background_image') {
                    return `updated board background image`;
                }
                if (metadata.change === 'removed_background_image') {
                    return `removed board background image`;
                }
                return `updated ${activity.entity_type} "${entityName}"`;

            case 'deleted':
                if (activity.entity_type === 'card' && metadata.list_name) {
                    return `deleted card "${metadata.card_title || entityName}" from list "${metadata.list_name}"`;
                }
                return `deleted ${activity.entity_type} "${entityName}"`;

            case 'moved':
                if (
                    activity.entity_type === 'card' &&
                    metadata.from_list &&
                    metadata.to_list
                ) {
                    const cardName = metadata.card_title || entityName;
                    return `moved card "${cardName}" from "${metadata.from_list}" to "${metadata.to_list}"`;
                }
                if (activity.entity_type === 'list') {
                    return `reordered list "${entityName}"`;
                }
                return `moved ${activity.entity_type} "${entityName}"`;

            case 'commented':
                if (metadata.card_title) {
                    return `commented on card "${metadata.card_title}"`;
                }
                return `commented on ${activity.entity_type} "${entityName}"`;

            case 'updated_comment':
                if (metadata.card_title) {
                    return `edited a comment on card "${metadata.card_title}"`;
                }
                return `edited a comment`;

            case 'deleted_comment':
                if (metadata.card_title) {
                    return `deleted a comment from card "${metadata.card_title}"`;
                }
                return `deleted a comment`;

            case 'assigned_member':
                if (metadata.member_name && metadata.card_title) {
                    return `assigned ${metadata.member_name} to card "${metadata.card_title}"`;
                }
                return `assigned a member to card "${entityName}"`;

            case 'unassigned_member':
                if (metadata.member_name && metadata.card_title) {
                    return `removed ${metadata.member_name} from card "${metadata.card_title}"`;
                }
                return `removed a member from card "${entityName}"`;

            case 'uploaded_attachment':
                if (metadata.card_title) {
                    return `uploaded an attachment to card "${metadata.card_title}"`;
                }
                return `uploaded an attachment`;

            case 'deleted_attachment':
                if (metadata.card_title) {
                    return `deleted an attachment from card "${metadata.card_title}"`;
                }
                return `deleted an attachment`;

            case 'invited':
                if (metadata.email) {
                    return `invited ${metadata.email} to the board`;
                }
                return `invited a new member to the board`;

            case 'updated_member_role':
                if (metadata.member_name && metadata.new_role) {
                    return `changed ${metadata.member_name}'s role to ${metadata.new_role}`;
                }
                return `updated a member's role`;

            case 'removed_member':
                if (metadata.member_name) {
                    return `removed ${metadata.member_name} from the board`;
                }
                return `removed a member from the board`;

            case 'added_checklist_item':
                if (metadata.card_title) {
                    return `added a checklist item to card "${metadata.card_title}"`;
                }
                return `added a checklist item`;

            case 'updated_checklist_item':
                if (metadata.card_title) {
                    return `updated a checklist item in card "${metadata.card_title}"`;
                }
                return `updated a checklist item`;

            case 'deleted_checklist_item':
                if (metadata.card_title) {
                    return `deleted a checklist item from card "${metadata.card_title}"`;
                }
                return `deleted a checklist item`;

            case 'attached_label':
                if (metadata.card_title && metadata.label_name) {
                    return `attached label "${metadata.label_name}" to card "${metadata.card_title}"`;
                }
                return `attached a label to a card`;

            case 'detached_label':
                if (metadata.card_title && metadata.label_name) {
                    return `removed label "${metadata.label_name}" from card "${metadata.card_title}"`;
                }
                return `removed a label from a card`;

            case 'mentioned':
                if (activity.entity_type === 'comment' && metadata.card_title) {
                    return `mentioned you in a comment on card "${metadata.card_title}"`;
                }
                if (activity.entity_type === 'card' && metadata.card_title) {
                    return `mentioned you in the description of card "${metadata.card_title}"`;
                }
                return `mentioned you`;

            default:
                // Handle label entity type for create/update/delete
                if (activity.entity_type === 'label') {
                    if (activity.action === 'created' && metadata.label_name) {
                        return `created label "${metadata.label_name}"`;
                    }
                    if (activity.action === 'updated' && metadata.label_name) {
                        return `updated label "${metadata.label_name}"`;
                    }
                    if (activity.action === 'deleted' && metadata.label_name) {
                        return `deleted label "${metadata.label_name}"`;
                    }
                }
                return `${activity.action} ${activity.entity_type} "${entityName}"`;
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getActivityIcon = (activity: Activity) => {
        const iconClass = 'h-4 w-4';

        switch (activity.action) {
            case 'created':
                return <Plus className={iconClass} />;
            case 'updated':
                return <Edit className={iconClass} />;
            case 'deleted':
                return <Trash2 className={iconClass} />;
            case 'moved':
                return <ArrowRight className={iconClass} />;
            case 'commented':
            case 'updated_comment':
            case 'deleted_comment':
                return <MessageSquare className={iconClass} />;
            case 'assigned_member':
                return <UserPlus className={iconClass} />;
            case 'unassigned_member':
            case 'removed_member':
                return <UserMinus className={iconClass} />;
            case 'uploaded_attachment':
            case 'deleted_attachment':
                return <Paperclip className={iconClass} />;
            case 'attached_label':
            case 'detached_label':
                return <Tag className={iconClass} />;
            case 'added_checklist_item':
            case 'updated_checklist_item':
            case 'deleted_checklist_item':
                return <CheckSquare className={iconClass} />;
            case 'mentioned':
                return <AtSign className={iconClass} />;
            case 'invited':
            case 'updated_member_role':
                return <Settings className={iconClass} />;
            default:
                if (
                    activity.metadata?.change === 'background_image' ||
                    activity.metadata?.change === 'removed_background_image'
                ) {
                    return <ImageIcon className={iconClass} />;
                }
                return <Bell className={iconClass} />;
        }
    };

    const getActivityColor = (activity: Activity) => {
        switch (activity.action) {
            case 'created':
                return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
            case 'updated':
                return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400';
            case 'deleted':
                return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
            case 'moved':
                return 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400';
            case 'commented':
            case 'updated_comment':
            case 'deleted_comment':
                return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950 dark:text-cyan-400';
            case 'assigned_member':
            case 'unassigned_member':
                return 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400';
            case 'mentioned':
                return 'text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-400';
            default:
                return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400';
        }
    };

    const handleShowAllClick = () => {
        setIsModalOpen(true);
        setIsOpen(false); // Close dropdown when opening modal
    };

    // Get unique users from activities
    const uniqueUsers = useMemo(() => {
        const usersMap = new Map<number, { id: number; name: string }>();
        allActivities.forEach((activity) => {
            if (!usersMap.has(activity.user.id)) {
                usersMap.set(activity.user.id, {
                    id: activity.user.id,
                    name: activity.user.name,
                });
            }
        });
        return Array.from(usersMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [allActivities]);

    // Filter activities - backend handles most filters, frontend only handles unread
    const filteredActivities = useMemo(() => {
        let filtered = allActivities;

        // Filter by unread (frontend only - based on localStorage)
        if (showOnlyUnread && lastReadTime) {
            filtered = filtered.filter(
                (activity) =>
                    new Date(activity.created_at) > new Date(lastReadTime),
            );
        }

        return filtered;
    }, [allActivities, showOnlyUnread, lastReadTime]);

    // Group activities by date
    const groupedActivities = useMemo(() => {
        const groups: { [key: string]: Activity[] } = {
            Today: [],
            Yesterday: [],
            'This Week': [],
            'This Month': [],
            Older: [],
        };

        filteredActivities.forEach((activity) => {
            const date = new Date(activity.created_at);

            if (isToday(date)) {
                groups['Today'].push(activity);
            } else if (isYesterday(date)) {
                groups['Yesterday'].push(activity);
            } else if (isThisWeek(date)) {
                groups['This Week'].push(activity);
            } else if (isThisMonth(date)) {
                groups['This Month'].push(activity);
            } else {
                groups['Older'].push(activity);
            }
        });

        // Remove empty groups
        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [filteredActivities]);

    const actionTypes = [
        { value: 'created', label: 'Created', color: 'text-green-600' },
        { value: 'updated', label: 'Updated', color: 'text-blue-600' },
        { value: 'deleted', label: 'Deleted', color: 'text-red-600' },
        { value: 'moved', label: 'Moved', color: 'text-purple-600' },
        { value: 'commented', label: 'Commented', color: 'text-cyan-600' },
        {
            value: 'assigned_member',
            label: 'Assigned',
            color: 'text-orange-600',
        },
        { value: 'mentioned', label: 'Mentioned', color: 'text-pink-600' },
    ];

    const toggleFilter = (action: string) => {
        setSelectedFilters((prev) =>
            prev.includes(action)
                ? prev.filter((f) => f !== action)
                : [...prev, action],
        );
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedFilters([]);
        setShowOnlyUnread(false);
        setSelectedUser('all');
        setStartDate('');
        setEndDate('');
    };

    const handleActivityClick = (activity: Activity) => {
        // Extract card_id: use entity_id if entity_type is 'card', otherwise check metadata
        let cardId: number | undefined;

        if (activity.entity_type === 'card' && activity.entity_id) {
            cardId = activity.entity_id;
        } else if (activity.metadata?.card_id) {
            cardId = activity.metadata.card_id;
        }

        if (cardId && onCardClick) {
            onCardClick(cardId);
            setIsModalOpen(false);
            setIsOpen(false);
        }
    };

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="relative shrink-0 gap-1 sm:gap-2"
                    >
                        <Bell className="h-4 w-4" />
                        <span className="hidden text-xs sm:inline">
                            Activity
                        </span>
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full p-0 text-[10px] font-bold shadow-lg"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[calc(100vw-2rem)] max-w-[450px] sm:w-[450px]"
                >
                    <div className="border-b bg-muted/30 px-3 py-3 sm:px-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                                <h3 className="flex items-center gap-2 text-sm font-bold sm:text-base">
                                    <Bell className="h-4 w-4 text-primary" />
                                    Recent Activity
                                </h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Latest changes in this board
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {unreadCount} new
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleShowAllClick}
                                    className="h-7 gap-1 px-2 text-xs"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="hidden sm:inline">
                                        View All
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto sm:max-h-96">
                        {initialActivities.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    No recent activity
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground/70">
                                    Activities will appear here when team
                                    members make changes
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {initialActivities
                                    .slice(0, 15)
                                    .map((activity) => {
                                        const isUnread =
                                            lastReadTime &&
                                            new Date(activity.created_at) >
                                                new Date(lastReadTime);
                                        const hasCard =
                                            (activity.entity_type === 'card' &&
                                                activity.entity_id) ||
                                            activity.metadata?.card_id;

                                        return (
                                            <div
                                                key={activity.id}
                                                onClick={() =>
                                                    hasCard &&
                                                    handleActivityClick(
                                                        activity,
                                                    )
                                                }
                                                className={cn(
                                                    'relative px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4',
                                                    isUnread &&
                                                        'border-l-2 border-l-primary bg-primary/5',
                                                    hasCard && 'cursor-pointer',
                                                )}
                                            >
                                                <div className="flex gap-2 sm:gap-3">
                                                    {/* Activity Icon */}
                                                    <div
                                                        className={cn(
                                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9',
                                                            getActivityColor(
                                                                activity,
                                                            ),
                                                        )}
                                                    >
                                                        {getActivityIcon(
                                                            activity,
                                                        )}
                                                    </div>

                                                    {/* Avatar - Hidden on mobile for space */}
                                                    <Avatar className="hidden h-8 w-8 shrink-0 border-2 border-background shadow-sm sm:flex">
                                                        <AvatarImage
                                                            src={
                                                                activity.user
                                                                    .avatar
                                                                    ? `/storage/${activity.user.avatar}`
                                                                    : undefined
                                                            }
                                                            alt={
                                                                activity.user
                                                                    .name
                                                            }
                                                        />
                                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-semibold">
                                                            {getInitials(
                                                                activity.user
                                                                    .name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-xs leading-relaxed sm:text-sm">
                                                                <span className="font-bold text-foreground">
                                                                    {
                                                                        activity
                                                                            .user
                                                                            .name
                                                                    }
                                                                </span>{' '}
                                                                <span className="text-muted-foreground">
                                                                    {getActivityMessage(
                                                                        activity,
                                                                    )}
                                                                </span>
                                                            </p>
                                                            {isUnread && (
                                                                <div
                                                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                                                                    title="Unread"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="mt-1.5 flex items-center gap-2">
                                                            <p className="text-[10px] font-medium text-muted-foreground/80 sm:text-xs">
                                                                {formatDistanceToNow(
                                                                    new Date(
                                                                        activity.created_at,
                                                                    ),
                                                                    {
                                                                        addSuffix: true,
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                    {totalActivities > 15 && (
                        <div className="border-t bg-muted/20 px-3 py-2.5 sm:px-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleShowAllClick}
                                className="w-full text-xs font-medium hover:bg-primary/10"
                            >
                                View all {totalActivities} activities
                                <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* All Activity Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="flex h-[95vh] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Activity Timeline</DialogTitle>
                        <DialogDescription>
                            View all board activities and changes
                        </DialogDescription>
                    </DialogHeader>
                    {/* Header */}
                    <div className="shrink-0 border-b bg-gradient-to-br from-primary/5 via-primary/3 to-background px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="flex flex-1 items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 sm:h-14 sm:w-14">
                                    <Bell className="h-6 w-6 text-primary-foreground sm:h-7 sm:w-7" />
                                </div>
                                <div>
                                    <h2 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-xl font-bold sm:text-2xl">
                                        Activity Timeline
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                        Complete history of all board changes
                                        and updates
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1 text-xs font-semibold"
                                >
                                    {totalActivities} Total
                                </Badge>
                                {unreadCount > 0 && (
                                    <Badge
                                        variant="default"
                                        className="animate-pulse px-3 py-1 text-xs font-semibold"
                                    >
                                        {unreadCount} New
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="shrink-0 border-b bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="space-y-3">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by user name or activity description..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="h-10 border-2 pr-10 pl-10 text-sm transition-colors focus:border-primary"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-2 border-2"
                                        >
                                            <Filter className="h-4 w-4" />
                                            <span className="text-xs font-medium">
                                                Filter by Type
                                            </span>
                                            {selectedFilters.length > 0 && (
                                                <Badge className="ml-1 h-5 px-2 text-[10px] font-bold">
                                                    {selectedFilters.length}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        className="w-64"
                                    >
                                        <div className="px-3 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                            Filter by Action Type
                                        </div>
                                        <DropdownMenuSeparator />
                                        {actionTypes.map((type) => (
                                            <DropdownMenuCheckboxItem
                                                key={type.value}
                                                checked={selectedFilters.includes(
                                                    type.value,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleFilter(type.value)
                                                }
                                                className="py-2.5 text-sm"
                                            >
                                                <span
                                                    className={cn(
                                                        'font-semibold',
                                                        type.color,
                                                    )}
                                                >
                                                    {type.label}
                                                </span>
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Filter by User */}
                                <Select
                                    value={selectedUser}
                                    onValueChange={setSelectedUser}
                                >
                                    <SelectTrigger className="h-9 w-[180px] gap-2 border-2">
                                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <SelectValue placeholder="All Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Users
                                        </SelectItem>
                                        {uniqueUsers.map((user) => (
                                            <SelectItem
                                                key={user.id}
                                                value={user.id.toString()}
                                            >
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Date Range Filter */}
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 items-center gap-1.5 rounded-md border-2 bg-background px-3">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(e.target.value)
                                            }
                                            placeholder="Start Date"
                                            className="w-[110px] border-0 bg-transparent text-xs outline-none"
                                            title="Start Date"
                                        />
                                    </div>

                                    {(startDate || endDate) && (
                                        <span className="text-xs font-medium text-muted-foreground">
                                            to
                                        </span>
                                    )}

                                    <div className="flex h-9 items-center gap-1.5 rounded-md border-2 bg-background px-3">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) =>
                                                setEndDate(e.target.value)
                                            }
                                            placeholder="End Date"
                                            className="w-[110px] border-0 bg-transparent text-xs outline-none"
                                            title="End Date"
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant={
                                        showOnlyUnread ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        setShowOnlyUnread(!showOnlyUnread)
                                    }
                                    className="h-9 gap-2 border-2 font-medium"
                                >
                                    <div
                                        className={cn(
                                            'h-2.5 w-2.5 rounded-full',
                                            showOnlyUnread
                                                ? 'animate-pulse bg-white'
                                                : 'bg-primary',
                                        )}
                                    />
                                    <span className="text-xs">Unread Only</span>
                                    {showOnlyUnread && unreadCount > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 h-5 px-2 text-[10px] font-bold"
                                        >
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </Button>

                                {(searchQuery ||
                                    selectedFilters.length > 0 ||
                                    showOnlyUnread ||
                                    selectedUser !== 'all' ||
                                    startDate ||
                                    endDate) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="h-9 gap-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Clear Filters
                                    </Button>
                                )}

                                <div className="ml-auto rounded-md bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                                    <span className="font-bold text-foreground">
                                        {filteredActivities.length}
                                    </span>{' '}
                                    / {totalActivities}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div
                        className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/10 p-4 sm:p-6"
                        data-activity-content
                    >
                        {isLoadingPage ? (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Loading activities...
                                    </p>
                                </div>
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <div className="max-w-md text-center">
                                    {searchQuery ||
                                    selectedFilters.length > 0 ||
                                    showOnlyUnread ? (
                                        <>
                                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 sm:h-24 sm:w-24">
                                                <Search className="h-10 w-10 text-muted-foreground/40 sm:h-12 sm:w-12" />
                                            </div>
                                            <h3 className="mb-2 text-lg font-bold text-foreground">
                                                No Activities Found
                                            </h3>
                                            <p className="mb-6 text-sm text-muted-foreground">
                                                No activities match your current
                                                filters. Try adjusting your
                                                search criteria or clear all
                                                filters.
                                            </p>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={clearAllFilters}
                                                className="gap-2"
                                            >
                                                <X className="h-4 w-4" />
                                                Clear All Filters
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 sm:h-24 sm:w-24">
                                                <Bell className="h-10 w-10 text-muted-foreground/40 sm:h-12 sm:w-12" />
                                            </div>
                                            <h3 className="mb-2 text-lg font-bold text-foreground">
                                                No Activity Yet
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Activities will appear here when
                                                team members make changes to
                                                cards, lists, or board settings.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {groupedActivities.map(
                                    ([groupName, groupActivities]) => (
                                        <div
                                            key={groupName}
                                            className="space-y-4"
                                        >
                                            {/* Date Group Header */}
                                            <div className="sticky top-0 z-10 -mx-2 bg-gradient-to-r from-background via-background to-muted/30 px-2 py-2 backdrop-blur-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                                        <span className="text-xs font-bold tracking-wide text-primary uppercase">
                                                            {groupName}
                                                        </span>
                                                    </div>
                                                    <div className="h-0.5 flex-1 bg-gradient-to-r from-border to-transparent" />
                                                    <Badge
                                                        variant="secondary"
                                                        className="px-2.5 py-1 text-xs font-bold"
                                                    >
                                                        {groupActivities.length}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Activities in this group */}
                                            <div className="space-y-3 sm:space-y-4">
                                                {groupActivities.map(
                                                    (activity) => {
                                                        const isUnread =
                                                            lastReadTime &&
                                                            new Date(
                                                                activity.created_at,
                                                            ) >
                                                                new Date(
                                                                    lastReadTime,
                                                                );
                                                        const hasCard =
                                                            (activity.entity_type ===
                                                                'card' &&
                                                                activity.entity_id) ||
                                                            activity.metadata
                                                                ?.card_id;

                                                        return (
                                                            <div
                                                                key={
                                                                    activity.id
                                                                }
                                                                onClick={() =>
                                                                    hasCard &&
                                                                    handleActivityClick(
                                                                        activity,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'group relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200 sm:p-5',
                                                                    isUnread
                                                                        ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20'
                                                                        : 'border-border/40 bg-card/50 shadow-sm backdrop-blur-sm hover:border-border hover:bg-card hover:shadow-md',
                                                                    hasCard &&
                                                                        'cursor-pointer',
                                                                )}
                                                            >
                                                                {isUnread && (
                                                                    <div className="absolute top-0 right-0 -z-10 h-24 w-24 rounded-bl-full bg-gradient-to-br from-primary/20 to-transparent" />
                                                                )}

                                                                <div className="flex gap-3 sm:gap-4">
                                                                    {/* Activity Icon */}
                                                                    <div
                                                                        className={cn(
                                                                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 sm:h-14 sm:w-14',
                                                                            getActivityColor(
                                                                                activity,
                                                                            ),
                                                                        )}
                                                                    >
                                                                        {getActivityIcon(
                                                                            activity,
                                                                        )}
                                                                    </div>

                                                                    {/* Avatar */}
                                                                    <Avatar className="h-12 w-12 shrink-0 border-3 border-background shadow-lg ring-2 ring-border/50 transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
                                                                        <AvatarImage
                                                                            src={
                                                                                activity
                                                                                    .user
                                                                                    .avatar
                                                                                    ? `/storage/${activity.user.avatar}`
                                                                                    : undefined
                                                                            }
                                                                            alt={
                                                                                activity
                                                                                    .user
                                                                                    .name
                                                                            }
                                                                        />
                                                                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-bold">
                                                                            {getInitials(
                                                                                activity
                                                                                    .user
                                                                                    .name,
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex-1">
                                                                                <p className="mb-2 text-sm leading-relaxed sm:text-base">
                                                                                    <span className="text-base font-bold text-foreground sm:text-lg">
                                                                                        {
                                                                                            activity
                                                                                                .user
                                                                                                .name
                                                                                        }
                                                                                    </span>{' '}
                                                                                    <span className="text-muted-foreground">
                                                                                        {getActivityMessage(
                                                                                            activity,
                                                                                        )}
                                                                                    </span>
                                                                                </p>
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1">
                                                                                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                                                        <p className="text-xs font-semibold text-foreground">
                                                                                            {format(
                                                                                                new Date(
                                                                                                    activity.created_at,
                                                                                                ),
                                                                                                'MMM d, yyyy',
                                                                                            )}
                                                                                        </p>
                                                                                        <span className="text-muted-foreground">
                                                                                            •
                                                                                        </span>
                                                                                        <p className="text-xs font-medium text-muted-foreground">
                                                                                            {format(
                                                                                                new Date(
                                                                                                    activity.created_at,
                                                                                                ),
                                                                                                'HH:mm',
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-[10px] font-medium"
                                                                                    >
                                                                                        {formatDistanceToNow(
                                                                                            new Date(
                                                                                                activity.created_at,
                                                                                            ),
                                                                                            {
                                                                                                addSuffix: true,
                                                                                            },
                                                                                        )}
                                                                                    </Badge>
                                                                                    {isUnread && (
                                                                                        <Badge className="animate-pulse text-[10px] font-bold shadow-lg">
                                                                                            ✨
                                                                                            New
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {!isLoadingPage && totalPages > 1 && (
                        <div className="shrink-0 border-t bg-muted/30 px-4 py-3 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Page{' '}
                                    <strong className="text-foreground">
                                        {currentPage}
                                    </strong>{' '}
                                    of{' '}
                                    <strong className="text-foreground">
                                        {totalPages}
                                    </strong>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Previous Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="h-8 gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Previous
                                        </span>
                                    </Button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {/* First Page */}
                                        {currentPage > 3 && (
                                            <>
                                                <Button
                                                    variant={
                                                        currentPage === 1
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(1)
                                                    }
                                                    className="h-8 w-8 p-0 text-xs"
                                                >
                                                    1
                                                </Button>
                                                {currentPage > 4 && (
                                                    <span className="px-1 text-muted-foreground">
                                                        ...
                                                    </span>
                                                )}
                                            </>
                                        )}

                                        {/* Pages around current */}
                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1,
                                        )
                                            .filter((page) => {
                                                return (
                                                    page === currentPage ||
                                                    page === currentPage - 1 ||
                                                    page === currentPage + 1 ||
                                                    (currentPage <= 2 &&
                                                        page <= 3) ||
                                                    (currentPage >=
                                                        totalPages - 1 &&
                                                        page >= totalPages - 2)
                                                );
                                            })
                                            .map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        currentPage === page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(page)
                                                    }
                                                    className="h-8 w-8 p-0 text-xs font-medium"
                                                >
                                                    {page}
                                                </Button>
                                            ))}

                                        {/* Last Page */}
                                        {currentPage < totalPages - 2 && (
                                            <>
                                                {currentPage <
                                                    totalPages - 3 && (
                                                    <span className="px-1 text-muted-foreground">
                                                        ...
                                                    </span>
                                                )}
                                                <Button
                                                    variant={
                                                        currentPage ===
                                                        totalPages
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            totalPages,
                                                        )
                                                    }
                                                    className="h-8 w-8 p-0 text-xs"
                                                >
                                                    {totalPages}
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {/* Next Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="h-8 gap-1"
                                    >
                                        <span className="hidden sm:inline">
                                            Next
                                        </span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer with stats */}
                    {allActivities.length > 0 && (
                        <div className="shrink-0 border-t-2 bg-gradient-to-r from-primary/5 via-background to-muted/20 px-4 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2 rounded-lg border bg-background/80 px-3 py-1.5">
                                        <span className="font-medium text-muted-foreground">
                                            Showing
                                        </span>
                                        <span className="text-base font-bold text-primary">
                                            {filteredActivities.length}
                                        </span>
                                        <span className="font-medium text-muted-foreground">
                                            of
                                        </span>
                                        <span className="text-base font-bold text-foreground">
                                            {totalActivities}
                                        </span>
                                    </div>
                                    {unreadCount > 0 && (
                                        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5">
                                            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                            <span className="font-medium text-muted-foreground">
                                                Unread:
                                            </span>
                                            <span className="text-base font-bold text-primary">
                                                {unreadCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {(searchQuery ||
                                        selectedFilters.length > 0 ||
                                        showOnlyUnread) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearAllFilters}
                                            className="h-8 gap-2 font-medium hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Reset Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
