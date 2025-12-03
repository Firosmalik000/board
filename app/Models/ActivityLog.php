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
                $entityName = $this->metadata['entity_name'] ?? ucfirst($this->entity_type);
                $boardName = $this->metadata['board_name'] ?? '';

                return match ($this->action) {
                    'created' => "Created {$this->entity_type} \"{$entityName}\"",
                    'updated' => "Updated {$this->entity_type} \"{$entityName}\"",
                    'deleted' => "Deleted {$this->entity_type} \"{$entityName}\"",
                    'moved' => "Moved {$this->entity_type} \"{$entityName}\"",
                    'commented' => "Commented on {$this->entity_type} \"{$entityName}\"",
                    'assigned' => "Assigned to {$this->entity_type} \"{$entityName}\"",
                    'unassigned' => "Unassigned from {$this->entity_type} \"{$entityName}\"",
                    'completed' => "Completed {$this->entity_type} \"{$entityName}\"",
                    'reopened' => "Reopened {$this->entity_type} \"{$entityName}\"",
                    default => "{$this->action} {$this->entity_type} \"{$entityName}\"",
                };
            }
        );
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
