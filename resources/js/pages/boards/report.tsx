import { BrandLogo } from '@/components/shared/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Board } from '@/lib/store';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    endOfMonth,
    endOfWeek,
    format,
    isThisMonth,
    isThisWeek,
    isToday,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle2,
    CheckSquare,
    Circle,
    Clock,
    Download,
    FileText,
    Filter,
    Layers,
    Paperclip,
    Printer,
    Search,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface ActivityItem {
    id: number;
    user_id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    metadata: any;
    created_at: string;
    user?: {
        id: number;
        name: string;
        avatar?: string;
    };
}

interface BoardReportProps {
    board: Board;
    activities: ActivityItem[];
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function BoardReport({
    board,
    activities: _activities = [],
}: BoardReportProps) {
    const [period, setPeriod] = useState<PeriodFilter>('month');
    const [selectedMember, setSelectedMember] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Boards',
            href: '/boards',
        },
        {
            title: board.title,
            href: `/boards/${board.id}`,
        },
        {
            title: `${board.title} Report`,
            href: `/boards/${board.id}/report`,
        },
    ];

    // Flatten all cards from lists
    const allCards = useMemo(() => {
        return (
            board.lists?.flatMap((list) =>
                (list.cards || []).map((card) => ({
                    ...card,
                    listTitle: list.title,
                    listId: list.id,
                })),
            ) || []
        );
    }, [board.lists]);

    // Filter cards by period & member & search
    const filteredCards = useMemo(() => {
        return allCards.filter((card) => {
            // 1. Period filter
            if (period !== 'all') {
                const dateToEvaluate =
                    card.created_at || (card as any).updated_at;
                if (dateToEvaluate) {
                    try {
                        const cardDate =
                            typeof dateToEvaluate === 'string'
                                ? parseISO(dateToEvaluate)
                                : new Date(dateToEvaluate);
                        if (period === 'today' && !isToday(cardDate))
                            return false;
                        if (
                            period === 'week' &&
                            !isThisWeek(cardDate, { weekStartsOn: 1 })
                        )
                            return false;
                        if (period === 'month' && !isThisMonth(cardDate))
                            return false;
                    } catch (_e) {
                        // fallback
                    }
                }
            }

            // 2. Member filter
            if (selectedMember !== 'all') {
                const memberId = parseInt(selectedMember, 10);
                const hasMember = card.members?.some(
                    (m: any) => m.id === memberId,
                );
                if (!hasMember) return false;
            }

            // 3. Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTitle = card.title?.toLowerCase().includes(query);
                const matchDesc = card.description
                    ?.toLowerCase()
                    .includes(query);
                const matchList = card.listTitle?.toLowerCase().includes(query);
                if (!matchTitle && !matchDesc && !matchList) return false;
            }

            return true;
        });
    }, [allCards, period, selectedMember, searchQuery]);

    // KPIs
    const totalCardsCount = filteredCards.length;
    const completedCardsCount = filteredCards.filter(
        (c) => c.is_completed,
    ).length;
    const inProgressCardsCount = totalCardsCount - completedCardsCount;
    const completionRate =
        totalCardsCount > 0
            ? Math.round((completedCardsCount / totalCardsCount) * 100)
            : 0;

    const now = new Date();
    const overdueCardsCount = filteredCards.filter((c) => {
        return c.due_date && !c.is_completed && new Date(c.due_date) < now;
    }).length;

    // Checklists stats
    const totalChecklistsCount = filteredCards.reduce(
        (acc, c) => acc + (c.checklists?.length || 0),
        0,
    );
    const completedChecklistsCount = filteredCards.reduce(
        (acc, c) =>
            acc +
            (c.checklists?.filter((item: any) => item.is_completed).length ||
                0),
        0,
    );
    const checklistCompletionRate =
        totalChecklistsCount > 0
            ? Math.round(
                  (completedChecklistsCount / totalChecklistsCount) * 100,
              )
            : 0;

    // Member Performance Matrix
    const memberStats = useMemo(() => {
        const map = new Map<
            number,
            {
                id: number;
                name: string;
                email: string;
                avatar?: string;
                assigned: number;
                completed: number;
                inProgress: number;
                overdue: number;
                rate: number;
            }
        >();

        // Init members
        board.members?.forEach((m) => {
            map.set(m.id, {
                id: m.id,
                name: m.name,
                email: m.email,
                avatar: (m as any).avatar,
                assigned: 0,
                completed: 0,
                inProgress: 0,
                overdue: 0,
                rate: 0,
            });
        });

        // Accumulate from filtered cards
        filteredCards.forEach((c) => {
            c.members?.forEach((m: any) => {
                const stat = map.get(m.id);
                if (stat) {
                    stat.assigned++;
                    if (c.is_completed) {
                        stat.completed++;
                    } else {
                        stat.inProgress++;
                        if (c.due_date && new Date(c.due_date) < now) {
                            stat.overdue++;
                        }
                    }
                }
            });
        });

        map.forEach((stat) => {
            stat.rate =
                stat.assigned > 0
                    ? Math.round((stat.completed / stat.assigned) * 100)
                    : 0;
        });

        return Array.from(map.values()).sort((a, b) => b.assigned - a.assigned);
    }, [board.members, filteredCards]);

    // Grouped cards by list (for detailed PDF and structured view)
    const cardsGroupedByList = useMemo(() => {
        return (board.lists || []).map((list) => {
            const listCards = filteredCards.filter((c) => c.listId === list.id);
            return {
                id: list.id,
                title: list.title,
                cards: listCards,
                total: listCards.length,
                completed: listCards.filter((c) => c.is_completed).length,
            };
        });
    }, [board.lists, filteredCards]);

    // Trigger Print / PDF download
    const handlePrint = () => {
        window.print();
    };

    // Exact period label with date range as requested:
    // "xbayar report tanggal berapa dan berapa"
    const getPeriodFormattedRange = (p: PeriodFilter) => {
        const today = new Date();
        switch (p) {
            case 'today':
                return `Tanggal: ${format(today, 'dd MMMM yyyy')}`;
            case 'week': {
                const start = startOfWeek(today, { weekStartsOn: 1 });
                const end = endOfWeek(today, { weekStartsOn: 1 });
                return `Periode: ${format(start, 'dd MMMM yyyy')} s/d ${format(end, 'dd MMMM yyyy')}`;
            }
            case 'month': {
                const start = startOfMonth(today);
                const end = endOfMonth(today);
                return `Periode: ${format(start, 'dd MMMM yyyy')} s/d ${format(end, 'dd MMMM yyyy')}`;
            }
            default:
                return `Periode: Semua Waktu (Dicetak: ${format(today, 'dd MMMM yyyy')})`;
        }
    };

    const currentDateFormatted = format(new Date(), 'dd MMMM yyyy, HH:mm');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${board.title} Report - Firlabs Board`} />

            {/* Dedicated Print Stylesheet for Professional Executive PDF layout */}
            <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10pt !important;
            line-height: 1.4 !important;
          }
          nav, header, [data-sidebar], .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            break-inside: avoid !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
          }
          a {
            text-decoration: none !important;
            color: inherit !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Print-Only Header (Appears on PDF Export) */}
                <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <img
                                    src="/brand/logo-horizontal-navy.png"
                                    alt="Firlabs Board"
                                    className="h-9 w-auto object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                                {board.title} Report
                            </h1>
                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                {getPeriodFormattedRange(period)}
                            </p>
                            {board.description && (
                                <p className="mt-0.5 max-w-xl text-[11px] text-slate-500">
                                    {board.description}
                                </p>
                            )}
                        </div>
                        <div className="space-y-0.5 text-right text-xs text-slate-500">
                            <p className="font-semibold text-slate-800">
                                Status: {completionRate}% Selesai
                            </p>
                            <p>Total Tugas: {totalCardsCount} Kartu</p>
                            <p>Tanggal Cetak: {currentDateFormatted}</p>
                            <p>Owner: {board.owner?.name || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Screen Header Bar */}
                <div className="no-print flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <Link
                                href={`/boards/${board.id}`}
                                className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Kembali ke Board"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <div
                                className="h-6 w-6 shrink-0 rounded-md shadow-xs"
                                style={{
                                    backgroundColor:
                                        board.background_color || '#0079bf',
                                }}
                            />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {board.title} Report
                            </h1>
                            <BrandLogo
                                variant="auto"
                                size="sm"
                                className="ml-2 hidden sm:inline-flex"
                            />
                            <Badge
                                variant="outline"
                                className="ml-2 text-xs font-normal capitalize"
                            >
                                {board.visibility || 'Private'}
                            </Badge>
                        </div>
                        <p className="pl-8 text-xs text-muted-foreground sm:text-sm">
                            {getPeriodFormattedRange(period)} — Dokumen
                            ringkasan kemajuan tugas, status kolom, dan
                            checklist.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 border-slate-300 bg-background font-medium text-foreground shadow-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            <span>Print Preview</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 bg-[#0052cc] font-medium text-white shadow-sm hover:bg-[#0747a6]"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download PDF</span>
                        </Button>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="no-print flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 shadow-xs backdrop-blur-sm sm:flex-row">
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        <span className="mr-1 flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            <Filter className="h-3.5 w-3.5" /> Periode:
                        </span>

                        {/* Period Segmented Buttons */}
                        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
                            {(
                                [
                                    { id: 'today', label: 'Harian' },
                                    { id: 'week', label: 'Mingguan' },
                                    { id: 'month', label: 'Bulanan' },
                                    { id: 'all', label: 'Semua' },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setPeriod(tab.id)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                        period === tab.id
                                            ? 'bg-background font-semibold text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* View Mode Toggle */}
                        <div className="ml-2 inline-flex rounded-lg border border-border bg-muted/40 p-1">
                            <button
                                onClick={() => setViewMode('grouped')}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                                    viewMode === 'grouped'
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Tampilan Rinci per Kolom List"
                            >
                                Grup Kolom
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Tampilan Tabel Inventaris"
                            >
                                Tabel
                            </button>
                        </div>
                    </div>

                    <div className="flex w-full items-center gap-3 sm:w-auto">
                        {/* Filter by Member */}
                        <Select
                            value={selectedMember}
                            onValueChange={setSelectedMember}
                        >
                            <SelectTrigger className="h-8 w-[170px] bg-background text-xs">
                                <SelectValue placeholder="Semua Anggota" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Anggota
                                </SelectItem>
                                {board.members?.map((m) => (
                                    <SelectItem
                                        key={m.id}
                                        value={m.id.toString()}
                                    >
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Search Task */}
                        <div className="relative w-full sm:w-44">
                            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Cari tugas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 bg-background pl-8 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Executive KPI Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {/* Total Cards */}
                    <Card className="print-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3.5 pb-1">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Total Tugas
                            </CardTitle>
                            <Layers className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {totalCardsCount}
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Dalam {board.lists?.length || 0} kolom list
                            </p>
                        </CardContent>
                    </Card>

                    {/* Selesai / Completion Rate */}
                    <Card className="print-card border-emerald-500/20 bg-emerald-500/5 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3.5 pb-1">
                            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                Penyelesaian
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {completionRate}%
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    ({completedCardsCount}/{totalCardsCount})
                                </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                                Kartu selesai dikerjakan
                            </p>
                        </CardContent>
                    </Card>

                    {/* Dalam Proses */}
                    <Card className="print-card border-blue-500/20 bg-blue-500/5 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3.5 pb-1">
                            <CardTitle className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                Sedang Berjalan
                            </CardTitle>
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {inProgressCardsCount}
                            </div>
                            <p className="mt-0.5 text-[11px] text-blue-700/80 dark:text-blue-400/80">
                                Kartu aktif di board
                            </p>
                        </CardContent>
                    </Card>

                    {/* Overdue */}
                    <Card className="print-card border-rose-500/20 bg-rose-500/5 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3.5 pb-1">
                            <CardTitle className="text-xs font-medium text-rose-800 dark:text-rose-300">
                                Lewat Tenggat
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                                {overdueCardsCount}
                            </div>
                            <p className="mt-0.5 text-[11px] text-rose-700/80 dark:text-rose-400/80">
                                Perlu tindak lanjut cepat
                            </p>
                        </CardContent>
                    </Card>

                    {/* Checklist Progress */}
                    <Card className="print-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3.5 pb-1">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Sub-task Checklist
                            </CardTitle>
                            <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">
                                    {checklistCompletionRate}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({completedChecklistsCount}/
                                    {totalChecklistsCount})
                                </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Total butir checklist
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Pipeline & Member Matrix Grid */}
                <div className="print-avoid-break grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* List Breakdown */}
                    <div className="lg:col-span-5">
                        <Card className="print-card h-full border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <Layers className="h-4 w-4 text-[#0052cc]" />
                                        <span>Distribusi Kolom / Pipeline</span>
                                    </CardTitle>
                                    <span className="text-xs text-muted-foreground">
                                        {board.lists?.length || 0} Kolom
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3.5">
                                {cardsGroupedByList.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground">
                                        Belum ada kolom list.
                                    </p>
                                ) : (
                                    cardsGroupedByList.map((l) => {
                                        const pct =
                                            totalCardsCount > 0
                                                ? Math.round(
                                                      (l.total /
                                                          totalCardsCount) *
                                                          100,
                                                  )
                                                : 0;
                                        return (
                                            <div
                                                key={l.id}
                                                className="space-y-1"
                                            >
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-foreground">
                                                        {l.title}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {l.total} kartu ({pct}%)
                                                        • {l.completed} selesai
                                                    </span>
                                                </div>
                                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                                    <div
                                                        className="h-full rounded-full bg-[#0052cc] transition-all duration-500"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Member Matrix */}
                    <div className="lg:col-span-7">
                        <Card className="print-card h-full border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <Users className="h-4 w-4 text-purple-600" />
                                        <span>Matriks Kontribusi Anggota</span>
                                    </CardTitle>
                                    <span className="text-xs text-muted-foreground">
                                        {memberStats.length} Anggota
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="border-y border-border bg-muted/50 font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left">
                                                    Anggota
                                                </th>
                                                <th className="px-2 py-2.5 text-center">
                                                    Ditugaskan
                                                </th>
                                                <th className="px-2 py-2.5 text-center">
                                                    Selesai
                                                </th>
                                                <th className="px-2 py-2.5 text-center">
                                                    Overdue
                                                </th>
                                                <th className="px-4 py-2.5 text-right">
                                                    Rasio Selesai
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {memberStats.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-4 text-center text-muted-foreground"
                                                    >
                                                        Belum ada anggota di
                                                        board ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                memberStats.map((m) => (
                                                    <tr
                                                        key={m.id}
                                                        className="transition-colors hover:bg-muted/30"
                                                    >
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6 border border-border">
                                                                    <AvatarImage
                                                                        src={
                                                                            m.avatar
                                                                                ? `/storage/${m.avatar}`
                                                                                : undefined
                                                                        }
                                                                        alt={
                                                                            m.name
                                                                        }
                                                                    />
                                                                    <AvatarFallback className="text-[9px]">
                                                                        {m.name
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
                                                                <span className="truncate font-medium text-foreground">
                                                                    {m.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center font-medium">
                                                            {m.assigned}
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center font-medium text-emerald-600 dark:text-emerald-400">
                                                            {m.completed}
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center">
                                                            {m.overdue > 0 ? (
                                                                <span className="font-semibold text-rose-600">
                                                                    {m.overdue}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <span className="font-semibold">
                                                                {m.assigned > 0
                                                                    ? `${m.rate}%`
                                                                    : '0%'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Detailed Task Report with Checklists & Lists Breakdown (Professional PDF and Screen View) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/80 pb-1">
                        <div>
                            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                                <FileText className="h-4 w-4 text-[#0052cc]" />
                                <span>
                                    Rincian Seluruh Tugas & Sub-Task Checklist
                                </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Menampilkan daftar kartu berdasarkan kolom list
                                dan status pengerjaan checklist sub-task.
                                Lampiran file tersimpan aman di aplikasi.
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {filteredCards.length} Kartu Aktif
                        </span>
                    </div>

                    {/* Grouped by List View (Default & Primary Print View) */}
                    <div className="space-y-4">
                        {cardsGroupedByList.map((group) => {
                            if (group.cards.length === 0) return null;

                            return (
                                <div
                                    key={group.id}
                                    className="print-avoid-break overflow-hidden rounded-xl border border-border bg-card shadow-xs"
                                >
                                    {/* List Header */}
                                    <div className="flex items-center justify-between border-b border-border bg-slate-100/80 px-4 py-2.5 dark:bg-slate-900">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-[#0052cc]" />
                                            <h4 className="text-xs font-bold tracking-wider text-foreground uppercase sm:text-sm">
                                                {group.title}
                                            </h4>
                                            <span className="text-xs text-muted-foreground">
                                                ({group.cards.length} kartu)
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                            {group.completed} dari {group.total}{' '}
                                            selesai
                                        </span>
                                    </div>

                                    {/* Cards inside List */}
                                    <div className="divide-y divide-border/60">
                                        {group.cards.map((card) => {
                                            const isCardOverdue =
                                                card.due_date &&
                                                !card.is_completed &&
                                                new Date(card.due_date) < now;
                                            const checklists =
                                                card.checklists || [];

                                            return (
                                                <div
                                                    key={card.id}
                                                    className="p-3.5 transition-colors hover:bg-muted/20 sm:p-4"
                                                >
                                                    <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-start">
                                                        {/* Card title, description, labels */}
                                                        <div className="min-w-0 flex-1 space-y-1.5">
                                                            <div className="flex items-start gap-2">
                                                                <span
                                                                    className={`text-xs leading-snug font-semibold sm:text-sm ${
                                                                        card.is_completed
                                                                            ? 'text-muted-foreground line-through'
                                                                            : 'text-foreground'
                                                                    }`}
                                                                >
                                                                    {card.title}
                                                                </span>

                                                                {card.is_completed && (
                                                                    <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">
                                                                        Selesai
                                                                    </Badge>
                                                                )}
                                                                {isCardOverdue && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="shrink-0 text-[10px]"
                                                                    >
                                                                        Overdue
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {card.description && (
                                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                                    {
                                                                        card.description
                                                                    }
                                                                </p>
                                                            )}

                                                            {/* Labels */}
                                                            {card.labels &&
                                                                card.labels
                                                                    .length >
                                                                    0 && (
                                                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                                                        {card.labels.map(
                                                                            (
                                                                                lbl: any,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        lbl.id
                                                                                    }
                                                                                    className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            lbl.color,
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        lbl.name
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}

                                                            {/* Checklists Detailed Items (Checked / Pending) */}
                                                            {checklists.length >
                                                                0 && (
                                                                <div className="pt-2">
                                                                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                                        <CheckSquare className="h-3 w-3 text-[#0052cc]" />
                                                                        <span>
                                                                            Sub-task
                                                                            Checklist
                                                                            (
                                                                            {
                                                                                checklists.filter(
                                                                                    (
                                                                                        i,
                                                                                    ) =>
                                                                                        i.is_completed,
                                                                                )
                                                                                    .length
                                                                            }
                                                                            /
                                                                            {
                                                                                checklists.length
                                                                            }
                                                                            ):
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-1.5 pl-1 sm:grid-cols-2">
                                                                        {checklists.map(
                                                                            (
                                                                                item,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        item.id
                                                                                    }
                                                                                    className={`flex items-center gap-1.5 text-[11px] ${
                                                                                        item.is_completed
                                                                                            ? 'text-emerald-700 line-through dark:text-emerald-400'
                                                                                            : 'text-slate-600 dark:text-slate-400'
                                                                                    }`}
                                                                                >
                                                                                    {item.is_completed ? (
                                                                                        <Check className="h-3 w-3 shrink-0 font-bold text-emerald-600" />
                                                                                    ) : (
                                                                                        <Circle className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                                                                    )}
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            item.title
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Card Metadata (Assignees, Due date, Attachments notice) */}
                                                        <div className="flex shrink-0 items-end justify-between gap-2 text-right sm:min-w-[140px] sm:flex-col sm:justify-start">
                                                            {/* Assignees */}
                                                            {card.members &&
                                                            card.members
                                                                .length > 0 ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                                                                        PIC:
                                                                    </span>
                                                                    <div className="flex items-center -space-x-1.5">
                                                                        {card.members.map(
                                                                            (
                                                                                m: any,
                                                                            ) => (
                                                                                <Avatar
                                                                                    key={
                                                                                        m.id
                                                                                    }
                                                                                    className="h-6 w-6 border-2 border-background"
                                                                                    title={
                                                                                        m.name
                                                                                    }
                                                                                >
                                                                                    <AvatarImage
                                                                                        src={
                                                                                            m.avatar
                                                                                                ? `/storage/${m.avatar}`
                                                                                                : undefined
                                                                                        }
                                                                                        alt={
                                                                                            m.name
                                                                                        }
                                                                                    />
                                                                                    <AvatarFallback className="text-[9px]">
                                                                                        {m.name
                                                                                            .split(
                                                                                                ' ',
                                                                                            )
                                                                                            .map(
                                                                                                (
                                                                                                    n: string,
                                                                                                ) =>
                                                                                                    n[0],
                                                                                            )
                                                                                            .join(
                                                                                                '',
                                                                                            )
                                                                                            .toUpperCase()}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground/60">
                                                                    - Belum ada
                                                                    PIC -
                                                                </span>
                                                            )}

                                                            {/* Due Date */}
                                                            {card.due_date && (
                                                                <div
                                                                    className={`flex items-center gap-1 text-[11px] font-medium ${
                                                                        card.is_completed
                                                                            ? 'text-muted-foreground'
                                                                            : isCardOverdue
                                                                              ? 'font-semibold text-rose-600'
                                                                              : 'text-foreground'
                                                                    }`}
                                                                >
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>
                                                                        {format(
                                                                            new Date(
                                                                                card.due_date,
                                                                            ),
                                                                            'dd MMM yyyy',
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Attachment note (Document in app only) */}
                                                            {card.attachments &&
                                                                card.attachments
                                                                    .length >
                                                                    0 && (
                                                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                        <Paperclip className="h-3 w-3" />
                                                                        <span>
                                                                            {
                                                                                card
                                                                                    .attachments
                                                                                    .length
                                                                            }{' '}
                                                                            file
                                                                            di
                                                                            app
                                                                        </span>
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Professional Report Footer (Both on Screen and PDF Export) */}
                <div className="mt-8 border-t border-slate-200 pt-8 pb-4 text-xs text-slate-500 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
                        <div className="space-y-1 text-center sm:text-left">
                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-800 sm:justify-start dark:text-slate-200">
                                <BrandLogo
                                    variant="icon"
                                    className="size-4 shrink-0"
                                />
                                <span>Powered by Firlabs Board</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Dokumen laporan resmi ini dibuat dan
                                disinkronkan secara otomatis oleh{' '}
                                <strong className="text-slate-700 dark:text-slate-300">
                                    Firlabs Board System
                                </strong>
                                .
                            </p>
                            <p className="text-[10px] text-slate-400">
                                ID Board: #{board.id} • Tanggal Ekspor:{' '}
                                {currentDateFormatted} •{' '}
                                {getPeriodFormattedRange(period)}
                            </p>
                        </div>

                        {/* Print Signoff area */}
                        <div className="print-only w-52 shrink-0 text-center">
                            <div className="mb-2 border-b border-slate-400 pb-14"></div>
                            <p className="font-bold text-slate-900">
                                {board.owner?.name || 'Board Administrator'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Project Manager / Owner
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
