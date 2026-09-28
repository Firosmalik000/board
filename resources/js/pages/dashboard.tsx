import { BrandLogo } from '@/components/shared/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckSquare,
    Clock,
    LayoutGrid,
    Plus,
    Trello,
    TrendingUp,
    User,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Board {
    id: number;
    title: string;
    description?: string;
    background_color: string;
    background_image?: string;
    is_owner: boolean;
    owner: {
        id: number;
        name: string;
    };
    members?: Array<{
        id: number;
        name: string;
    }>;
}

interface CardItem {
    id: number;
    title: string;
    is_completed: boolean;
    created_at: string;
    is_creator: boolean;
    list: {
        title: string;
        board: {
            id: number;
            title: string;
        };
    };
}

interface Statistics {
    totalBoards: number;
    totalCards: number;
    completedTasks: number;
    createdCards: number;
    assignedCards: number;
}

interface DashboardProps {
    statistics: Statistics;
    recentBoards: Board[];
    recentCards: CardItem[];
    error?: string;
}

export default function Dashboard({
    statistics,
    recentBoards,
    recentCards,
    error,
}: DashboardProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load form data from localStorage for persistence
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('dashboard_board_form');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {
                    title: '',
                    description: '',
                    visibility: 'private',
                    background_color: '#0079bf',
                };
            }
        }
        return {
            title: '',
            description: '',
            visibility: 'private',
            background_color: '#0079bf',
        };
    });

    // Save form data to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_board_form', JSON.stringify(formData));
    }, [formData]);

    // Error feedback
    useEffect(() => {
        if (error) {
            toast.error(error, {
                duration: 5000,
                action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                },
            });
        }
    }, [error]);

    const handleCreateBoard = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Please enter a board title');
            return;
        }

        setIsLoading(true);
        router.post('/boards', formData, {
            onSuccess: () => {
                toast.success('Board created successfully!');
                setIsCreateDialogOpen(false);
                const resetData = {
                    title: '',
                    description: '',
                    visibility: 'private',
                    background_color: '#0079bf',
                };
                setFormData(resetData);
                localStorage.removeItem('dashboard_board_form');
            },
            onError: (errors) => {
                const errorMessage =
                    errors.title ||
                    errors.description ||
                    'Failed to create board. Please try again.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    // Trello official preset colors
    const trelloColors = [
        '#0079bf', // Blue
        '#d29034', // Orange
        '#519839', // Green
        '#b04632', // Red
        '#89609e', // Purple
        '#cd5a91', // Pink
        '#4bbf6b', // Lime
        '#00aecc', // Sky
        '#838c91', // Slate
    ];

    const completionRate =
        statistics.totalCards > 0
            ? Math.round(
                  (statistics.completedTasks / statistics.totalCards) * 100,
              )
            : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Workspace" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 md:p-8">
                {/* Workspace Profile Header (Trello Style) */}
                <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <BrandLogo
                                variant="icon"
                                size="sm"
                                className="size-8 object-contain"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    Firlabs Board Workspace
                                </h1>
                                <Badge
                                    variant="outline"
                                    className="text-xs font-normal"
                                >
                                    Free
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                                Kelola board kolaboratif, tugas tim, dan
                                visualisasi kanban Anda.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Quick Create Board Trigger */}
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="gap-2 bg-[#0052cc] text-xs font-medium text-white shadow-xs hover:bg-[#0747a6] sm:text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Board</span>
                        </Button>
                    </div>
                </div>

                {/* Clean Workspace Metrics Bar */}
                <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs">
                        <div className="mb-1 flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Total Boards
                            </span>
                            <LayoutGrid className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {statistics.totalBoards}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Ruang kerja aktif
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs">
                        <div className="mb-1 flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Total Tugas
                            </span>
                            <CheckSquare className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {statistics.totalCards}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {statistics.createdCards} dibuat oleh Anda
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs">
                        <div className="mb-1 flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Ditugaskan ke Anda
                            </span>
                            <User className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {statistics.assignedCards}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Tugas yang perlu diselesaikan
                        </p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
                        <div className="mb-1 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                            <span className="text-xs font-medium">
                                Tingkat Selesai
                            </span>
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                {completionRate}%
                            </span>
                            <span className="text-xs font-medium text-emerald-600">
                                ({statistics.completedTasks} selesai)
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/20">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Your Boards Grid (Authentic Trello Look) */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trello className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                Your Boards
                            </h2>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Link href="/boards">
                                <span>View all boards</span>
                                <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {/* Create New Board Card Tile (Iconic Trello Tile) */}
                        <Dialog
                            open={isCreateDialogOpen}
                            onOpenChange={setIsCreateDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <div className="group flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-700 shadow-xs transition-all hover:bg-slate-200/70 sm:h-32 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800/80">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 transition-transform group-hover:scale-110 dark:bg-slate-800">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium sm:text-sm">
                                        Create new board
                                    </span>
                                </div>
                            </DialogTrigger>

                            <DialogContent className="p-6 sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold">
                                        Create Board
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Set a title, visibility, and theme color
                                        for your workspace board.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={handleCreateBoard}
                                    className="space-y-4 pt-2"
                                >
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="title"
                                            className="text-xs font-semibold"
                                        >
                                            Board Title *
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Marketing Launch, Sprint 24..."
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    title: e.target.value,
                                                })
                                            }
                                            required
                                            autoFocus
                                            className="h-9 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="description"
                                            className="text-xs font-semibold"
                                        >
                                            Description
                                        </Label>
                                        <Input
                                            id="description"
                                            placeholder="What is this board for?"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            className="h-9 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="visibility"
                                            className="text-xs font-semibold"
                                        >
                                            Visibility
                                        </Label>
                                        <select
                                            id="visibility"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-[#0052cc] focus-visible:outline-none"
                                            value={formData.visibility}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    visibility: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="private">
                                                🔒 Private - Only you and
                                                invited members
                                            </option>
                                            <option value="team">
                                                👥 Team - All workspace members
                                            </option>
                                            <option value="public">
                                                🌍 Public - Anyone can view
                                            </option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">
                                            Background Color
                                        </Label>
                                        <div className="grid grid-cols-9 gap-2">
                                            {trelloColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`h-7 w-7 rounded-md shadow-xs transition-transform hover:scale-105 ${
                                                        formData.background_color ===
                                                        color
                                                            ? 'scale-105 ring-2 ring-primary ring-offset-2'
                                                            : ''
                                                    }`}
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            background_color:
                                                                color,
                                                        })
                                                    }
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 border-t pt-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setIsCreateDialogOpen(false)
                                            }
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={isLoading}
                                            className="bg-[#0052cc] text-white hover:bg-[#0747a6]"
                                        >
                                            {isLoading
                                                ? 'Creating...'
                                                : 'Create'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Board Tiles */}
                        {recentBoards.map((board) => (
                            <Link
                                key={board.id}
                                href={`/boards/${board.id}`}
                                className="group block"
                            >
                                <div
                                    className="relative flex h-28 flex-col justify-between overflow-hidden rounded-xl p-3 shadow-xs transition-all group-hover:opacity-95 hover:shadow-md sm:h-32"
                                    style={{
                                        backgroundColor:
                                            board.background_color || '#0079bf',
                                        backgroundImage: board.background_image
                                            ? `url(/storage/${board.background_image})`
                                            : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    {/* Subtle darkening overlay */}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                                    {/* Top Bar: Title & Owner badge */}
                                    <div className="relative z-10 flex items-start justify-between gap-1.5">
                                        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-white drop-shadow-sm sm:text-base">
                                            {board.title}
                                        </h3>
                                        {board.is_owner && (
                                            <span className="shrink-0 rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                                                Owner
                                            </span>
                                        )}
                                    </div>

                                    {/* Bottom Bar: Members and Action */}
                                    <div className="relative z-10 flex items-center justify-between text-xs text-white/90">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-[11px]">
                                                <Users className="h-3 w-3" />
                                                <span>
                                                    {board.members?.length || 1}
                                                </span>
                                            </div>
                                            <span className="max-w-[100px] truncate text-[10px] opacity-75">
                                                {board.owner.name}
                                            </span>
                                        </div>

                                        <ArrowRight className="h-3.5 w-3.5 translate-x-0 opacity-0 transition-opacity group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Highlights & Recent Activity Feed (Trello Style) */}
                {recentCards.length > 0 && (
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                Highlights & Recent Tasks
                            </h2>
                        </div>

                        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                            {recentCards.map((card) => (
                                <Link
                                    key={card.id}
                                    href={`/boards/${card.list.board.id}`}
                                    className="group flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-muted/40 sm:text-sm"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                card.is_completed
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                            }`}
                                        >
                                            <CheckSquare className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`truncate font-medium text-foreground transition-colors group-hover:text-primary ${
                                                        card.is_completed
                                                            ? 'text-muted-foreground line-through'
                                                            : ''
                                                    }`}
                                                >
                                                    {card.title}
                                                </span>
                                                {!card.is_creator && (
                                                    <Badge
                                                        variant="outline"
                                                        className="px-1 py-0 text-[10px] font-normal"
                                                    >
                                                        Assigned
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {card.list.board.title}
                                                </span>
                                                <span>•</span>
                                                <span>{card.list.title}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-2 flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                                        <span className="hidden sm:inline">
                                            {new Date(
                                                card.created_at,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                        <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
