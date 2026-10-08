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
    isAfter,
    isBefore,
    isThisMonth,
    isThisWeek,
    isToday,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { id } from 'date-fns/locale';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    FileDown,
    FileText,
    Filter,
    Layers,
    Paperclip,
    Search,
    Users,
    X,
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

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'last3months' | 'custom';

// Helper to strip rich text HTML tags and entities so raw <p> tags don't leak into the report
const stripHtml = (html?: string | null): string => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

export default function BoardReport({
    board,
    activities: _activities = [],
}: BoardReportProps) {
    const [period, setPeriod] = useState<PeriodFilter>('month');
    const [selectedMember, setSelectedMember] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const currentDateFormatted = format(new Date(), 'dd MMMM yyyy', { locale: id });

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
            const dateToEvaluate = card.created_at || (card as any).updated_at;
            if (period !== 'all' && dateToEvaluate) {
                try {
                    const cardDate =
                        typeof dateToEvaluate === 'string'
                            ? parseISO(dateToEvaluate)
                            : new Date(dateToEvaluate);

                    if (period === 'today' && !isToday(cardDate)) return false;
                    if (period === 'week' && !isThisWeek(cardDate, { weekStartsOn: 1 })) return false;
                    if (period === 'month' && !isThisMonth(cardDate)) return false;
                    if (period === 'last3months') {
                        const threeMonthsAgo = startOfDay(subMonths(new Date(), 3));
                        if (isBefore(cardDate, threeMonthsAgo)) return false;
                    }
                    if (period === 'custom') {
                        if (dateFrom) {
                            const from = startOfDay(parseISO(dateFrom));
                            if (isBefore(cardDate, from)) return false;
                        }
                        if (dateTo) {
                            const to = new Date(dateTo);
                            to.setHours(23, 59, 59, 999);
                            if (isAfter(cardDate, to)) return false;
                        }
                    }
                } catch (_e) {
                    // fallback
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
                const matchDesc = stripHtml(card.description)
                    .toLowerCase()
                    .includes(query);
                const matchList = card.listTitle?.toLowerCase().includes(query);
                if (!matchTitle && !matchDesc && !matchList) return false;
            }

            return true;
        });
    }, [allCards, period, selectedMember, searchQuery, dateFrom, dateTo]);


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
    }, [board.members, filteredCards, now]);

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

    // Exact period label with date range
    const getPeriodFormattedRange = (p: PeriodFilter) => {
        const today = new Date();
        switch (p) {
            case 'today':
                return `Tanggal: ${format(today, 'dd MMMM yyyy', { locale: id })}`;
            case 'week': {
                const start = startOfWeek(today, { weekStartsOn: 1 });
                const end = endOfWeek(today, { weekStartsOn: 1 });
                return `Periode: ${format(start, 'dd MMM yyyy', { locale: id })} – ${format(end, 'dd MMM yyyy', { locale: id })}`;
            }
            case 'month': {
                const start = startOfMonth(today);
                const end = endOfMonth(today);
                return `Periode: ${format(start, 'dd MMM yyyy', { locale: id })} – ${format(end, 'dd MMM yyyy', { locale: id })}`;
            }
            case 'last3months': {
                const start = startOfDay(subMonths(today, 3));
                return `Periode: ${format(start, 'dd MMM yyyy', { locale: id })} – ${format(today, 'dd MMM yyyy', { locale: id })} (3 Bulan Terakhir)`;
            }
            case 'custom': {
                const fromLabel = dateFrom ? format(parseISO(dateFrom), 'dd MMM yyyy', { locale: id }) : '...';
                const toLabel = dateTo ? format(parseISO(dateTo), 'dd MMM yyyy', { locale: id }) : '...';
                return `Rentang Kustom: ${fromLabel} – ${toLabel}`;
            }
            default:
                return `Periode: Semua Waktu (Dicetak: ${format(today, 'dd MMM yyyy', { locale: id })})`;
        }
    };

    // Dedicated Standalone PDF Template Generator (Clean, Table-based, Printable)
    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        const taskRowsHtml = filteredCards
            .map((card, idx) => {
                const isOverdue =
                    card.due_date &&
                    !card.is_completed &&
                    new Date(card.due_date) < now;
                const listName =
                    board.lists?.find((l) => l.id === card.board_list_id)?.title ||
                    card.listTitle || '-';
                const cleanDesc = stripHtml(card.description);
                const picNames =
                    card.members?.map((m: any) => m.name).join(', ') || '-';
                const formattedDate = card.due_date
                    ? format(new Date(card.due_date), 'dd MMM yyyy', { locale: id })
                    : '-';
                const statusBadge = card.is_completed
                    ? '<span class="badge badge-success">✓ Selesai</span>'
                    : isOverdue
                      ? '<span class="badge badge-danger">⚠ Overdue</span>'
                      : '<span class="badge badge-info">● Berjalan</span>';

                // Sub-task Checklists HTML inside PDF table
                // Note: done items use green checkmark WITHOUT strikethrough (strikethrough is confusing)
                let checklistHtml = '';
                if (card.checklists && card.checklists.length > 0) {
                    const completed = card.checklists.filter((i: any) => i.is_completed).length;
                    const items = card.checklists
                        .map(
                            (item: any) =>
                                item.is_completed
                                    ? `<div class="checklist-item done">
                                        <span class="chk-done">✓</span>
                                        <span class="chk-done-text">${item.title}</span>
                                       </div>`
                                    : `<div class="checklist-item">
                                        <span class="chk-box">☐</span>
                                        <span>${item.title}</span>
                                       </div>`,
                        )
                        .join('');
                    checklistHtml = `
                        <div class="checklist-box">
                            <div class="checklist-title">Sub-task Checklist (${completed}/${card.checklists.length} selesai):</div>
                            <div class="checklist-items">${items}</div>
                        </div>
                    `;
                }

                // Card title: no strikethrough — status badge already indicates completed
                const titleColor = card.is_completed ? '#64748b' : '#0f172a';

                return `
                    <tr${card.is_completed ? ' class="row-done"' : ''}>
                        <td style="text-align:center;font-weight:600;color:#64748b;">${idx + 1}</td>
                        <td>
                            <div style="font-weight:700;font-size:11px;color:${titleColor};">${card.title}</div>
                            ${cleanDesc ? `<div style="color:#64748b;font-size:10px;margin-top:2px;line-height:1.35;">${cleanDesc}</div>` : ''}
                            ${checklistHtml}
                        </td>
                        <td style="font-weight:500;">${listName}</td>
                        <td>${picNames}</td>
                        <td style="white-space:nowrap;color:${isOverdue ? '#be123c;font-weight:700;' : 'inherit;'}">${formattedDate}</td>
                        <td style="text-align:center;">${statusBadge}</td>
                    </tr>
                `;
            })
            .join('');


        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>${board.title} - Laporan Firlabs Board</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }
        .logo-img {
            height: 32px;
            object-fit: contain;
            margin-bottom: 6px;
        }
        .report-title {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            margin: 0 0 4px 0;
            color: #0f172a;
        }
        .report-sub {
            font-size: 10.5px;
            color: #475569;
            font-weight: 500;
        }
        .header-meta {
            text-align: right;
            font-size: 10px;
            color: #64748b;
            line-height: 1.5;
        }
        .kpi-row {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
        }
        .kpi-col {
            flex: 1;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
        }
        .kpi-col.green {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #166534;
        }
        .kpi-col.blue {
            background: #eff6ff;
            border-color: #bfdbfe;
            color: #1e40af;
        }
        .kpi-col.red {
            background: #fef2f2;
            border-color: #fecaca;
            color: #991b1b;
        }
        .kpi-label {
            font-size: 9.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .kpi-number {
            font-size: 18px;
            font-weight: 800;
            margin-top: 2px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 24px;
        }
        th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 9.5px;
            letter-spacing: 0.03em;
        }
        td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        tr:nth-child(even) {
            background: #fafafa;
        }
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .badge-info { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .checklist-box {
            margin-top: 6px;
            padding: 6px 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #0052cc;
            border-radius: 4px;
        }
        .checklist-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 3px;
        }
        .checklist-items {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 8px;
        }
        .checklist-item {
            font-size: 9.5px;
            color: #334155;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .checklist-item.done {
            color: #15803d;
        }
        .chk-done {
            font-weight: 800;
            font-size: 10px;
            color: #15803d;
        }
        .chk-done-text {
            color: #15803d;
            font-weight: 500;
        }
        .chk-box {
            font-weight: bold;
            font-size: 10px;
        }
        .watermark-footer {
            margin-top: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            page-break-inside: avoid;
        }
        .watermark-logo {
            height: 26px;
            object-fit: contain;
            margin-bottom: 4px;
        }
        .watermark-title {
            font-size: 11px;
            font-weight: 700;
            color: #334155;
        }
        .watermark-meta {
            font-size: 9.5px;
            color: #94a3b8;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <img src="/brand/logo-horizontal-navy.png" alt="Firlabs Board" class="logo-img" onerror="this.style.display='none'">
            <div class="report-title">${board.title} Report</div>
            <div class="report-sub">${getPeriodFormattedRange(period)}</div>
        </div>
        <div class="header-meta">
            <div><strong>ID Board:</strong> #${board.id}</div>
            <div><strong>Dicetak:</strong> ${currentDateFormatted}</div>
            <div><strong>Project Owner:</strong> ${board.owner?.name || '-'}</div>
            <div><strong>Total Tugas:</strong> ${totalCardsCount} Kartu</div>
        </div>
    </div>

    <div class="kpi-row">
        <div class="kpi-col">
            <div class="kpi-label">Total Tugas</div>
            <div class="kpi-number">${totalCardsCount}</div>
        </div>
        <div class="kpi-col green">
            <div class="kpi-label">Penyelesaian</div>
            <div class="kpi-number">${completionRate}% <span style="font-size:11px;font-weight:500;">(${completedCardsCount}/${totalCardsCount})</span></div>
        </div>
        <div class="kpi-col blue">
            <div class="kpi-label">Sedang Berjalan</div>
            <div class="kpi-number">${inProgressCardsCount}</div>
        </div>
        <div class="kpi-col red">
            <div class="kpi-label">Lewat Tenggat</div>
            <div class="kpi-number">${overdueCardsCount}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:30px;text-align:center;">#</th>
                <th>Tugas / Judul & Sub-task Checklist</th>
                <th style="width:90px;">Kolom List</th>
                <th style="width:110px;">PIC</th>
                <th style="width:85px;">Tenggat</th>
                <th style="width:80px;text-align:center;">Status</th>
            </tr>
        </thead>
        <tbody>
            ${taskRowsHtml || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">Tidak ada tugas ditemukan.</td></tr>'}
        </tbody>
    </table>

    <div class="watermark-footer">
        <img src="/brand/logo-horizontal-navy.png" alt="Firlabs Board" class="watermark-logo" onerror="this.style.display='none'">
        <div class="watermark-title">Powered by Firlabs Board</div>
        <div class="watermark-meta">Dokumen Laporan Resmi • ID Board #${board.id} • ${currentDateFormatted}</div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.focus();
                window.print();
            }, 400);
        };
    </script>
