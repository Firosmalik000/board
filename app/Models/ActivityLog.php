<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    protected $appends = [
        'description',
        'log_type',
    ];

    /**
     * Get the board that owns the activity log
     */
    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    /**
     * Get the user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the description attribute
     */
    protected function description(): Attribute
    {
        return Attribute::make(
            get: function () {
                $metadata = $this->metadata ?? [];
                $entityType = $this->entity_type;
                $action = $this->action;

                // Handle specific action types with detailed messages
                switch ($action) {
                    case 'created':
                        return $this->getCreatedDescription($entityType, $metadata);

                    case 'updated':
                        return $this->getUpdatedDescription($entityType, $metadata);

                    case 'deleted':
                        return $this->getDeletedDescription($entityType, $metadata);

                    case 'moved':
                        return $this->getMovedDescription($entityType, $metadata);

                    case 'commented':
                        return $this->getCommentedDescription($metadata);

                    case 'updated_comment':
                        return $this->getUpdatedCommentDescription($metadata);

                    case 'deleted_comment':
                        return $this->getDeletedCommentDescription($metadata);

                    case 'assigned_member':
                        return $this->getAssignedMemberDescription($metadata);

                    case 'unassigned_member':
                        return $this->getUnassignedMemberDescription($metadata);

                    case 'uploaded_attachment':
                        return $this->getUploadedAttachmentDescription($metadata);

                    case 'deleted_attachment':
                        return $this->getDeletedAttachmentDescription($metadata);

                    case 'invited':
                        return $this->getInvitedDescription($metadata);

                    case 'updated_member_role':
                        return $this->getUpdatedMemberRoleDescription($metadata);

                    case 'removed_member':
                        return $this->getRemovedMemberDescription($metadata);

                    case 'added_checklist_item':
                        return $this->getAddedChecklistItemDescription($metadata);

                    case 'updated_checklist_item':
                        return $this->getUpdatedChecklistItemDescription($metadata);

                    case 'deleted_checklist_item':
                        return $this->getDeletedChecklistItemDescription($metadata);

                    case 'attached_label':
                        return $this->getAttachedLabelDescription($metadata);

                    case 'detached_label':
                        return $this->getDetachedLabelDescription($metadata);

                    case 'mentioned':
                        return $this->getMentionedDescription($entityType, $metadata);

                    default:
                        $entityName = $metadata['entity_name'] ?? ucfirst($entityType);
                        return ucfirst($action) . " {$entityType} \"{$entityName}\"";
                }
            }
        );
    }

    private function getCreatedDescription(string $entityType, array $metadata): string
    {
        switch ($entityType) {
            case 'card':
                $cardTitle = $metadata['card_title'] ?? 'card';
                $listName = $metadata['list_name'] ?? null;
                return $listName
                    ? "Created card \"{$cardTitle}\" in list \"{$listName}\""
                    : "Created card \"{$cardTitle}\"";

            case 'list':
                $listName = $metadata['entity_name'] ?? 'list';
                return "Created list \"{$listName}\"";

            case 'board':
                $boardName = $metadata['board_name'] ?? 'board';
                return "Created board \"{$boardName}\"";

            case 'label':
                $labelName = $metadata['label_name'] ?? 'label';
                return "Created label \"{$labelName}\"";

            default:
                $entityName = $metadata['entity_name'] ?? $entityType;
                return "Created {$entityType} \"{$entityName}\"";
        }
    }

    private function getUpdatedDescription(string $entityType, array $metadata): string
    {
        switch ($entityType) {
            case 'card':
                $cardTitle = $metadata['card_title'] ?? 'card';
                $listName = $metadata['list_name'] ?? null;
                $changedFields = $metadata['changed_fields'] ?? [];

                if (!empty($changedFields)) {
                    $fieldLabels = [
                        'title' => 'title',
                        'description' => 'description',
                        'due_date' => 'due date',
                        'is_completed' => 'completion status',
                        'list_id' => 'list',
                        'cover_color' => 'cover color',
                        'is_archived' => 'archive status',
                        'member_ids' => 'assigned members',
                    ];

                    // Special handling for list_id change (move)
                    if (in_array('list_id', $changedFields) && count($changedFields) === 1) {
                        return $listName
                            ? "Moved card \"{$cardTitle}\" to list \"{$listName}\""
                            : "Moved card \"{$cardTitle}\" to another list";
                    }

                    // Filter out position and list_id for display
                    $fieldsToShow = array_filter($changedFields, fn($f) => $f !== 'position' && $f !== 'list_id');

                    if (empty($fieldsToShow) && in_array('list_id', $changedFields)) {
                        return $listName
                            ? "Moved card \"{$cardTitle}\" to list \"{$listName}\""
                            : "Moved card \"{$cardTitle}\" to another list";
                    }

                    $changedFieldLabels = implode(', ', array_map(
                        fn($f) => $fieldLabels[$f] ?? $f,
                        $fieldsToShow
                    ));

                    $message = "Updated {$changedFieldLabels} of card \"{$cardTitle}\"";

                    if ($listName) {
                        $message .= " in list \"{$listName}\"";
                    }

                    if (in_array('list_id', $changedFields) && !empty($fieldsToShow)) {
                        $message .= ' and moved it to another list';
                    }

                    return $message;
                }

                return $listName
                    ? "Updated card \"{$cardTitle}\" in list \"{$listName}\""
                    : "Updated card \"{$cardTitle}\"";

            case 'board':
                if (isset($metadata['change'])) {
                    if ($metadata['change'] === 'background_image') {
                        return 'Updated board background image';
                    }
                    if ($metadata['change'] === 'removed_background_image') {
                        return 'Removed board background image';
                    }
                }
                return 'Updated board';

            case 'label':
                $labelName = $metadata['label_name'] ?? 'label';
                return "Updated label \"{$labelName}\"";

            default:
                $entityName = $metadata['entity_name'] ?? $entityType;
                return "Updated {$entityType} \"{$entityName}\"";
        }
    }

    private function getDeletedDescription(string $entityType, array $metadata): string
    {
        switch ($entityType) {
            case 'card':
                $cardTitle = $metadata['card_title'] ?? 'card';
                $listName = $metadata['list_name'] ?? null;
                return $listName
                    ? "Deleted card \"{$cardTitle}\" from list \"{$listName}\""
                    : "Deleted card \"{$cardTitle}\"";

            case 'label':
                $labelName = $metadata['label_name'] ?? 'label';
                return "Deleted label \"{$labelName}\"";

            default:
                $entityName = $metadata['entity_name'] ?? $entityType;
                return "Deleted {$entityType} \"{$entityName}\"";
        }
    }

    private function getMovedDescription(string $entityType, array $metadata): string
    {
        if ($entityType === 'card') {
            $cardTitle = $metadata['card_title'] ?? 'card';
            $fromList = $metadata['from_list'] ?? null;
            $toList = $metadata['to_list'] ?? null;

            if ($fromList && $toList) {
                return "Moved card \"{$cardTitle}\" from \"{$fromList}\" to \"{$toList}\"";
            }

            return "Moved card \"{$cardTitle}\"";
        }

        if ($entityType === 'list') {
            return 'Reordered list';
        }

        $entityName = $metadata['entity_name'] ?? $entityType;
        return "Moved {$entityType} \"{$entityName}\"";
    }

    private function getCommentedDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Commented on card \"{$cardTitle}\""
            : 'Added a comment';
    }

    private function getUpdatedCommentDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Edited a comment on card \"{$cardTitle}\""
            : 'Edited a comment';
    }

    private function getDeletedCommentDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Deleted a comment from card \"{$cardTitle}\""
            : 'Deleted a comment';
    }

    private function getAssignedMemberDescription(array $metadata): string
    {
        $memberName = $metadata['member_name'] ?? 'member';
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Assigned {$memberName} to card \"{$cardTitle}\""
            : "Assigned {$memberName} to a card";
    }

    private function getUnassignedMemberDescription(array $metadata): string
    {
        $memberName = $metadata['member_name'] ?? 'member';
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Removed {$memberName} from card \"{$cardTitle}\""
            : "Removed {$memberName} from a card";
    }

    private function getUploadedAttachmentDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Uploaded an attachment to card \"{$cardTitle}\""
            : 'Uploaded an attachment';
    }

    private function getDeletedAttachmentDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Deleted an attachment from card \"{$cardTitle}\""
            : 'Deleted an attachment';
    }

    private function getInvitedDescription(array $metadata): string
    {
        $email = $metadata['email'] ?? 'user';
        return "Invited {$email} to the board";
    }

    private function getUpdatedMemberRoleDescription(array $metadata): string
    {
        $memberName = $metadata['member_name'] ?? 'member';
        $newRole = $metadata['new_role'] ?? 'role';
        return "Changed {$memberName}'s role to {$newRole}";
    }

    private function getRemovedMemberDescription(array $metadata): string
    {
        $memberName = $metadata['member_name'] ?? 'member';
        return "Removed {$memberName} from the board";
    }

    private function getAddedChecklistItemDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Added a checklist item to card \"{$cardTitle}\""
            : 'Added a checklist item';
    }

    private function getUpdatedChecklistItemDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Updated a checklist item in card \"{$cardTitle}\""
            : 'Updated a checklist item';
    }

    private function getDeletedChecklistItemDescription(array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Deleted a checklist item from card \"{$cardTitle}\""
            : 'Deleted a checklist item';
    }

    private function getAttachedLabelDescription(array $metadata): string
    {
        $labelName = $metadata['label_name'] ?? 'label';
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Attached label \"{$labelName}\" to card \"{$cardTitle}\""
            : "Attached label \"{$labelName}\" to a card";
    }

    private function getDetachedLabelDescription(array $metadata): string
    {
        $labelName = $metadata['label_name'] ?? 'label';
        $cardTitle = $metadata['card_title'] ?? null;
        return $cardTitle
            ? "Removed label \"{$labelName}\" from card \"{$cardTitle}\""
            : "Removed label \"{$labelName}\" from a card";
    }

    private function getMentionedDescription(string $entityType, array $metadata): string
    {
        $cardTitle = $metadata['card_title'] ?? null;

        if ($entityType === 'comment' && $cardTitle) {
            return "Mentioned you in a comment on card \"{$cardTitle}\"";
        }

        if ($entityType === 'card' && $cardTitle) {
            return "Mentioned you in the description of card \"{$cardTitle}\"";
        }

        return 'Mentioned you';
    }

    /**
     * Get the log_type attribute
     */
    protected function logType(): Attribute
    {
        return Attribute::make(
            get: fn () => ucfirst($this->action)
        );
    }
}
