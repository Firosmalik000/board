<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\ListController;
use App\Http\Middleware\AuthenticateWithBearerToken;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes with Bearer Token authentication
Route::middleware(AuthenticateWithBearerToken::class)->group(function () {

    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // Board routes
    Route::apiResource('boards', BoardController::class)->names([
        'index' => 'api.boards.index',
        'store' => 'api.boards.store',
        'show' => 'api.boards.show',
        'update' => 'api.boards.update',
        'destroy' => 'api.boards.destroy',
    ]);
    Route::post('boards/{board}/invite', [BoardController::class, 'inviteMember'])->name('api.boards.invite');
    Route::delete('boards/{board}/members/{userId}', [BoardController::class, 'removeMember'])->name('api.boards.removeMember');

    // List routes
    Route::post('boards/{board}/lists', [ListController::class, 'store'])->name('api.lists.store');
    Route::patch('lists/{list}', [ListController::class, 'update'])->name('api.lists.update');
    Route::delete('lists/{list}', [ListController::class, 'destroy'])->name('api.lists.destroy');
    Route::patch('lists/{list}/move', [ListController::class, 'move'])->name('api.lists.move');

    // Card routes
    Route::post('lists/{list}/cards', [CardController::class, 'store'])->name('api.cards.store');
    Route::get('cards/{card}', [CardController::class, 'show'])->name('api.cards.show');
    Route::patch('cards/{card}', [CardController::class, 'update'])->name('api.cards.update');
    Route::delete('cards/{card}', [CardController::class, 'destroy'])->name('api.cards.destroy');
    Route::patch('cards/{card}/move', [CardController::class, 'move'])->name('api.cards.move');
    Route::post('cards/{card}/members/{userId}', [CardController::class, 'toggleMember'])->name('api.cards.toggleMember');
    Route::post('cards/{card}/comments', [CardController::class, 'addComment'])->name('api.cards.addComment');
});
