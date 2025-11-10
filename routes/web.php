<?php

use App\Http\Controllers\InvitationController;
use App\Http\Controllers\WebBoardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Invitation routes (public)
Route::get('invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::get('invitations/{token}/accept', [InvitationController::class, 'redirectToShow'])->name('invitations.accept.redirect');
Route::post('invitations/{token}/accept', [InvitationController::class, 'accept'])->middleware('auth')->name('invitations.accept');
Route::post('invitations/{token}/register', [InvitationController::class, 'acceptAndRegister'])->name('invitations.register');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = request()->user();

        // Get statistics
        $totalBoards = $user->ownedBoards()->count() + $user->boards()->count();
        $totalCards = $user->createdCards()->count();
        $completedTasks = $user->createdCards()->where('is_completed', true)->count();

        // Get recent boards (last 6)
        $recentBoards = $user->allBoards()
            ->with(['owner', 'members'])
            ->latest()
            ->limit(6)
            ->get();

        // Get recent activity cards
        $recentCards = $user->createdCards()
            ->with(['list.board', 'creator'])
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'statistics' => [
                'totalBoards' => $totalBoards,
                'totalCards' => $totalCards,
                'completedTasks' => $completedTasks,
            ],
            'recentBoards' => $recentBoards,
            'recentCards' => $recentCards,
        ]);
    })->name('dashboard');

    // Board routes
    Route::get('boards', [WebBoardController::class, 'index'])->name('boards.index');
    Route::post('boards', [WebBoardController::class, 'store'])->name('boards.store');
    Route::get('boards/{board}', [WebBoardController::class, 'show'])->name('boards.show');
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
    Route::delete('lists/{list}', [WebBoardController::class, 'destroyList'])->name('lists.destroy');

    // Card routes
    Route::post('lists/{list}/cards', [WebBoardController::class, 'storeCard'])->name('lists.cards.store');
    Route::patch('cards/{card}', [WebBoardController::class, 'updateCard'])->name('cards.update');
    Route::patch('cards/{card}/move', [WebBoardController::class, 'moveCard'])->name('cards.move');
    Route::post('cards/{card}/members/{userId}', [WebBoardController::class, 'toggleCardMember'])->name('cards.members.toggle');

    // Attachment routes
    Route::post('cards/{card}/attachments', [WebBoardController::class, 'uploadAttachment'])->name('cards.attachments.upload');
    Route::delete('attachments/{attachment}', [WebBoardController::class, 'deleteAttachment'])->name('attachments.delete');

    // Comment routes
    Route::post('cards/{card}/comments', [WebBoardController::class, 'addComment'])->name('cards.comments.store');

    // Checklist routes
    Route::post('cards/{card}/checklists', [WebBoardController::class, 'addChecklistItem'])->name('cards.checklists.store');
    Route::patch('checklists/{checklist}', [WebBoardController::class, 'updateChecklistItem'])->name('checklists.update');
    Route::delete('checklists/{checklist}', [WebBoardController::class, 'deleteChecklistItem'])->name('checklists.destroy');

    // User Profile routes
    Route::get('user/profile', [ProfileController::class, 'show'])->name('user.profile.show');
    Route::put('user/profile', [ProfileController::class, 'update'])->name('user.profile.update');
    Route::put('user/profile/password', [ProfileController::class, 'updatePassword'])->name('user.profile.password');
    Route::post('user/profile/avatar', [ProfileController::class, 'uploadAvatar'])->name('user.profile.avatar.upload');
    Route::delete('user/profile/avatar', [ProfileController::class, 'removeAvatar'])->name('user.profile.avatar.remove');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
