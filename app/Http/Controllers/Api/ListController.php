<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Board;
use App\Models\BoardList;
use Illuminate\Http\Request;

class ListController extends Controller
{
    /**
     * Create a new list
     */
    public function store(Request $request, Board $board)
    {
        if (!$board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to create lists in this board.',
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        // Get the highest position
        $maxPosition = $board->lists()->max('position') ?? -1;

        $list = BoardList::create([
            'board_id' => $board->id,
            'title' => $request->title,
            'position' => $maxPosition + 1,
        ]);

        // Log activity
        ActivityLog::create([
            'board_id' => $board->id,
            'user_id' => $request->user()->id,
            'action' => 'created',
            'entity_type' => 'list',
            'entity_id' => $list->id,
            'metadata' => ['list_title' => $list->title],
        ]);

        return response()->json([
            'message' => 'List created successfully',
            'list' => $list,
        ], 201);
    }

    /**
     * Update a list
     */
    public function update(Request $request, BoardList $list)
    {
        if (!$list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to update this list.',
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'is_archived' => 'sometimes|boolean',
        ]);

        $list->update($request->only(['title', 'is_archived']));

        // Log activity
        ActivityLog::create([
            'board_id' => $list->board_id,
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'entity_type' => 'list',
            'entity_id' => $list->id,
            'metadata' => ['list_title' => $list->title],
        ]);

        return response()->json([
            'message' => 'List updated successfully',
            'list' => $list,
        ]);
    }

    /**
     * Delete a list
     */
    public function destroy(Request $request, BoardList $list)
    {
        if (!$list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to delete this list.',
            ], 403);
        }

        $listTitle = $list->title;
        $boardId = $list->board_id;

        $list->delete();

        // Log activity
        ActivityLog::create([
            'board_id' => $boardId,
            'user_id' => $request->user()->id,
            'action' => 'deleted',
            'entity_type' => 'list',
            'metadata' => ['list_title' => $listTitle],
        ]);

        return response()->json([
            'message' => 'List deleted successfully',
        ]);
    }

    /**
     * Move/reorder a list
     */
    public function move(Request $request, BoardList $list)
    {
        if (!$list->board->hasMember($request->user())) {
            return response()->json([
                'message' => 'Unauthorized to move this list.',
            ], 403);
        }

        $request->validate([
            'position' => 'required|integer|min:0',
        ]);

        $oldPosition = $list->position;
        $newPosition = $request->position;

        // Update positions
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
            'metadata' => [
                'list_title' => $list->title,
                'from_position' => $oldPosition,
                'to_position' => $newPosition,
            ],
        ]);

        return response()->json([
            'message' => 'List moved successfully',
            'list' => $list,
        ]);
    }
}
