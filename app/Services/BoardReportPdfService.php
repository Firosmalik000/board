<?php

namespace App\Services;

use App\Models\Board;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BoardReportPdfService
{
    /**
     * Generate PDF stream/download for a board report.
     *
     * @param Board $board
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function generate(Board $board, Request $request)
    {
        $period = $request->query('period', 'month');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $memberFilter = $request->query('member', 'all');

        // Eager load board relations
        $board->load([
            'owner:id,name,avatar,email',
            'members:id,name,email,avatar',
            'labels:id,name,color',
            'lists' => function ($query) {
                $query->select('id', 'board_id', 'title', 'position')
                    ->orderBy('position')
                    ->where('is_archived', false);
            },
            'lists.cards' => function ($query) {
                $query->select('id', 'list_id', 'title', 'description', 'position', 'due_date', 'is_completed', 'cover_color', 'created_by', 'created_at', 'updated_at')
                    ->orderBy('position')
                    ->where('is_archived', false);
            },
            'lists.cards.labels:id,name,color',
            'lists.cards.members:id,name,avatar,email',
            'lists.cards.creator:id,name,avatar',
            'lists.cards.checklists:id,card_id,title,is_completed,position',
        ]);

        $now = Carbon::now();

        // Flatten cards with list info
        $allCards = collect();
        foreach ($board->lists as $list) {
            foreach ($list->cards as $card) {
                $card->list_title = $list->title;
                $card->is_overdue = $card->due_date && !$card->is_completed && Carbon::parse($card->due_date)->lt($now);
                $allCards->push($card);
            }
        }

        // Apply filters
        $filteredCards = $allCards->filter(function ($card) use ($period, $dateFrom, $dateTo, $memberFilter, $now) {
            $cardDate = $card->created_at ? Carbon::parse($card->created_at) : ($card->updated_at ? Carbon::parse($card->updated_at) : null);

            // Period filter
            if ($period !== 'all' && $cardDate) {
                if ($period === 'today' && !$cardDate->isToday()) {
                    return false;
                }
                if ($period === 'week' && !$cardDate->isCurrentWeek()) {
                    return false;
                }
                if ($period === 'month' && !$cardDate->isCurrentMonth()) {
                    return false;
                }
                if ($period === 'last3months' && $cardDate->lt($now->copy()->subMonths(3)->startOfDay())) {
                    return false;
                }
                if ($period === 'custom') {
                    if ($dateFrom && $cardDate->lt(Carbon::parse($dateFrom)->startOfDay())) {
                        return false;
                    }
                    if ($dateTo && $cardDate->gt(Carbon::parse($dateTo)->endOfDay())) {
                        return false;
                    }
                }
            }

            // Member filter
            if ($memberFilter !== 'all') {
                $hasMember = $card->members->contains('id', (int) $memberFilter);
                if (!$hasMember) {
                    return false;
                }
            }

            return true;
        })->values();

        // Calculate KPIs
        $totalCards = $filteredCards->count();
        $completedCards = $filteredCards->where('is_completed', true)->count();
        $inProgressCards = $totalCards - $completedCards;
        $overdueCards = $filteredCards->where('is_overdue', true)->count();
        $completionRate = $totalCards > 0 ? round(($completedCards / $totalCards) * 100) : 0;

        // Period Label
        $periodLabel = $this->getPeriodLabel($period, $dateFrom, $dateTo, $now);

        // Logo base64 for reliable rendering in DomPDF
        $logoBase64 = null;
        $logoPath = public_path('brand/logo-horizontal-navy.png');
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $pdf = Pdf::loadView('pdf.board-report', [
            'board' => $board,
            'cards' => $filteredCards,
            'totalCards' => $totalCards,
            'completedCards' => $completedCards,
            'inProgressCards' => $inProgressCards,
            'overdueCards' => $overdueCards,
            'completionRate' => $completionRate,
            'periodLabel' => $periodLabel,
            'logoBase64' => $logoBase64,
            'printedAt' => $now->locale('id')->translatedFormat('d F Y H:i'),
        ])->setPaper('a4', 'portrait')
          ->setOption('isHtml5ParserEnabled', true)
          ->setOption('isRemoteEnabled', true);

        $filename = 'Laporan-' . str($board->title)->slug() . '-' . $now->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
    }

    protected function getPeriodLabel(string $period, ?string $dateFrom, ?string $dateTo, Carbon $now): string
    {
        Carbon::setLocale('id');

        switch ($period) {
            case 'today':
                return 'Harian: ' . $now->locale('id')->translatedFormat('d F Y');
            case 'week':
                $start = $now->copy()->startOfWeek();
                $end = $now->copy()->endOfWeek();
                return 'Mingguan: ' . $start->locale('id')->translatedFormat('d M') . ' – ' . $end->locale('id')->translatedFormat('d M Y');
            case 'month':
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                return 'Bulanan: ' . $start->locale('id')->translatedFormat('d M') . ' – ' . $end->locale('id')->translatedFormat('d M Y');
            case 'last3months':
                $start = $now->copy()->subMonths(3)->startOfDay();
                return '3 Bulan Terakhir: ' . $start->locale('id')->translatedFormat('d M') . ' – ' . $now->locale('id')->translatedFormat('d M Y');
            case 'custom':
                $fromStr = $dateFrom ? Carbon::parse($dateFrom)->locale('id')->translatedFormat('d M Y') : '...';
                $toStr = $dateTo ? Carbon::parse($dateTo)->locale('id')->translatedFormat('d M Y') : '...';
                return 'Rentang: ' . $fromStr . ' – ' . $toStr;
            default:
                return 'Semua Periode';
        }
    }
}