</body>
</html>`;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

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
                                    {stripHtml(board.description)}
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
                            size="sm"
                            onClick={handleExportPDF}
                            className="gap-2 bg-[#0052cc] text-xs font-semibold text-white shadow-xs hover:bg-[#0747a6]"
                            title="Unduh laporan dokumen resmi dalam format PDF yang rapi"
                        >
                            <FileDown className="h-3.5 w-3.5" />
                            <span>Export PDF</span>
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
                        <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-border bg-muted/40 p-1">
                            {(
                                [
                                    { id: 'today', label: 'Harian' },
                                    { id: 'week', label: 'Mingguan' },
                                    { id: 'month', label: 'Bulanan' },
                                    { id: 'last3months', label: '3 Bulan' },
                                    { id: 'all', label: 'Semua' },
                                    { id: 'custom', label: 'Rentang' },
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
                                    {tab.id === 'custom' && <Calendar className="mr-1 inline h-3 w-3" />}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range Inputs */}
                        {period === 'custom' && (
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="border-0 bg-transparent text-xs text-foreground outline-none"
                                    title="Dari tanggal"
                                />
                                <span className="text-xs text-muted-foreground">–</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border-0 bg-transparent text-xs text-foreground outline-none"
                                    title="Sampai tanggal"
                                />
                                {(dateFrom || dateTo) && (
                                    <button
                                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        className="text-muted-foreground hover:text-foreground"
                                        title="Reset rentang"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        )}


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

                {/* Executive KPI Summary Cards - Compact Single Row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {/* Total Cards */}
                    <Card className="print-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-3.5 pt-3 pb-1">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Total Tugas
                            </CardTitle>
                            <Layers className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="px-3.5 pb-3">
                            <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                {totalCardsCount}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selesai / Completion Rate */}
                    <Card className="print-card border-emerald-500/20 bg-emerald-500/5 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-3.5 pt-3 pb-1">
                            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                Penyelesaian
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent className="px-3.5 pb-3">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-bold text-emerald-700 sm:text-2xl dark:text-emerald-300">
                                    {completionRate}%
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    ({completedCardsCount}/{totalCardsCount})
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dalam Proses */}
                    <Card className="print-card border-blue-500/20 bg-blue-500/5 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-3.5 pt-3 pb-1">
                            <CardTitle className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                Sedang Berjalan
                            </CardTitle>
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent className="px-3.5 pb-3">
                            <div className="text-xl font-bold text-blue-700 sm:text-2xl dark:text-blue-300">
                                {inProgressCardsCount}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overdue */}
                    <Card className="print-card border-rose-500/20 bg-rose-500/5 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between px-3.5 pt-3 pb-1">
                            <CardTitle className="text-xs font-medium text-rose-800 dark:text-rose-300">
                                Lewat Tenggat
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </CardHeader>
                        <CardContent className="px-3.5 pb-3">
                            <div className="text-xl font-bold text-rose-700 sm:text-2xl dark:text-rose-300">
                                {overdueCardsCount}
                            </div>
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

                {/* Clean Professional Task Data Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/80 pb-2">
                        <div>
                            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                                <FileText className="h-4 w-4 text-[#0052cc]" />
                                <span>Daftar Tugas & Status</span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Ringkasan seluruh tugas, kolom list, penanggung jawab (PIC), dan status pengerjaan.
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {filteredCards.length} Kartu
                        </span>
                    </div>

                    <div className="print-avoid-break overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                <tr>
                                    <th className="w-10 px-3 py-3 text-center">#</th>
                                    <th className="px-4 py-3">Tugas / Judul</th>
                                    <th className="px-3 py-3">Kolom List</th>
                                    <th className="px-3 py-3">PIC</th>
                                    <th className="px-3 py-3">Tenggat</th>
                                    <th className="px-3 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredCards.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Tidak ada tugas ditemukan untuk filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCards.map((card, idx) => {
                                        const isCardOverdue =
                                            card.due_date &&
                                            !card.is_completed &&
                                            new Date(card.due_date) < now;
                                        const listName =
                                            board.lists?.find((l) => l.id === card.board_list_id)?.title ||
                                            '-';

                                        return (
                                            <tr
                                                key={card.id}
                                                className="transition-colors hover:bg-muted/20"
                                            >
                                                <td className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`font-semibold ${
                                                                    card.is_completed
                                                                        ? 'text-muted-foreground line-through'
                                                                        : 'text-foreground'
                                                                }`}
                                                            >
                                                                {card.title}
                                                            </span>
                                                            {card.attachments &&
                                                                card.attachments.length > 0 && (
                                                                    <span
                                                                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
                                                                        title={`${card.attachments.length} lampiran tersimpan di aplikasi`}
                                                                    >
                                                                        <Paperclip className="h-3 w-3" />
                                                                        {card.attachments.length}
                                                                    </span>
                                                                )}
                                                        </div>
                                                        {card.description && (
                                                            <p className="line-clamp-2 text-[11px] text-muted-foreground">
                                                                {stripHtml(card.description)}
                                                            </p>
                                                        )}
                                                        {card.checklists && card.checklists.length > 0 && (
                                                            <div className="mt-1.5 space-y-1 rounded-md border border-border/50 bg-muted/30 p-2 text-[10px]">
                                                                <div className="flex items-center gap-1 font-semibold text-muted-foreground">
                                                                    <CheckSquare className="h-3 w-3 text-primary" />
                                                                    <span>
                                                                        Checklist ({card.checklists.filter((i: any) => i.is_completed).length}/{card.checklists.length}):
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-x-2 gap-y-0.5 pt-0.5 sm:grid-cols-2">
                                                                    {card.checklists.map((item: any) => (
                                                                        <div
                                                                            key={item.id}
                                                                            className={`flex items-center gap-1.5 ${
                                                                                item.is_completed
                                                                                    ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                                                                                    : 'text-foreground'
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`text-[10px] font-bold ${
                                                                                    item.is_completed
                                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                                        : 'text-slate-400'
                                                                                }`}
                                                                            >
                                                                                {item.is_completed ? '✓' : '☐'}
                                                                            </span>
                                                                            <span className="truncate">{item.title}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {card.labels && card.labels.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                                {card.labels.map((lbl: any) => (
                                                                    <span
                                                                        key={lbl.id}
                                                                        className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
                                                                        style={{
                                                                            backgroundColor: lbl.color,
                                                                        }}
                                                                    >
                                                                        {lbl.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                        {listName}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {card.members && card.members.length > 0 ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex items-center -space-x-1.5">
                                                                {card.members.map((m: any) => (
                                                                    <Avatar
                                                                        key={m.id}
                                                                        className="h-6 w-6 border-2 border-background"
                                                                        title={m.name}
                                                                    >
                                                                        <AvatarImage
                                                                            src={
                                                                                m.avatar
                                                                                    ? `/storage/${m.avatar}`
                                                                                    : undefined
                                                                            }
                                                                            alt={m.name}
                                                                        />
                                                                        <AvatarFallback className="text-[9px]">
                                                                            {m.name
                                                                                .split(' ')
                                                                                .map((n: string) => n[0])
                                                                                .join('')
                                                                                .toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                            </div>
                                                            <span className="hidden max-w-[120px] truncate text-[11px] text-muted-foreground xl:inline">
                                                                {card.members
                                                                    .map((m: any) => m.name)
                                                                    .join(', ')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground/60">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    {card.due_date ? (
                                                        <span
                                                            className={`text-[11px] ${
                                                                card.is_completed
                                                                    ? 'text-muted-foreground'
                                                                    : isCardOverdue
                                                                      ? 'font-semibold text-rose-600'
                                                                      : 'text-foreground'
                                                            }`}
                                                        >
                                                            {format(
                                                                new Date(card.due_date),
                                                                'dd MMM yyyy',
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground/60">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                    {card.is_completed ? (
                                                        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">
                                                            Selesai
                                                        </Badge>
                                                    ) : isCardOverdue ? (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-[10px]"
                                                        >
                                                            Overdue
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-blue-300 bg-blue-50 text-[10px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                                        >
                                                            Berjalan
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Centered Watermark Footer Branding */}
                <div className="mt-12 border-t border-slate-200 pt-8 pb-6 text-center text-xs text-slate-500 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center justify-center opacity-85 transition-opacity hover:opacity-100">
                            <BrandLogo variant="horizontal" className="h-7 w-auto" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Powered by Firlabs Board
                        </p>
                        <p className="max-w-md text-[11px] text-slate-400">
                            Laporan resmi otomatis • Board #{board.id} • Ekspor: {currentDateFormatted} • {getPeriodFormattedRange(period)}
                        </p>
                    </div>

                    {/* Print Signoff area */}
                    <div className="print-only mt-8 flex justify-end">
                        <div className="w-52 text-center">
                            <div className="mb-2 border-b border-slate-400 pb-12"></div>
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
