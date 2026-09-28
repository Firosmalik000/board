<?php

use App\Http\Controllers\InvitationController;
use App\Http\Controllers\WebBoardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

// Invitation routes (public)
Route::get('invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::get('invitations/{token}/accept', [InvitationController::class, 'redirectToShow'])->name('invitations.accept.redirect');
Route::post('invitations/{token}/accept', [InvitationController::class, 'accept'])->middleware('auth')->name('invitations.accept');
Route::post('invitations/{token}/register', [InvitationController::class, 'acceptAndRegister'])->name('invitations.register');

Route::middleware(['auth', 'verified'])->group(function () {
    // DEBUG ROUTE - Remove after debugging
    Route::get('debug-dashboard', function () {
        $user = request()->user();

        $ownedBoards = $user->ownedBoards()->get();
        $memberBoards = $user->boards()->get();
        $allBoards = $user->allBoards()->get();
        $allBoardsActive = $user->allBoards()->where('is_archived', false)->get();

        $createdCards = $user->createdCards()->get();
        $assignedCards = $user->assignedCards()->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'boards' => [
                'owned' => $ownedBoards->count() . ' boards',
                'owned_list' => $ownedBoards->pluck('id', 'title'),
                'member' => $memberBoards->count() . ' boards',
                'member_list' => $memberBoards->pluck('id', 'title'),
                'all' => $allBoards->count() . ' boards',
                'all_list' => $allBoards->pluck('id', 'title'),
                'all_active' => $allBoardsActive->count() . ' boards',
                'all_active_list' => $allBoardsActive->pluck('id', 'title'),
            ],
            'cards' => [
                'created' => $createdCards->count() . ' cards',
                'created_list' => $createdCards->pluck('id', 'title')->take(5),
                'assigned' => $assignedCards->count() . ' cards',
                'assigned_list' => $assignedCards->pluck('id', 'title')->take(5),
            ],
        ]);
    });

    Route::get('dashboard', function () {
        $user = request()->user();

        try {
            // Use cache for statistics to improve performance and consistency
            $cacheKey = "dashboard_stats_{$user->id}";
            $cacheDuration = now()->addMinutes(5);

            $statistics = cache()->remember($cacheKey, $cacheDuration, function () use ($user) {
                // FIX: Use allBoards() to prevent double counting
                // (Owner is also added as member, so counting both would duplicate)
                $totalBoards = $user->allBoards()
                    ->where('is_archived', false)
                    ->count();

                // Count BOTH created AND assigned cards
                $createdCardsCount = $user->createdCards()->count();
                $assignedCardsCount = $user->assignedCards()->count();

                // Get unique card IDs to prevent double counting
                // (if user created AND is assigned to same card)
                // FIX: Specify table name to avoid ambiguous column error
                $allCardIds = $user->createdCards()->pluck('cards.id')
                    ->merge($user->assignedCards()->pluck('cards.id'))
                    ->unique();
                $totalCards = $allCardIds->count();

                // Count completed tasks from unique cards
                $completedCardIds = $user->createdCards()->where('is_completed', true)->pluck('cards.id')
                    ->merge($user->assignedCards()->where('is_completed', true)->pluck('cards.id'))
                    ->unique();
                $completedTasks = $completedCardIds->count();

                return [
                    'totalBoards' => $totalBoards,
                    'totalCards' => $totalCards,
                    'completedTasks' => $completedTasks,
                    'createdCards' => $createdCardsCount,
                    'assignedCards' => $assignedCardsCount,
                ];
            });

            // Get recent boards with optimized eager loading (exclude archived)
            $recentBoards = $user->allBoards()
                ->where('is_archived', false)
                ->with(['owner:id,name', 'members:id,name'])
                ->latest('updated_at')
                ->limit(6)
                ->get()
                ->map(function ($board) use ($user) {
                    return [
                        'id' => $board->id,
                        'title' => $board->title,
                        'description' => $board->description,
                        'background_color' => $board->background_color,
                        'background_image' => $board->background_image,
                        'is_owner' => $board->owner_id === $user->id,
                        'owner' => [
                            'id' => $board->owner->id,
                            'name' => $board->owner->name,
                        ],
                        'members' => $board->members->map(fn($m) => [
                            'id' => $m->id,
                            'name' => $m->name,
                        ]),
                    ];
                });

            // Get recent activity cards (BOTH created AND assigned)
            $createdCards = $user->createdCards()
                ->with(['list:id,title,board_id', 'list.board:id,title'])
                ->get();

            $assignedCards = $user->assignedCards()
                ->with(['list:id,title,board_id', 'list.board:id,title'])
                ->get();

            // Merge and sort by created_at
            $recentCards = $createdCards->concat($assignedCards)
                ->unique('id') // Remove duplicates if user created AND assigned to same card
                ->sortByDesc('created_at')
                ->take(10) // Show more activities (10 instead of 5)
                ->values()
                ->map(function ($card) use ($user) {
                    return [
                        'id' => $card->id,
                        'title' => $card->title,
                        'is_completed' => $card->is_completed,
                        'created_at' => $card->created_at->toISOString(),
                        'is_creator' => $card->created_by === $user->id,
                        'list' => [
                            'title' => $card->list->title,
                            'board' => [
                                'id' => $card->list->board->id,
                                'title' => $card->list->board->title,
                            ],
                        ],
                    ];
                });

            return Inertia::render('dashboard', [
                'statistics' => $statistics,
                'recentBoards' => $recentBoards,
                'recentCards' => $recentCards,
            ]);
        } catch (\Exception $e) {
            // Graceful error handling with fallback data
            \Log::error('Dashboard error: ' . $e->getMessage());

            return Inertia::render('dashboard', [
                'statistics' => [
                    'totalBoards' => 0,
                    'totalCards' => 0,
                    'completedTasks' => 0,
                ],
                'recentBoards' => [],
                'recentCards' => [],
                'error' => 'Unable to load dashboard data. Please refresh the page.',
            ]);
        }
    })->name('dashboard');

    // Board routes
    Route::get('boards', [WebBoardController::class, 'index'])->name('boards.index');
    Route::post('boards', [WebBoardController::class, 'store'])->name('boards.store');
    Route::get('boards/{board}', [WebBoardController::class, 'show'])->name('boards.show');
    Route::get('boards/{board}/report', [WebBoardController::class, 'report'])->name('boards.report');
    Route::patch('boards/{board}', [WebBoardController::class, 'update'])->name('boards.update');
    Route::delete('boards/{board}', [WebBoardController::class, 'destroy'])->name('boards.destroy');
    Route::post('boards/{board}/background-image', [WebBoardController::class, 'uploadBackgroundImage'])->name('boards.background.upload');
    Route::delete('boards/{board}/background-image', [WebBoardController::class, 'removeBackgroundImage'])->name('boards.background.remove');
    Route::post('boards/{board}/invite', [WebBoardController::class, 'inviteMember'])->name('boards.invite');
    Route::patch('boards/{board}/members/{userId}', [WebBoardController::class, 'updateMemberRole'])->name('boards.members.update');
    Route::delete('boards/{board}/members/{userId}', [WebBoardController::class, 'removeMember'])->name('boards.members.remove');

    // List routes
    Route::post('boards/{board}/lists', [WebBoardController::class, 'storeList'])->name('boards.lists.store');
    Route::patch('lists/{list}', [WebBoardController::class, 'updateList'])->name('lists.update');
    Route::patch('lists/{list}/move', [WebBoardController::class, 'moveList'])->name('lists.move');
    Route::delete('lists/{list}', [WebBoardController::class, 'destroyList'])->name('lists.destroy');

    // Card routes
    Route::post('lists/{list}/cards', [WebBoardController::class, 'storeCard'])->name('lists.cards.store');
    Route::patch('cards/{card}', [WebBoardController::class, 'updateCard'])->name('cards.update');
    Route::patch('cards/{card}/move', [WebBoardController::class, 'moveCard'])->name('cards.move');
    Route::delete('cards/{card}', [WebBoardController::class, 'destroyCard'])->name('cards.destroy');
    Route::post('cards/{card}/members/{userId}', [WebBoardController::class, 'toggleCardMember'])->name('cards.members.toggle');

    // Attachment routes
    Route::post('cards/{card}/attachments/chunk', [WebBoardController::class, 'uploadChunk'])->name('cards.attachments.chunk');
    Route::post('cards/{card}/attachments', [WebBoardController::class, 'uploadAttachment'])->name('cards.attachments.upload');
    Route::delete('attachments/{attachment}', [WebBoardController::class, 'deleteAttachment'])->name('attachments.delete');

    // Comment routes
    Route::post('cards/{card}/comments', [WebBoardController::class, 'addComment'])->name('cards.comments.store');
    Route::patch('comments/{comment}', [WebBoardController::class, 'updateComment'])->name('comments.update');
    Route::delete('comments/{comment}', [WebBoardController::class, 'deleteComment'])->name('comments.destroy');

    // Checklist routes
    Route::post('cards/{card}/checklists', [WebBoardController::class, 'addChecklistItem'])->name('cards.checklists.store');
    Route::patch('checklists/{checklist}', [WebBoardController::class, 'updateChecklistItem'])->name('checklists.update');
    Route::delete('checklists/{checklist}', [WebBoardController::class, 'deleteChecklistItem'])->name('checklists.destroy');

    // Label routes
    Route::post('boards/{board}/labels', [WebBoardController::class, 'storeLabel'])->name('boards.labels.store');
    Route::patch('labels/{label}', [WebBoardController::class, 'updateLabel'])->name('labels.update');
    Route::delete('labels/{label}', [WebBoardController::class, 'destroyLabel'])->name('labels.destroy');
    Route::post('cards/{card}/labels/{label}/attach', [WebBoardController::class, 'attachLabel'])->name('cards.labels.attach');
    Route::delete('cards/{card}/labels/{label}/detach', [WebBoardController::class, 'detachLabel'])->name('cards.labels.detach');

    // Mention routes
    Route::get('boards/{board}/members', [WebBoardController::class, 'getBoardMembers'])->name('boards.members.list');

    // Lazy loading routes (for performance)
    Route::get('cards/{card}/comments', [WebBoardController::class, 'getCardComments'])->name('cards.comments.list');
    Route::get('boards/{board}/activities', [WebBoardController::class, 'getActivities'])->name('boards.activities.list');

    // User Profile routes
    Route::get('user/profile', [ProfileController::class, 'show'])->name('user.profile.show');
    Route::get('user/profile/activity', [ProfileController::class, 'activity'])->name('user.profile.activity');
    Route::put('user/profile', [ProfileController::class, 'update'])->name('user.profile.update');
    Route::put('user/profile/password', [ProfileController::class, 'updatePassword'])->name('user.profile.password');
    Route::post('user/profile/avatar', [ProfileController::class, 'uploadAvatar'])->name('user.profile.avatar.upload');
    Route::delete('user/profile/avatar', [ProfileController::class, 'removeAvatar'])->name('user.profile.avatar.remove');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
