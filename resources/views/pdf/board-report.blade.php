<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $board->title }} - Laporan Board</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm 10mm;
        }
        * {
            box-sizing: border-box;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        body {
            font-size: 10px;
            color: #0f172a;
            line-height: 1.35;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        .header {
            width: 100%;
            border-bottom: 2px solid #0052cc;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: top;
            padding: 0;
        }
        .logo {
            height: 32px;
            margin-bottom: 4px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.3px;
            margin: 0 0 2px 0;
        }
        .subtitle {
            font-size: 10px;
            color: #0052cc;
            font-weight: bold;
        }
        .meta-text {
            text-align: right;
            font-size: 9px;
            color: #64748b;
            line-height: 1.4;
        }
        .meta-text strong {
            color: #1e293b;
        }

        /* KPI Section */
        .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px;
            margin-bottom: 14px;
        }
        .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 8px 10px;
            text-align: left;
        }
        .kpi-card.green {
            background: #f0fdf4;
            border-color: #bbf7d0;
        }
        .kpi-card.blue {
            background: #eff6ff;
            border-color: #bfdbfe;
        }
        .kpi-card.red {
            background: #fef2f2;
            border-color: #fecaca;
        }
        .kpi-label {
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #64748b;
        }
        .kpi-card.green .kpi-label { color: #166534; }
        .kpi-card.blue .kpi-label { color: #1e40af; }
        .kpi-card.red .kpi-label { color: #991b1b; }
        .kpi-val {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 2px;
        }
        .kpi-card.green .kpi-val { color: #15803d; }
        .kpi-card.blue .kpi-val { color: #1d4ed8; }
        .kpi-card.red .kpi-val { color: #b91c1c; }

        /* Task Table */
        .task-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 20px;
        }
        .task-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5px;
            letter-spacing: 0.3px;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }
        .task-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .task-table tr:nth-child(even) {
            background: #f8fafc;
        }
        .task-title {
            font-weight: bold;
            font-size: 10px;
            color: #0f172a;
        }
        .task-desc {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
            line-height: 1.3;
        }

        /* Checklists */
        .chk-box {
            margin-top: 5px;
            padding: 4px 6px;
            background: #f8fafc;
            border-left: 2px solid #0052cc;
            border-radius: 3px;
        }
        .chk-header {
            font-size: 8.5px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 2px;
        }
        .chk-item {
            font-size: 8.5px;
            color: #334155;
            margin-bottom: 1.5px;
        }
        .chk-item.done {
            color: #15803d;
            font-weight: 500;
        }
        .chk-icon-done {
            color: #15803d;
            font-weight: bold;
        }
        .chk-icon-pending {
            color: #94a3b8;
        }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .badge-info { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .badge-list { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

        /* Footer */
        .footer {
            margin-top: 25px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
        }
        .footer-logo {
            height: 22px;
            margin-bottom: 3px;
        }
        .footer-brand {
            font-size: 10px;
            font-weight: bold;
            color: #334155;
        }
        .footer-meta {
            font-size: 8.5px;
            color: #94a3b8;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 65%;">
                    @if($logoBase64)
                        <img src="{{ $logoBase64 }}" alt="Firlabs Board" class="logo">
                    @endif
                    <div class="title">{{ $board->title }} Report</div>
                    <div class="subtitle">{{ $periodLabel }}</div>
                    @if($board->description)
                        <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">
                            {{ strip_tags($board->description) }}
                        </div>
                    @endif
                </td>
                <td style="width: 35%;" class="meta-text">
                    <div><strong>ID Board:</strong> #{{ $board->id }}</div>
                    <div><strong>Dicetak:</strong> {{ $printedAt }}</div>
                    <div><strong>Project Owner:</strong> {{ $board->owner?->name ?? '-' }}</div>
                    <div><strong>Total Tugas:</strong> {{ $totalCards }} Kartu</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- KPI Summary Row -->
    <table class="kpi-table">
        <tr>
            <td style="width: 25%;">
                <div class="kpi-card">
                    <div class="kpi-label">Total Tugas</div>
                    <div class="kpi-val">{{ $totalCards }}</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card green">
                    <div class="kpi-label">Penyelesaian</div>
                    <div class="kpi-val">{{ $completionRate }}% <span style="font-size: 9px; font-weight: normal;">({{ $completedCards }}/{{ $totalCards }})</span></div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card blue">
                    <div class="kpi-label">Sedang Berjalan</div>
                    <div class="kpi-val">{{ $inProgressCards }}</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-card red">
                    <div class="kpi-label">Lewat Tenggat</div>
                    <div class="kpi-val">{{ $overdueCards }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Task Data Table -->
    <table class="task-table">
        <thead>
            <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Tugas / Judul & Sub-task Checklist</th>
                <th style="width: 85px;">Kolom List</th>
                <th style="width: 95px;">PIC</th>
                <th style="width: 75px;">Tenggat</th>
                <th style="width: 70px; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($cards as $index => $card)
                <tr>
                    <td style="text-align: center; color: #64748b; font-weight: bold;">{{ $index + 1 }}</td>
                    <td>
                        <div class="task-title" style="color: {{ $card->is_completed ? '#64748b' : '#0f172a' }};">
                            {{ $card->title }}
                        </div>
                        @if($card->description)
                            <div class="task-desc">
                                {{ Str::limit(strip_tags($card->description), 160) }}
                            </div>
                        @endif

                        @if($card->checklists && $card->checklists->count() > 0)
                            <div class="chk-box">
                                <div class="chk-header">
                                    Sub-task Checklist ({{ $card->checklists->where('is_completed', true)->count() }}/{{ $card->checklists->count() }} selesai):
                                </div>
                                @foreach($card->checklists as $chk)
                                    <div class="chk-item {{ $chk->is_completed ? 'done' : '' }}">
                                        @if($chk->is_completed)
                                            <span class="chk-icon-done">&#10003;</span>
                                        @else
                                            <span class="chk-icon-pending">&#9633;</span>
                                        @endif
                                        <span>{{ $chk->title }}</span>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                    </td>
                    <td>
                        <span class="badge badge-list">{{ $card->list_title ?? '-' }}</span>
                    </td>
                    <td>
                        {{ $card->members->pluck('name')->join(', ') ?: '-' }}
                    </td>
                    <td style="white-space: nowrap; color: {{ $card->is_overdue ? '#b91c1c; font-weight: bold;' : 'inherit' }};">
                        {{ $card->due_date ? \Carbon\Carbon::parse($card->due_date)->locale('id')->translatedFormat('d M Y') : '-' }}
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                        @if($card->is_completed)
                            <span class="badge badge-success">&#10003; Selesai</span>
                        @elseif($card->is_overdue)
                            <span class="badge badge-danger">! Overdue</span>
                        @else
                            <span class="badge badge-info">&#9679; Berjalan</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 18px; color: #94a3b8;">
                        Tidak ada tugas yang ditemukan untuk periode ini.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Watermark Footer -->
    <div class="footer">
        @if($logoBase64)
            <img src="{{ $logoBase64 }}" alt="Firlabs Board" class="footer-logo">
        @endif
        <div class="footer-brand">Powered by Firlabs Board</div>
        <div class="footer-meta">Dokumen Laporan Resmi &bull; ID Board #{{ $board->id }} &bull; {{ $printedAt }}</div>
    </div>
</body>
</html>
