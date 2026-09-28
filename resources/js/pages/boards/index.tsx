import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Board } from '@/lib/store';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    Clock,
    FileText,
    Globe,
    Layers,
    Lock,
    Plus,
    Search,
    SortAsc,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const COLOR_PRESETS = [
    '#0079bf', // Blue
    '#519839', // Green
    '#d29034', // Orange
    '#b04632', // Red
    '#89609e', // Purple
    '#00aecc', // Cyan
    '#172b4d', // Indigo
    '#344563', // Charcoal
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Boards',
        href: '/boards',
    },
];

interface BoardsProps {
    boards: Board[];
}

export default function BoardsIndex({ boards: initialBoards }: BoardsProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>(
        'updated',
    );

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        visibility: 'private' as 'private' | 'team' | 'public',
        background_color: '#0079bf',
    });

    const handleCreateBoard = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.title.trim()) {
            toast.error('Please enter a board title');
            return;
        }

        post('/boards', {
            onSuccess: () => {
                toast.success('Board created successfully');
                setIsCreateDialogOpen(false);
                reset();
            },
            onError: (errors) => {
                toast.error(errors.title || 'Failed to create board');
            },
        });
    };

    const getVisibilityConfig = (visibility: string) => {
        switch (visibility) {
            case 'public':
                return {
                    icon: <Globe className="h-3.5 w-3.5" />,
                    label: 'Public',
                    color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30',
                };
            case 'team':
                return {
                    icon: <Users className="h-3.5 w-3.5" />,
                    label: 'Team',
                    color: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/20 dark:border-purple-500/30',
                };
            default:
                return {
                    icon: <Lock className="h-3.5 w-3.5" />,
                    label: 'Private',
                    color: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-500/30',
                };
        }
    };

    // Calculate board statistics
    const getBoardStats = (board: Board) => {
        const totalCards =
            board.lists?.reduce(
                (sum, list) => sum + (list.cards?.length || 0),
                0,
            ) || 0;
        const completedCards =
            board.lists?.reduce(
                (sum, list) =>
                    sum +
                    (list.cards?.filter((card) => card.is_completed).length ||
                        0),
                0,
            ) || 0;
        const completionPercentage =
            totalCards > 0
                ? Math.round((completedCards / totalCards) * 100)
                : 0;

        return {
            totalCards,
            completedCards,
            completionPercentage,
            totalLists: board.lists?.length || 0,
            totalMembers: board.members?.length || 0,
        };
    };

    // Filter and sort boards
    const filteredAndSortedBoards = useMemo(() => {
        const filtered = initialBoards.filter(
            (board) =>
                board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                board.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'updated':
                    return (
                        new Date(b.updated_at || 0).getTime() -
                        new Date(a.updated_at || 0).getTime()
                    );
                case 'created':
                    return (
                        new Date(b.created_at || 0).getTime() -
                        new Date(a.created_at || 0).getTime()
                    );
                default:
                    return 0;
            }
        });
    }, [initialBoards, searchQuery, sortBy]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Boards" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold sm:text-3xl">
                            My Boards
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {initialBoards.length}{' '}
                            {initialBoards.length === 1 ? 'board' : 'boards'} •
                            Manage your projects and tasks
                        </p>
                    </div>

                    <Dialog
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="shadow-lg transition-all hover:shadow-xl">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Board
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create New Board</DialogTitle>
                                <DialogDescription>
                                    Create a new board to organize your tasks
                                    and collaborate with your team
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateBoard}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">
                                            Board Title *
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g., Marketing Campaign 2024"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData('title', e.target.value)
                                            }
                                            error={errors.title}
                                            autoFocus
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-destructive">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description (Optional)
                                        </Label>
                                        <Input
                                            id="description"
                                            placeholder="Brief description of this board"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="visibility">
                                            Visibility
                                        </Label>
                                        <select
                                            id="visibility"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:ring-2 focus:ring-ring focus:outline-none"
                                            value={data.visibility}
                                            onChange={(e) =>
                                                setData(
                                                    'visibility',
                                                    e.target.value as
                                                        | 'private'
                                                        | 'team'
                                                        | 'public',
                                                )
                                            }
                                        >
                                            <option value="private">
                                                🔒 Private - Only you can see
                                            </option>
                                            <option value="team">
                                                👥 Team - Team members can see
                                            </option>
                                            <option value="public">
                                                🌍 Public - Anyone can see
                                            </option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color">
                                            Board Color
                                        </Label>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {COLOR_PRESETS.map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                                        data.background_color === preset
                                                            ? 'border-foreground ring-2 ring-primary ring-offset-2'
                                                            : 'border-transparent'
                                                    }`}
                                                    style={{ backgroundColor: preset }}
                                                    onClick={() => setData('background_color', preset)}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Input
                                                id="color"
                                                type="color"
                                                value={data.background_color}
                                                onChange={(e) =>
                                                    setData(
                                                        'background_color',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-8 w-14 cursor-pointer p-0.5"
                                            />
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {data.background_color}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing
                                            ? 'Creating...'
                                            : 'Create Board'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search and Filter Bar */}
                {initialBoards.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search boards..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <SortAsc className="h-4 w-4 text-muted-foreground" />
                            <select
                                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:ring-2 focus:ring-ring focus:outline-none"
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(
                                        e.target.value as
                                            | 'name'
                                            | 'updated'
                                            | 'created',
                                    )
                                }
                            >
                                <option value="updated">Last Updated</option>
                                <option value="created">Date Created</option>
                                <option value="name">Name (A-Z)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Boards Grid */}
                {filteredAndSortedBoards.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="max-w-md text-center">
                            {searchQuery ? (
                                <>
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted dark:bg-muted/50">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h2 className="text-xl font-semibold sm:text-2xl">
                                        No boards found
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Try adjusting your search to find what
                                        you're looking for
                                    </p>
                                    <Button
                                        onClick={() => setSearchQuery('')}
                                        variant="outline"
                                        className="mt-4"
                                    >
                                        Clear Search
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 dark:border-primary/30 dark:bg-primary/20">
                                        <Layers className="h-8 w-8 text-primary dark:text-primary" />
                                    </div>
                                    <h2 className="text-xl font-semibold sm:text-2xl">
                                        No boards yet
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Create your first board to start
                                        organizing your tasks and collaborating
                                        with your team
                                    </p>
                                    <Button
                                        onClick={() =>
                                            setIsCreateDialogOpen(true)
                                        }
                                        className="mt-4 shadow-lg"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Your First Board
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAndSortedBoards.map((board, index) => {
                            const stats = getBoardStats(board);
                            const visibilityConfig = getVisibilityConfig(
                                board.visibility,
                            );

                            return (
                                <motion.div
                                    key={board.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <Card
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:hover:border-primary/50 cursor-pointer"
                                        onClick={() =>
                                            router.visit(`/boards/${board.id}`)
                                        }
                                    >
                                        <div>
                                            {/* Colored Top Accent Bar */}
                                            <div
                                                className="h-2.5 w-full opacity-90 transition-opacity group-hover:opacity-100"
                                                style={{
                                                    backgroundColor:
                                                        board.background_color || '#0079bf',
                                                }}
                                            />

                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <CardTitle className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                                                        {board.title}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`shrink-0 gap-1 border px-2 py-0.5 text-[11px] ${visibilityConfig.color}`}
                                                    >
                                                        {visibilityConfig.icon}
                                                        <span>
                                                            {visibilityConfig.label}
                                                        </span>
                                                    </Badge>
                                                </div>
                                                {board.description && (
                                                    <CardDescription className="line-clamp-2 mt-1 text-xs text-muted-foreground">
                                                        {board.description}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>

                                            <CardContent className="space-y-3 p-4 pt-1">
                                                {/* Progress Bar */}
                                                {stats.totalCards > 0 && (
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                                Penyelesaian
                                                            </span>
                                                            <span className="font-semibold text-foreground">
                                                                {stats.completionPercentage}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                                style={{
                                                                    width: `${stats.completionPercentage}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border/50 bg-muted/40 p-2 text-center dark:bg-muted/20">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {stats.totalLists}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Kolom
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-center border-x border-border/50">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {stats.completedCards}/{stats.totalCards}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Tugas
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {stats.totalMembers}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Anggota
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Members Avatars */}
                                                {board.members && board.members.length > 0 && (
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <div className="flex -space-x-1.5">
                                                            {board.members.slice(0, 4).map((member) => (
                                                                <Avatar
                                                                    key={member.id}
                                                                    className="h-6 w-6 border-2 border-background ring-1 ring-border/50"
                                                                >
                                                                    <AvatarImage
                                                                        src={
                                                                            member.avatar
                                                                                ? `/storage/${member.avatar}`
                                                                                : undefined
                                                                        }
                                                                        alt={member.name}
                                                                    />
                                                                    <AvatarFallback className="text-[9px] font-semibold">
                                                                        {member.name
                                                                            .split(' ')
                                                                            .map((n) => n[0])
                                                                            .join('')
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                            {board.members.length > 4 && (
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold ring-1 ring-border/50">
                                                                    +{board.members.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </div>

                                        {/* Card Footer with Quick Report Link and Last Updated */}
                                        <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {board.updated_at
                                                        ? formatDistanceToNow(
                                                              new Date(board.updated_at),
                                                              { addSuffix: true },
                                                          )
                                                        : 'Baru saja'}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 gap-1 px-2 text-[11px] font-medium text-primary hover:bg-primary/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.visit(`/boards/${board.id}/report`);
                                                }}
                                            >
                                                <FileText className="h-3 w-3" />
                                                Laporan
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
