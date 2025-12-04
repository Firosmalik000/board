<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $exists = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return !empty($exists);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Add index only if it doesn't exist
     */
    private function addIndexSafely(string $table, $columns, string $indexName): void
    {
        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($columns) {
                $table->index($columns);
            });
        }
    }

    /**
     * Run the migrations.
     *
     * Add database indexes for performance optimization
     * to prevent slow queries (N+1 problems, frequent joins, etc.)
     *
     * NOTE: This migration is idempotent - it checks if indexes exist before creating them
     * to handle cases where the migration was partially run before
     */
    public function up(): void
    {
        // Activity logs indexes - frequently queried by board_id and created_at
        // Note: board_id and [entity_type, entity_id] indexes already exist from table creation
        $this->addIndexSafely('activity_logs', 'created_at', 'activity_logs_created_at_index');
        $this->addIndexSafely('activity_logs', ['board_id', 'created_at'], 'activity_logs_board_id_created_at_index');
        $this->addIndexSafely('activity_logs', 'entity_type', 'activity_logs_entity_type_index');

        // Lists indexes - frequently queried by board_id and position
        // Note: [board_id, position] composite index already exists from table creation
        $this->addIndexSafely('lists', 'board_id', 'lists_board_id_index');
        $this->addIndexSafely('lists', 'position', 'lists_position_index');
        $this->addIndexSafely('lists', 'is_archived', 'lists_is_archived_index');

        // Cards indexes - frequently queried by list_id and position
        // Note: [list_id, position] composite and created_by indexes already exist from table creation
        $this->addIndexSafely('cards', 'list_id', 'cards_list_id_index');
        $this->addIndexSafely('cards', 'position', 'cards_position_index');
        $this->addIndexSafely('cards', 'is_completed', 'cards_is_completed_index');
        $this->addIndexSafely('cards', 'is_archived', 'cards_is_archived_index');
        $this->addIndexSafely('cards', 'due_date', 'cards_due_date_index');

        // Comments indexes - frequently queried by card_id
        // Note: card_id and user_id indexes already exist from table creation
        $this->addIndexSafely('comments', 'created_at', 'comments_created_at_index');

        // Attachments indexes
        $this->addIndexSafely('attachments', 'card_id', 'attachments_card_id_index');
        $this->addIndexSafely('attachments', 'uploaded_by', 'attachments_uploaded_by_index');

        // Checklists indexes
        $this->addIndexSafely('checklists', 'card_id', 'checklists_card_id_index');
        $this->addIndexSafely('checklists', 'position', 'checklists_position_index');
        $this->addIndexSafely('checklists', ['card_id', 'position'], 'checklists_card_id_position_index');
        $this->addIndexSafely('checklists', 'is_completed', 'checklists_is_completed_index');

        // Labels indexes
        // Note: board_id index already exists from table creation
        // No additional indexes needed for labels table

        // Board members pivot table indexes
        // Note: board_id and user_id indexes already exist from table creation
        $this->addIndexSafely('board_members', 'role', 'board_members_role_index');

        // Card members pivot table indexes
        $this->addIndexSafely('card_members', 'card_id', 'card_members_card_id_index');
        $this->addIndexSafely('card_members', 'user_id', 'card_members_user_id_index');

        // Card label pivot table indexes
        $this->addIndexSafely('card_label', 'card_id', 'card_label_card_id_index');
        $this->addIndexSafely('card_label', 'label_id', 'card_label_label_id_index');

        // Boards indexes
        // Note: owner_id and visibility indexes already exist from table creation
        $this->addIndexSafely('boards', 'is_archived', 'boards_is_archived_index');

        // Invitations indexes
        // Note: token index already exists from table creation
        // Note: [email, status] composite exists, but we add separate email index for email-only queries
        $this->addIndexSafely('invitations', 'email', 'invitations_email_index');
        $this->addIndexSafely('invitations', 'board_id', 'invitations_board_id_index');
        $this->addIndexSafely('invitations', 'expires_at', 'invitations_expires_at_index');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['activity_logs_created_at_index']);
            $table->dropIndex(['activity_logs_board_id_created_at_index']);
            $table->dropIndex(['activity_logs_entity_type_index']);
        });

        Schema::table('lists', function (Blueprint $table) {
            $table->dropIndex(['lists_board_id_index']);
            $table->dropIndex(['lists_position_index']);
            $table->dropIndex(['lists_is_archived_index']);
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropIndex(['cards_list_id_index']);
            $table->dropIndex(['cards_position_index']);
            $table->dropIndex(['cards_is_completed_index']);
            $table->dropIndex(['cards_is_archived_index']);
            $table->dropIndex(['cards_due_date_index']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['comments_created_at_index']);
        });

        Schema::table('attachments', function (Blueprint $table) {
            $table->dropIndex(['attachments_card_id_index']);
            $table->dropIndex(['attachments_uploaded_by_index']);
        });

        Schema::table('checklists', function (Blueprint $table) {
            $table->dropIndex(['checklists_card_id_index']);
            $table->dropIndex(['checklists_position_index']);
            $table->dropIndex(['checklists_card_id_position_index']);
            $table->dropIndex(['checklists_is_completed_index']);
        });

        // Labels - no indexes to drop (all already existed)

        Schema::table('board_members', function (Blueprint $table) {
            $table->dropIndex(['board_members_role_index']);
        });

        Schema::table('card_members', function (Blueprint $table) {
            $table->dropIndex(['card_members_card_id_index']);
            $table->dropIndex(['card_members_user_id_index']);
        });

        Schema::table('card_label', function (Blueprint $table) {
            $table->dropIndex(['card_label_card_id_index']);
            $table->dropIndex(['card_label_label_id_index']);
        });

        Schema::table('boards', function (Blueprint $table) {
            $table->dropIndex(['boards_is_archived_index']);
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropIndex(['invitations_email_index']);
            $table->dropIndex(['invitations_board_id_index']);
            $table->dropIndex(['invitations_expires_at_index']);
        });
    }
};
