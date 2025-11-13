<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardList;
use App\Models\Card;
use Illuminate\Http\Request;

class CardController extends Controller
{
    /**
     * Create a new card
     */
    public function store(Request $request, BoardList $list)
    {
        if (!$list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to create cards in this list.',
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'cover_color' => 'nullable|string',
            'is_completed' => 'nullable|boolean',
            'category' => 'nullable|string|in:' . implode(',', array_keys(Card::CATEGORIES)),
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        // Get the highest position
        $maxPosition = $list->cards()->max('position') ?? -1;

        $card = Card::create([
            'list_id' => $list->id,
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'cover_color' => $request->cover_color,
            'is_completed' => $request->is_completed ?? false,
            'category' => $request->category,
            'position' => $maxPosition + 1,
            'created_by' => $request->user()->id,
        ]);

        // Attach members if provided
        if ($request->has('member_ids') && is_array($request->member_ids)) {
            foreach ($request->member_ids as $memberId) {
                $card->members()->attach($memberId, ['assigned_at' => now()]);
            }
        }

        // Log activity
        ActivityLog::create([
            'board_id' => $list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'created',
            'entity_type' => 'card',
            'entity_id' => $card->id,
            'metadata' => ['card_title' => $card->title, 'list_title' => $list->title],
        ]);

        return response()->json([
            'message' => 'Card created successfully',
            'card' => $card->load(['creator', 'labels', 'members']),
        ], 201);
    }

    /**
     * Get a single card
     */
    public function show(Request $request, Card $card)
    {
        if (!$card->list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to view this card.',
            ], 403);
        }

        $card->load(['creator', 'labels', 'members', 'comments.user', 'list']);

        return response()->json([
            'card' => $card,
        ]);
    }

    /**
     * Update a card
     */
    public function update(Request $request, Card $card)
    {
        if (!$card->list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to update this card.',
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'is_completed' => 'sometimes|boolean',
            'is_archived' => 'sometimes|boolean',
            'cover_color' => 'nullable|string',
            'category' => 'nullable|string|in:' . implode(',', array_keys(Card::CATEGORIES)),
        ]);

        $card->update($request->only([
            'title',
            'description',
            'due_date',
            'is_completed',
            'category',
            'is_archived',
            'cover_color',
        ]));

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'card',
            'entity_id' => $card->id,
            'metadata' => ['card_title' => $card->title],
        ]);

        return response()->json([
            'message' => 'Card updated successfully',
            'card' => $card->load(['creator', 'labels', 'members']),
        ]);
    }

    /**
     * Delete a card
     */
    public function destroy(Request $request, Card $card)
    {
        if (!$card->list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to delete this card.',
            ], 403);
        }

        $cardTitle = $card->title;
        $boardId = $card->list->board_id;

        $card->delete();

        // Log activity
        ActivityLog::create([
            'board_id' => $boardId,
            'user_id' => $request->user()->id,
            'action' => 'deleted',
            'entity_type' => 'card',
            'metadata' => ['card_title' => $cardTitle],
        ]);

        return response()->json([
            'message' => 'Card deleted successfully',
        ]);
    }

    /**
     * Move a card (within same list or to another list)
     */
    public function move(Request $request, Card $card)
    {
        if (!$card->list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to move this card.',
            ], 403);
        }

        $request->validate([
            'list_id' => 'required|exists:lists,id',
            'position' => 'required|integer|min:0',
        ]);

        $newList = BoardList::findOrFail($request->list_id);

        // Check if new list is in the same board
        if ($newList->board_id !== $card->list->board_id) {
            return response()->json([
                'message' => 'Cannot move card to a list in a different board.',
            ], 400);
        }

        $oldListId = $card->list_id;
        $oldPosition = $card->position;
        $newListId = $request->list_id;
        $newPosition = $request->position;

        if ($oldListId === $newListId) {
            // Moving within the same list
            if ($newPosition < $oldPosition) {
                Card::where('list_id', $oldListId)
                    ->whereBetween('position', [$newPosition, $oldPosition - 1])
                    ->increment('position');
            } else {
                Card::where('list_id', $oldListId)
                    ->whereBetween('position', [$oldPosition + 1, $newPosition])
                    ->decrement('position');
            }
        } else {
            // Moving to a different list
            Card::where('list_id', $oldListId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');

            Card::where('list_id', $newListId)
                ->where('position', '>=', $newPosition)
                ->increment('position');
        }

        $card->update([
            'list_id' => $newListId,
            'position' => $newPosition,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $card->list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'moved',
            'entity_type' => 'card',
            'entity_id' => $card->id,
            'metadata' => [
                'card_title' => $card->title,
                'from_list' => $oldListId,
                'to_list' => $newListId,
                'from_position' => $oldPosition,
                'to_position' => $newPosition,
            ],
        ]);

        return response()->json([
            'message' => 'Card moved successfully',
            'card' => $card->load(['creator', 'labels', 'members', 'list']),
        ]);
    }

    /**
     * Add/remove members to/from a card
     */
    public function toggleMember(Request $request, Card $card, $userId)
    {
        if (!$card->list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $isMember = $card->members()->where('user_id', $userId)->exists();

        if ($isMember) {
            $card->members()->detach($userId);
            $message = 'Member removed from card';
        } else {
            $card->members()->attach($userId, ['assigned_at' => now()]);
            $message = 'Member added to card';
        }

        return response()->json([
            'message' => $message,
            'card' => $card->load(['members']),
        ]);
    }

    /**
     * Add a comment to a card
     */
    public function addComment(Request $request, Card $card)
    {
        if (!$card->list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $request->validate([
            'content' => 'required|string',
        ]);

        $comment = $card->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
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

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => $comment->load('user'),
        ], 201);
    }
}
