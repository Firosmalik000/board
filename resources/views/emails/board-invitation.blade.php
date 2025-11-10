<x-mail::message>
# You're Invited!

Hello,

**{{ $inviterName }}** has invited you to join the board **{{ $boardTitle }}**.

@if($boardDescription)
{{ $boardDescription }}
@endif

Click the button below to accept the invitation and start collaborating:

<x-mail::button :url="$acceptUrl">
Accept Invitation
</x-mail::button>

This invitation will expire on **{{ $expiresAt }}**.

If you don't have an account yet, you'll be able to create one when you accept the invitation.

Thanks,<br>
{{ config('app.name') }}

---

<small>If you're having trouble clicking the "Accept Invitation" button, copy and paste the URL below into your web browser:</small><br>
<small>{{ $acceptUrl }}</small>
</x-mail::message>
