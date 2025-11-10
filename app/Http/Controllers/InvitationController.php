<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class InvitationController extends Controller
{
    /**
     * Show invitation acceptance page
     */
    public function show(string $token)
    {
        $invitation = Invitation::where('token', $token)
            ->with(['board', 'inviter'])
            ->firstOrFail();

        // Check if invitation is expired
        if ($invitation->isExpired()) {
            return Inertia::render('invitations/expired', [
                'board' => $invitation->board,
            ]);
        }

        // Check if invitation is already accepted
        if ($invitation->status === 'accepted') {
            return redirect()->route('boards.show', $invitation->board_id)
                ->with('message', 'You have already accepted this invitation.');
        }

        // Check if user exists
        $userExists = User::where('email', $invitation->email)->exists();

        return Inertia::render('invitations/accept', [
            'invitation' => [
                'id' => $invitation->id,
                'token' => $invitation->token,
                'email' => $invitation->email,
                'board' => [
                    'id' => $invitation->board->id,
                    'title' => $invitation->board->title,
                    'description' => $invitation->board->description,
                ],
                'inviter' => [
                    'name' => $invitation->inviter->name,
                ],
                'expires_at' => $invitation->expires_at->format('F j, Y g:i A'),
            ],
            'userExists' => $userExists,
        ]);
    }

    /**
     * Redirect GET requests to the show page (for backward compatibility)
     */
    public function redirectToShow(string $token)
    {
        return redirect()->route('invitations.show', ['token' => $token]);
    }

    /**
     * Accept invitation (for existing users)
     */
    public function accept(Request $request, string $token)
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        // Check if expired
        if ($invitation->isExpired()) {
            return back()->withErrors(['message' => 'This invitation has expired.']);
        }

        $user = $request->user();

        // Verify email matches
        if ($user->email !== $invitation->email) {
            return back()->withErrors(['message' => 'This invitation was sent to a different email address.']);
        }

        // Add user to board
        if (!$invitation->board->hasMember($user)) {
            $invitation->board->members()->attach($user->id, [
                'role' => $invitation->role,
                'joined_at' => now(),
            ]);
        }

        // Mark invitation as accepted
        $invitation->markAsAccepted();

        return redirect()->route('boards.show', $invitation->board_id)
            ->with('message', 'You have successfully joined the board!');
    }

    /**
     * Accept invitation and register (for new users)
     */
    public function acceptAndRegister(Request $request, string $token)
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        // Check if expired
        if ($invitation->isExpired()) {
            return back()->withErrors(['message' => 'This invitation has expired.']);
        }

        // Validate registration data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Check if user already exists
        $user = User::where('email', $invitation->email)->first();

        if (!$user) {
            // Create new user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $invitation->email,
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(), // Auto-verify email
            ]);
        }

        // Add user to board
        if (!$invitation->board->hasMember($user)) {
            $invitation->board->members()->attach($user->id, [
                'role' => $invitation->role,
                'joined_at' => now(),
            ]);
        }

        // Mark invitation as accepted
        $invitation->markAsAccepted();

        // Login user
        Auth::login($user);

        return redirect()->route('boards.show', $invitation->board_id)
            ->with('message', 'Welcome! You have successfully joined the board.');
    }
}
