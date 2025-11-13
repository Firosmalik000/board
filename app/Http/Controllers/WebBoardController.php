<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attachment;
use App\Models\Board;
use App\Models\BoardList;
use App\Models\Card;
use App\Models\Checklist;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;
class WebBoardController extends Controller
{
    /**
     * Display a listing of boards.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $boards = $user->allBoards()
            ->with(['owner', 'members', 'lists'])
            ->latest()
            ->get();

        return Inertia::render('boards/index', [
            'boards' => $boards,
        ]);
    }

    /**
     * Store a newly created board.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'nullable|in:private,team,public',
            'background_color' => 'nullable|string',
        ]);

        $board = Board::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'visibility' => $validated['visibility'] ?? 'private',
            'background_color' => $validated['background_color'] ?? '#0079bf',
            'owner_id' => $request->user()->id,
        ]);

        // Add owner as member
        $board->members()->attach($request->user()->id, [
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'created',
            'entity_type' => 'board',
            'entity_id' => $board->id,
        ]);

        return redirect()->route('boards.index');
    }

    /**
     * Display the specified board.
     */
    public function show(Request $request, Board $board)
    {
        // Check if user has access
        if (!$board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $board->load([
            'owner',
            'members',
            'lists.cards.labels',
            'lists.cards.members',
            'lists.cards.creator',
            'lists.cards.comments.user',
            'lists.cards.attachments.uploader',
            'lists.cards.checklists',
            'labels',
        ]);

        return Inertia::render('boards/show', [
            'board' => $board,
        ]);
    }

    /**
     * Update a board.
     */
    public function update(Request $request, Board $board)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            abort(403, 'Unauthorized to update this board.');
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'sometimes|in:private,team,public',
            'background_color' => 'nullable|string',
            'is_archived' => 'sometimes|boolean',
        ]);

        $board->update($validated);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'board',
            'entity_id' => $board->id,
        ]);

        return back()->with('success', 'Board updated successfully');
    }

    /**
     * Upload background image for board.
     */
    public function uploadBackgroundImage(Request $request, Board $board)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            abort(403, 'Unauthorized to update this board.');
        }

        $validated = $request->validate([
            'background_image' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max
        ]);

        // Delete old background image if exists
        if ($board->background_image) {
            Storage::disk('public')->delete($board->background_image);
        }

        // Store new background image
        $path = $request->file('background_image')->store('board-backgrounds', 'public');

        $board->update([
            'background_image' => $path,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'board',
            'entity_id' => $board->id,
            'metadata' => ['change' => 'background_image'],
        ]);

        return back()->with('success', 'Background image updated successfully');
    }

    /**
     * Remove background image from board.
     */
    public function removeBackgroundImage(Request $request, Board $board)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            abort(403, 'Unauthorized to update this board.');
        }

        // Delete background image if exists
        if ($board->background_image) {
            Storage::disk('public')->delete($board->background_image);
        }

        $board->update([
            'background_image' => null,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'board',
            'entity_id' => $board->id,
            'metadata' => ['change' => 'removed_background_image'],
        ]);

        return back()->with('success', 'Background image removed successfully');
    }

    /**
     * Delete a board.
     */
    public function destroy(Request $request, Board $board)
    {
        // Only owner can delete
        if ($board->owner_id !== $request->user()->id) {
            abort(403, 'Only the owner can delete this board.');
        }

        $board->delete();

        return redirect()->route('boards.index')->with('success', 'Board deleted successfully');
    }

    /**
     * Create a new list in a board.
     */
    public function storeList(Request $request, Board $board)
    {
        // Check if user has access
        if (!$board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_key' => 'nullable|string',
        ]);

        $position = $board->lists()->max('position') + 1;

        $list = BoardList::create([
            'board_id' => $board->id,
            'title' => $validated['title'],
            'category_key' => $validated['category_key'] ?? null,
            'position' => $position,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'created',
            'entity_type' => 'list',
            'entity_id' => $list->id,
        ]);

        return back();
    }

    /**
     * Update a list.
     */
    public function updateList(Request $request, BoardList $list)
    {
        // Check if user has access to the board
        if (!$list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $list->update($validated);

        // Log activity
        ActivityLog::create([
            'board_id' => $list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'list',
            'entity_id' => $list->id,
        ]);

        return back();
    }

    /**
     * Move a list (reorder position).
     */
    public function moveList(Request $request, BoardList $list)
    {
        // Check if user has access to the board
        if (!$list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'position' => 'required|integer|min:0',
        ]);

        $oldPosition = $list->position;
        $newPosition = $validated['position'];

        // Update positions of other lists
        if ($newPosition < $oldPosition) {
            // Moving left
            BoardList::where('board_id', $list->board_id)
                ->whereBetween('position', [$newPosition, $oldPosition - 1])
                ->increment('position');
        } else {
            // Moving right
            BoardList::where('board_id', $list->board_id)
                ->whereBetween('position', [$oldPosition + 1, $newPosition])
                ->decrement('position');
        }

        $list->update(['position' => $newPosition]);

        // Log activity
        ActivityLog::create([
            'board_id' => $list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'moved',
            'entity_type' => 'list',
            'entity_id' => $list->id,
        ]);

        return back();
    }

    /**
     * Delete a list.
     */
    public function destroyList(Request $request, BoardList $list)
    {
        // Check if user has access to the board
        if (!$list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        // Log activity before deletion
        ActivityLog::create([
            'board_id' => $list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'deleted',
            'entity_type' => 'list',
            'entity_id' => $list->id,
        ]);

        $list->delete();

        return back();
    }

    /**
     * Create a new card in a list.
     */
    public function storeCard(Request $request, BoardList $list)
    {
        // Check if user has access to the board
        if (!$list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $position = $list->cards()->max('position') + 1;

        $card = Card::create([
            'list_id' => $list->id,
            'title' => $validated['title'],
            'position' => $position,
            'created_by' => $request->user()->id,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'created',
            'entity_type' => 'card',
            'entity_id' => $card->id,
        ]);

        return back();
    }

    /**
     * Update a card.
     */
    public function updateCard(Request $request, Card $card)
{
    // Pastikan user terautentikasi
    $user = $request->user();
    if (!$user) {
        if ($request->wantsJson()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        abort(401);
    }

 
    // Pastikan card memiliki relation list & board (defensive)
    if (!$card->relationLoaded('list')) {
        $card->load('list.board'); // coba load relasi kalau belum di-load
    } else {
        if (!$card->list->relationLoaded('board')) {
            $card->list->load('board');
        }
    }

    if (!$card->list || !$card->list->board || !$card->list->board->hasMember($user)) {
        if ($request->wantsJson()) {
            return response()->json(['error' => 'Unauthorized to access this board.'], 403);
        }
        abort(403, 'Unauthorized to access this board.');
    }

    // Get list IDs from the board for validation
    $listIds = BoardList::where('board_id', $card->list->board->id)
        ->pluck('id')
        ->toArray();

    // Build rules
    $rules = [
        'title' => 'sometimes|string|max:255',
        'description' => 'nullable|string',
        'due_date' => 'nullable|date',
        'is_completed' => 'sometimes|boolean',
        'cover_color' => 'nullable|string',
    ];

    // Category should be a list ID (integer)
    if (!empty($listIds)) {
        $rules['category'] = 'nullable|integer|in:' . implode(',', $listIds);
    } else {
        $rules['category'] = 'nullable|integer';
    }
    // Validasi input (manual agar kita bisa mengembalikan 422 tanpa exception global)
    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        if ($request->wantsJson()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }
        // Untuk Inertia/web: redirect back with errors & old input
        return back()->withErrors($validator)->withInput();
    }

    $validated = $validator->validated();

    // Mulai transaksi
    DB::beginTransaction();

    try {
        // Simpan boardId sekarang (dipakai untuk activity log)
        $boardId = $card->list->board_id;

        // Handle category change => category is now the target list ID
        if (isset($validated['category']) && $validated['category'] !== null) {
            $targetListId = (int) $validated['category'];

            // Check if we need to move the card to a different list
            if ($targetListId !== $card->list_id) {
                $targetList = BoardList::where('id', $targetListId)
                    ->where('board_id', $card->list->board_id)
                    ->first();

                if ($targetList) {
                    $oldListId = $card->list_id;
                    $maxPos = $targetList->cards()->max('position');
                    $newPosition = (is_null($maxPos) ? 0 : $maxPos) + 1;

                    // Decrease position of cards in old list that are after this card
                    Card::where('list_id', $oldListId)
                        ->where('position', '>', $card->position)
                        ->decrement('position');

                    // Update card's list and position
                    $validated['list_id'] = $targetList->id;
                    $validated['position'] = $newPosition;

                    // Update boardId for activity log if needed
                    $boardId = $targetList->board_id;
                }
            }
        }

        // Remove category from validated data (we don't store it in the card)
        unset($validated['category']);

        // Jika tidak ada list_id di validasi tetapi ada perubahan posisi (misalnya user memindahkan card),
        // Anda mungkin punya endpoint / mekanisme terpisah untuk handle move. Di sini kami hanya pakai validated input.
        // Pastikan fillable/guarded di model Card memperbolehkan field yang diupdate.
        $card->fill($validated);
        $card->save();

        // Buat activity log
        ActivityLog::create([
            'board_id' => $boardId,
            'user_id'  => $user->id,
            'action'   => 'updated',
            'entity_type' => 'card',
            'entity_id' => $card->id,
        ]);

        DB::commit();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'card' => $card], 200);
        }

        // Untuk Inertia/pages, redirect back atau ke route board show
        return back()->with('success', 'Card updated successfully.');
    } catch (Exception $e) {
        DB::rollBack();
         dd($e->getMessage(), $e->getFile(), $e->getLine(), $e->getTraceAsString());


        Log::error('Failed to update card', [
            'message' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile(),
            'card_id' => $card->id,
            'user_id' => $user->id,
        ]);

            return response()->json([
                'error' => 'Failed to update card',
                'message' => $e->getMessage(), 
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'card_id' => $card->id,
                'user_id' => $user->id,
            ], 500);

        // Untuk web, kembali dengan error flash (jangan tampilkan stack trace ke user)
        return back()->with('error', 'Failed to update card. Please try again.');
    }
}

    /**
     * Move a card to another list.
     */
    public function moveCard(Request $request, Card $card)
    {
        // Check if user has access to the board
        if (!$card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'list_id' => 'required|exists:lists,id',
            'position' => 'required|integer|min:0',
        ]);

        $oldListId = $card->list_id;

        $card->update([
            'list_id' => $validated['list_id'],
            'position' => $validated['position'],
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'moved',
            'entity_type' => 'card',
            'entity_id' => $card->id,
        ]);

        return back();
    }

    /**
     * Delete a card.
     */
    public function destroyCard(Request $request, Card $card)
    {
        // Check if user has access to the board
        if (!$card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to delete this card.');
        }

        $cardTitle = $card->title;
        $boardId = $card->list->board_id;

        // Delete all attachments files from storage
        foreach ($card->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Log activity before deletion
        ActivityLog::create([
            'board_id' => $boardId,
            'user_id' => $request->user()->id,
            'action' => 'deleted',
            'entity_type' => 'card',
            'metadata' => ['card_title' => $cardTitle],
        ]);

        $card->delete();

        return back();
    }

    /**
     * Toggle a member on a card (assign/unassign)
     * Only admins can assign/unassign members to cards
     */
    public function toggleCardMember(Request $request, Card $card, $userId)
    {
        // Check if user has access to the board
        if (!$card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        // Check if user is admin (only admins can assign members to cards)
        if (!$card->list->board->isAdmin($request->user())) {
            return back()->withErrors(['error' => 'Only board admins can assign members to cards.']);
        }

        // Check if the user to be assigned is a board member
        $userToAssign = \App\Models\User::find($userId);
        if (!$userToAssign || !$card->list->board->hasMember($userToAssign)) {
            return back()->withErrors(['error' => 'User must be a board member to be assigned to cards.']);
        }

        // Toggle member
        $isMember = $card->members()->where('user_id', $userId)->exists();

        if ($isMember) {
            $card->members()->detach($userId);
            $action = 'unassigned_member';
            $message = 'Member removed from card';
        } else {
            $card->members()->attach($userId, ['assigned_at' => now()]);
            $action = 'assigned_member';
            $message = 'Member assigned to card';
        }

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => $action,
            'entity_type' => 'card',
            'entity_id' => $card->id,
            'metadata' => ['assigned_user_id' => $userId],
        ]);

        return back()->with('success', $message);
    }

    /**
     * Upload attachment to a card
     */
    public function uploadAttachment(Request $request, Card $card)
    {
        // Check if user has access to the board
        if (!$card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        $file = $request->file('file');
        $originalFilename = $file->getClientOriginalName();
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $filePath = $file->storeAs('attachments', $filename, 'public');

        $attachment = Attachment::create([
            'card_id' => $card->id,
            'uploaded_by' => $request->user()->id,
            'filename' => $filename,
            'original_filename' => $originalFilename,
            'file_path' => $filePath,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'uploaded_attachment',
            'entity_type' => 'card',
            'entity_id' => $card->id,
        ]);

        return back();
    }

    /**
     * Delete an attachment
     */
    public function deleteAttachment(Request $request, Attachment $attachment)
    {
        // Check if user has access to the board
        if (!$attachment->card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to delete this attachment.');
        }

        // Delete file from storage
        Storage::disk('public')->delete($attachment->file_path);

        // Log activity
        ActivityLog::create([
            'board_id' => $attachment->card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'deleted_attachment',
            'entity_type' => 'card',
            'entity_id' => $attachment->card_id,
        ]);

        $attachment->delete();

        return back();
    }

    /**
     * Add a comment to a card
     */
    public function addComment(Request $request, Card $card)
    {
        // Check if user has access to the board
        if (!$card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to comment on this card.');
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $comment = $card->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'commented',
            'entity_type' => 'card',
            'entity_id' => $card->id,
            'metadata' => ['card_title' => $card->title],
        ]);

        return back();
    }

    /**
     * Invite a member to the board
     */
    public function inviteMember(Request $request, Board $board)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            abort(403, 'Unauthorized to invite members.');
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'nullable|in:admin,member',
        ]);

        // Check if user already exists
        $existingUser = \App\Models\User::where('email', $validated['email'])->first();

        if ($existingUser && $board->hasMember($existingUser)) {
            return back()->withErrors(['email' => 'User is already a member of this board.']);
        }

        // Check if there's already a pending invitation
        $existingInvitation = \App\Models\Invitation::where('board_id', $board->id)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->first();

        if ($existingInvitation) {
            // If invitation exists but is expired, delete it and create new one
            if ($existingInvitation->isExpired()) {
                $existingInvitation->delete();
            } else {
                // Update existing invitation with new token and expiry date
                $existingInvitation->update([
                    'token' => \App\Models\Invitation::generateToken(),
                    'role' => $validated['role'] ?? 'member',
                    'expires_at' => now()->addDays(7),
                    'inviter_id' => $request->user()->id,
                ]);
                $invitation = $existingInvitation;
            }
        }

        // Create new invitation if it doesn't exist or was expired
        if (!isset($invitation)) {
            $invitation = \App\Models\Invitation::create([
                'board_id' => $board->id,
                'inviter_id' => $request->user()->id,
                'email' => $validated['email'],
                'token' => \App\Models\Invitation::generateToken(),
                'role' => $validated['role'] ?? 'member',
                'expires_at' => now()->addDays(7),
            ]);
        }

        // Send invitation email
        try {
            \Illuminate\Support\Facades\Mail::to($validated['email'])
                ->send(new \App\Mail\BoardInvitation($invitation));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to send invitation email: ' . $e->getMessage());
        }

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'invited',
            'entity_type' => 'invitation',
            'entity_id' => $invitation->id,
            'metadata' => ['email' => $validated['email']],
        ]);

        return back()->with('success', 'Invitation sent successfully');
    }

    /**
     * Update a member's role in the board
     */
    public function updateMemberRole(Request $request, Board $board, $userId)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            abort(403, 'Unauthorized to update member roles.');
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,member',
        ]);

        // Cannot change the owner's role
        if ($board->owner_id == $userId) {
            return back()->withErrors(['error' => 'Cannot change the owner\'s role.']);
        }

        // Update member role
        $board->members()->updateExistingPivot($userId, [
            'role' => $validated['role'],
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'updated_member_role',
            'entity_type' => 'board',
            'entity_id' => $board->id,
            'metadata' => ['member_id' => $userId, 'new_role' => $validated['role']],
        ]);

        return back()->with('success', 'Member role updated successfully');
    }

    /**
     * Remove a member from the board
     */
    public function removeMember(Request $request, Board $board, $userId)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            abort(403, 'Unauthorized to remove members.');
        }

        // Cannot remove the owner
        if ($board->owner_id == $userId) {
            return back()->withErrors(['error' => 'Cannot remove the board owner.']);
        }

        $board->members()->detach($userId);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'removed_member',
            'entity_type' => 'board',
            'entity_id' => $board->id,
        ]);

        return back()->with('success', 'Member removed successfully');
    }

    /**
     * Add a checklist item to a card
     */
    public function addChecklistItem(Request $request, Card $card)
    {
        // Check if user has access to the board
        if (!$card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        // Get the next position
        $lastPosition = $card->checklists()->max('position') ?? 0;

        $checklist = $card->checklists()->create([
            'title' => $validated['title'],
            'is_completed' => false,
            'position' => $lastPosition + 1,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'added_checklist_item',
            'entity_type' => 'card',
            'entity_id' => $card->id,
        ]);

        return back()->with('success', 'Checklist item added');
    }

    /**
     * Update a checklist item (toggle completed or update title)
     */
    public function updateChecklistItem(Request $request, Checklist $checklist)
    {
        // Check if user has access to the board
        if (!$checklist->card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'is_completed' => 'sometimes|boolean',
        ]);

        $checklist->update($validated);

        // Log activity
        ActivityLog::create([
            'board_id' => $checklist->card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'updated_checklist_item',
            'entity_type' => 'card',
            'entity_id' => $checklist->card_id,
        ]);

        return back()->with('success', 'Checklist item updated');
    }

    /**
     * Delete a checklist item
     */
    public function deleteChecklistItem(Request $request, Checklist $checklist)
    {
        // Check if user has access to the board
        if (!$checklist->card->list->board->hasMember($request->user())) {
            abort(403, 'Unauthorized to access this board.');
        }

        // Log activity
        ActivityLog::create([
            'board_id' => $checklist->card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'deleted_checklist_item',
            'entity_type' => 'card',
            'entity_id' => $checklist->card_id,
        ]);

        $checklist->delete();

        return back()->with('success', 'Checklist item deleted');
    }
}
