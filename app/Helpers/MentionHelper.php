<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;

class MentionHelper
{
    /**
     * Extract mentioned usernames from text
     * Detects patterns like @username or @"User Name"
     *
     * @param string $text
     * @return array Array of usernames
     */
    public static function extractMentions(string $text): array
    {
        $mentions = [];

        // Pattern 1: @username (no spaces)
        preg_match_all('/@([a-zA-Z0-9_.-]+)/', $text, $simpleMatches);
        if (!empty($simpleMatches[1])) {
            $mentions = array_merge($mentions, $simpleMatches[1]);
        }

        // Pattern 2: @"User Name" (with quotes for names with spaces)
        preg_match_all('/@"([^"]+)"/', $text, $quotedMatches);
        if (!empty($quotedMatches[1])) {
            $mentions = array_merge($mentions, $quotedMatches[1]);
        }

        // Remove duplicates and return
        return array_unique($mentions);
    }

    /**
     * Find users from mentioned usernames or names
     *
     * @param array $mentions Array of usernames/names
     * @return \Illuminate\Support\Collection Collection of User models
     */
    public static function findMentionedUsers(array $mentions): \Illuminate\Support\Collection
    {
        if (empty($mentions)) {
            return collect([]);
        }

        // Search by username (email prefix) or full name
        return User::where(function ($query) use ($mentions) {
            foreach ($mentions as $mention) {
                // Search by email prefix (username part before @)
                $query->orWhere('email', 'like', $mention . '%')
                      // Search by full name (case insensitive)
                      ->orWhereRaw('LOWER(name) = ?', [strtolower($mention)]);
            }
        })->get();
    }

    /**
     * Create mention notifications for mentioned users
     *
     * @param string $content The content containing mentions
     * @param int $boardId Board ID
     * @param int $mentionerId User ID who created the mention
     * @param string $entityType Type of entity (comment, card, etc.)
     * @param int $entityId Entity ID
     * @param array $metadata Additional metadata
     * @return int Number of notifications created
     */
    public static function createMentionNotifications(
        string $content,
        int $boardId,
        int $mentionerId,
        string $entityType,
        int $entityId,
        array $metadata = []
    ): int {
        // Extract mentions from content
        $mentions = self::extractMentions($content);

        if (empty($mentions)) {
            return 0;
        }

        // Find mentioned users
        $mentionedUsers = self::findMentionedUsers($mentions);

        if ($mentionedUsers->isEmpty()) {
            return 0;
        }

        $notificationCount = 0;

        // Create activity log for each mentioned user
        foreach ($mentionedUsers as $user) {
            // Don't notify if user mentions themselves
            if ($user->id === $mentionerId) {
                continue;
            }

            try {
                ActivityLog::create([
                    'board_id' => $boardId,
                    'user_id' => $mentionerId,
                    'action' => 'mentioned',
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'metadata' => array_merge($metadata, [
                        'mentioned_user_id' => $user->id,
                        'mentioned_user_name' => $user->name,
                    ]),
                ]);

                $notificationCount++;
            } catch (\Exception $e) {
                Log::error('Failed to create mention notification', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $notificationCount;
    }

    /**
     * Get board members for mention autocomplete
     *
     * @param \App\Models\Board $board
     * @return array Array of users formatted for autocomplete
     */
    public static function getBoardMembersForMention(\App\Models\Board $board): array
    {
        return $board->members()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar ? "/storage/{$user->avatar}" : null,
                'username' => explode('@', $user->email)[0], // Extract username from email
            ];
        })->toArray();
    }
}
