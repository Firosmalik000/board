<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'list_id',
        'title',
        'description',
        'position',
        'due_date',
        'is_completed',
        'is_archived',
        'cover_color',
        'cover_image',
        'created_by',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'is_archived' => 'boolean',
        'due_date' => 'date',
    ];

    /**
     * Get the list that owns the card
     */
    public function list(): BelongsTo
    {
        return $this->belongsTo(BoardList::class, 'list_id');
    }

    /**
     * Get the user who created the card
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all members assigned to the card
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'card_members')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    /**
     * Get all labels for the card
     */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'card_label')
            ->withTimestamps();
    }

    /**
     * Get all comments for the card
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    /**
     * Get all attachments for the card
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class)->latest();
    }

    /**
     * Get all checklist items for the card
     */
    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class)->orderBy('position');
    }
}
