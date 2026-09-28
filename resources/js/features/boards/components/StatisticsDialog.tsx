import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Board } from '@/lib/store';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Clock,
    FileText,
} from 'lucide-react';

interface StatisticsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    board: Board;
}

interface UserStats {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    totalCards: number;
    completedCards: number;
    percentage: number;
}

// Get progress color based on percentage
const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 30) return 'bg-amber-500';
    return 'bg-rose-500';
};

// Get text color based on percentage
const getTextColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 50) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 30) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
};

export function StatisticsDialog({
    open,
    onOpenChange,
    board,
}: StatisticsDialogProps) {
    // 1. Calculate Board-wide true metrics (Synced directly with lists and cards)
    const allCards = board.lists?.flatMap((list) => list.cards || []) || [];
    const totalBoardCards = allCards.length;
    const totalCompletedCards = allCards.filter(
        (card) => card.is_completed,
    ).length;
    const totalInProgressCards = totalBoardCards - totalCompletedCards;
    const overallPercentage =
        totalBoardCards > 0
            ? Math.round((totalCompletedCards / totalBoardCards) * 100)
            : 0;

    // Check overdue cards
    const now = new Date();
    const totalOverdueCards = allCards.filter((card) => {
        return (
            card.due_date && !card.is_completed && new Date(card.due_date) < now
        );
    }).length;

    // 2. Calculate User Statistics with accurate mapping
    const calculateUserStats = (): UserStats[] => {
        const statsMap = new Map<number, UserStats>();

        // Initialize stats for all board members
        board.members?.forEach((member) => {
            statsMap.set(member.id, {
                id: member.id,
                name: member.name,
                email: member.email,
                avatar: (member as any).avatar,
                totalCards: 0,
                completedCards: 0,
                percentage: 0,
            });
        });

        // Count cards for each user
        board.lists?.forEach((list) => {
            list.cards?.forEach((card) => {
                card.members?.forEach((member) => {
                    const stats = statsMap.get(member.id);
                    if (stats) {
                        stats.totalCards++;
                        if (card.is_completed) {
                            stats.completedCards++;
                        }
                    }
                });
            });
        });

        // Calculate percentages
        statsMap.forEach((stats) => {
            if (stats.totalCards > 0) {
                stats.percentage = Math.round(
                    (stats.completedCards / stats.totalCards) * 100,
                );
            }
        });

        // Convert to array, sort members with cards first, then alphabetically
        return Array.from(statsMap.values()).sort((a, b) => {
            if (b.totalCards !== a.totalCards) {
                return b.totalCards - a.totalCards;
            }
            return a.name.localeCompare(b.name);
        });
    };

    const userStats = calculateUserStats();
    const activeMembersWithCards = userStats.filter((s) => s.totalCards > 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-6">
                <DialogHeader className="shrink-0 border-b border-border pb-2">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <span>Statistik & Ringkasan Board</span>
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        Pantau progres penyelesaian tugas, kontribusi anggota,
                        dan metrik kesehatan board secara real-time.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-5 overflow-y-auto py-4 pr-1">
                    {/* Synchronized Board-Wide KPI Cards */}
                    <div>
                        <h4 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Ringkasan Keseluruhan
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl border border-border bg-slate-50 p-3.5 dark:bg-slate-900">
                                <p className="text-2xl font-bold text-foreground">
                                    {totalBoardCards}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>Total Kartu</span>
                                </p>
                            </div>

                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {totalCompletedCards}
                                    </p>
                                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        {overallPercentage}%
                                    </span>
                                </div>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Selesai</span>
                                </p>
                            </div>

                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {totalInProgressCards}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-700/80 dark:text-blue-400/80">
                                    <Clock className="h-3 w-3" />
                                    <span>Dalam Proses</span>
                                </p>
                            </div>

                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5">
                                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                    {totalOverdueCards}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-rose-700/80 dark:text-rose-400/80">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Overdue</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Member Progress List */}
                    <div>
                        <div className="mb-2.5 flex items-center justify-between">
                            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Kinerja Anggota Tim (
                                {activeMembersWithCards.length} aktif)
                            </h4>
                        </div>

                        {userStats.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                                Belum ada anggota di board ini.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {userStats.map((stats) => (
                                    <div
                                        key={stats.id}
                                        className="rounded-xl border border-border bg-card/60 p-3.5 transition-colors hover:bg-accent/40"
                                    >
                                        <div className="mb-2.5 flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-border">
                                                <AvatarImage
                                                    src={
                                                        stats.avatar
                                                            ? `/storage/${stats.avatar}`
                                                            : undefined
                                                    }
                                                    alt={stats.name}
                                                />
                                                <AvatarFallback className="text-xs font-semibold">
                                                    {stats.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {stats.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {stats.email}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-xl font-bold ${getTextColor(stats.percentage)}`}
                                                >
                                                    {stats.totalCards > 0
                                                        ? `${stats.percentage}%`
                                                        : '0%'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {stats.completedCards}/
                                                    {stats.totalCards} tugas
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(stats.percentage)}`}
                                                    style={{
                                                        width: `${stats.totalCards > 0 ? stats.percentage : 0}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Action CTA -> Direct to Report Page */}
                <div className="-mx-6 -mb-6 flex shrink-0 flex-col items-center justify-between gap-3 rounded-b-lg border-t border-border bg-muted/30 p-4 pt-3 sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                            Butuh filter harian/bulanan & unduh laporan resmi?
                        </span>
                    </div>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            router.visit(`/boards/${board.id}/report`);
                        }}
                        className="h-9 w-full gap-2 bg-[#0052cc] text-xs font-medium text-white shadow hover:bg-[#0747a6] sm:w-auto sm:text-sm"
                    >
                        <span>Buka Report & Unduh PDF</span>
                        <ArrowUpRight className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
