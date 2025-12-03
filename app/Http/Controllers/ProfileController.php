<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Show the profile page.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Get statistics
        $totalBoards = $user->ownedBoards()->count() + $user->boards()->count();
        $totalCards = $user->createdCards()->count();
        $completedTasks = $user->createdCards()->where('is_completed', true)->count();

        return Inertia::render('profile', [
            'user' => $user,
            'statistics' => [
                'totalBoards' => $totalBoards,
                'totalCards' => $totalCards,
                'completedTasks' => $completedTasks,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
        ]);

        $request->user()->update($validated);

        return back();
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }

    /**
     * Upload user avatar.
     */
    public function uploadAvatar(Request $request)
    {
        $validated = $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048', // 2MB max
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update([
            'avatar' => $path,
        ]);

        return back()->with('success', 'Avatar updated successfully');
    }

    /**
     * Remove user avatar.
     */
    public function removeAvatar(Request $request)
    {
        $user = $request->user();

        // Delete avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->update([
            'avatar' => null,
        ]);

        return back()->with('success', 'Avatar removed successfully');
    }

    /**
     * Get user activity log.
     */
    public function activity(Request $request)
    {
        $user = $request->user();

        $activityLogs = $user->activityLogs()->latest()->paginate(10);

        return response()->json($activityLogs);
    }
}
