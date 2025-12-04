<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add database indexes for performance optimization
     * to prevent slow queries (N+1 problems, frequent joins, etc.)
     */
    public function up(): void
    {
        // Activity logs indexes - frequently queried by board_id and created_at
        // Note: board_id and [entity_type, entity_id] indexes already exist from table creation
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at'); // For sorting by time
            $table->index(['board_id', 'created_at']); // Composite for efficient board activity queries
            $table->index('entity_type'); // For filtering by entity type
        });

        // Lists indexes - frequently queried by board_id and position
        // Note: [board_id, position] composite index already exists from table creation
        Schema::table('lists', function (Blueprint $table) {
            $table->index('board_id'); // For loading lists by board
            $table->index('position'); // For sorting lists
            $table->index('is_archived'); // For filtering archived lists
        });

        // Cards indexes - frequently queried by list_id and position
        // Note: [list_id, position] composite and created_by indexes already exist from table creation
        Schema::table('cards', function (Blueprint $table) {
            $table->index('list_id'); // For loading cards by list
            $table->index('position'); // For sorting cards
            $table->index('is_completed'); // For filtering completed cards
            $table->index('is_archived'); // For filtering archived cards
            $table->index('due_date'); // For sorting by due date
        });

        // Comments indexes - frequently queried by card_id
        // Note: card_id and user_id indexes already exist from table creation
        Schema::table('comments', function (Blueprint $table) {
            $table->index('created_at'); // For sorting comments
        });

        // Attachments indexes
        Schema::table('attachments', function (Blueprint $table) {
            $table->index('card_id'); // For loading attachments by card
            $table->index('uploaded_by'); // For user's attachments
        });

        // Checklists indexes
        Schema::table('checklists', function (Blueprint $table) {
            $table->index('card_id'); // For loading checklists by card
            $table->index('position'); // For sorting checklists
            $table->index(['card_id', 'position']); // Composite for efficient queries
            $table->index('is_completed'); // For filtering completed items
        });

        // Labels indexes
        Schema::table('labels', function (Blueprint $table) {
            $table->index('board_id'); // For loading labels by board
        });

        // Board members pivot table indexes
        Schema::table('board_members', function (Blueprint $table) {
            $table->index('board_id'); // For loading members by board
            $table->index('user_id'); // For loading boards by user
            $table->index('role'); // For filtering by role
        });

        // Card members pivot table indexes
        Schema::table('card_members', function (Blueprint $table) {
            $table->index('card_id'); // For loading members by card
            $table->index('user_id'); // For loading cards by user
        });

        // Card label pivot table indexes
        Schema::table('card_label', function (Blueprint $table) {
            $table->index('card_id'); // For loading labels by card
            $table->index('label_id'); // For loading cards by label
        });

        // Boards indexes
        Schema::table('boards', function (Blueprint $table) {
            $table->index('owner_id'); // For loading boards by owner
            $table->index('visibility'); // For filtering by visibility
            $table->index('is_archived'); // For filtering archived boards
        });

        // Invitations indexes
        Schema::table('invitations', function (Blueprint $table) {
            $table->index('email'); // For finding invitations by email
            $table->index('token'); // For accepting invitations
            $table->index('board_id'); // For board's invitations
            $table->index('expires_at'); // For cleaning up expired invitations
        });
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

        Schema::table('labels', function (Blueprint $table) {
            $table->dropIndex(['labels_board_id_index']);
        });

        Schema::table('board_members', function (Blueprint $table) {
            $table->dropIndex(['board_members_board_id_index']);
            $table->dropIndex(['board_members_user_id_index']);
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
            $table->dropIndex(['boards_owner_id_index']);
            $table->dropIndex(['boards_visibility_index']);
            $table->dropIndex(['boards_is_archived_index']);
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropIndex(['invitations_email_index']);
            $table->dropIndex(['invitations_token_index']);
            $table->dropIndex(['invitations_board_id_index']);
            $table->dropIndex(['invitations_expires_at_index']);
        });
    }
};
