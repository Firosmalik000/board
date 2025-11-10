<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Board;
use Illuminate\Http\Request;

class BoardController extends Controller
{
    /**
     * Get all boards for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $boards = $user->allBoards()
            ->with(['owner', 'members'])
            ->latest()
            ->get();

        return response()->json([
            'boards' => $boards,
        ]);
    }

    /**
     * Create a new board
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'nullable|in:private,team,public',
            'background_color' => 'nullable|string',
        ]);

        $board = Board::create([
            'title' => $request->title,
            'description' => $request->description,
            'visibility' => $request->visibility ?? 'private',
            'background_color' => $request->background_color ?? '#0079bf',
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

        return response()->json([
            'message' => 'Board created successfully',
            'board' => $board->load(['owner', 'members']),
        ], 201);
    }

    /**
     * Get a single board with all data
     */
    public function show(Request $request, Board $board)
    {
        // Check if user has access
        if (!$board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to access this board.',
            ], 403);
        }

        $board->load([
            'owner',
            'members',
            'lists.cards.labels',
            'lists.cards.members',
            'lists.cards.creator',
            'labels',
        ]);

        return response()->json([
            'board' => $board,
        ]);
    }

    /**
     * Update a board
     */
    public function update(Request $request, Board $board)
    {
        // Check if user is admin
        if (!$board->isAdmin($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to update this board.',
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'sometimes|in:private,team,public',
            'background_color' => 'nullable|string',
            'is_archived' => 'sometimes|boolean',
        ]);

        $board->update($request->only([
            'title',
            'description',
            'visibility',
            'background_color',
            'is_archived',
        ]));

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'board',
            'entity_id' => $board->id,
        ]);

        return response()->json([
            'message' => 'Board updated successfully',
            'board' => $board,
        ]);
    }

    /**
     * Delete a board
     */
    public function destroy(Request $request, Board $board)
    {
        // Only owner can delete
        if ($board->owner_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Only the owner can delete this board.',
            ], 403);
        }

        $board->delete();

        return response()->json([
            'message' => 'Board deleted successfully',
        ]);
    }

    /**
     * Invite a member to the board (with email)
     */
    public function inviteMember(Request $request, Board $board)
    {
        if (!$board->isAdmin($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to invite members.',
            ], 403);
        }

        $request->validate([
            'email' => 'required|email',
            'role' => 'nullable|in:admin,member',
        ]);

        // Check if user already exists
        $existingUser = \App\Models\User::where('email', $request->email)->first();

        if ($existingUser && $board->hasMember($existingUser)) {
            return response()->json([
                'message' => 'User is already a member of this board.',
            ], 400);
        }

        // Check if there's already a pending invitation
        $existingInvitation = \App\Models\Invitation::where('board_id', $board->id)
            ->where('email', $request->email)
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
                    'role' => $request->role ?? 'member',
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
                'email' => $request->email,
                'token' => \App\Models\Invitation::generateToken(),
                'role' => $request->role ?? 'member',
                'expires_at' => now()->addDays(7),
            ]);
        }

        // Send invitation email
        try {
            \Illuminate\Support\Facades\Mail::to($request->email)
                ->send(new \App\Mail\BoardInvitation($invitation));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Illuminate\Support\Facades\Log::error('Failed to send invitation email: ' . $e->getMessage());
        }

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'invited',
            'entity_type' => 'invitation',
            'entity_id' => $invitation->id,
            'metadata' => ['email' => $request->email],
        ]);

        return response()->json([
            'message' => 'Invitation sent successfully',
            'invitation' => $invitation,
        ]);
    }

    /**
     * Remove a member from the board
     */
    public function removeMember(Request $request, Board $board, $userId)
    {
        if (!$board->isAdmin($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to remove members.',
            ], 403);
        }

        $board->members()->detach($userId);

        return response()->json([
            'message' => 'Member removed successfully',
        ]);
    }
}
