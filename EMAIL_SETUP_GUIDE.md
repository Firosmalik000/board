# 📧 Email Setup Guide - Kanban Board Application

Panduan lengkap untuk setup email invitation system.

---

## 🎯 Overview

Aplikasi Kanban Board sekarang sudah dilengkapi dengan fitur **Email Invitation System** yang memungkinkan:

✅ **Invite user baru** (yang belum punya akun)
✅ **Invite user existing** (yang sudah punya akun)
✅ **Email invitation link** dengan expiry 7 hari
✅ **Auto-register** user baru saat accept invitation
✅ **Email templates** yang professional

---

## 📋 Prerequisites

Sebelum setup email, pastikan sudah:
1. ✅ Run migration baru: `php artisan migrate`
2. ✅ Setup email service (Gmail, Mailtrap, Mailgun, etc.)
3. ✅ Configure `.env` file

---

## ⚙️ Email Configuration

### **Option 1: Gmail (Development/Testing)**

#### 1. Enable App Password di Gmail

1. Buka Google Account: https://myaccount.google.com/
2. Navigate to **Security** > **2-Step Verification** (aktifkan jika belum)
3. Scroll ke bawah, pilih **App passwords**
4. Generate app password untuk "Mail"
5. Copy password yang dihasilkan

#### 2. Update `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

#### 3. Test Email

```bash
php artisan tinker
```

```php
Mail::raw('Test email', function($message) {
    $message->to('test@example.com')->subject('Test');
});
```

---

### **Option 2: Mailtrap (Development/Testing - Recommended)**

Mailtrap adalah email testing service yang **tidak mengirim email ke real users**.

#### 1. Daftar di Mailtrap

1. Buka: https://mailtrap.io
2. Sign up (gratis)
3. Buat inbox baru
4. Copy credentials dari inbox

#### 2. Update `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@kanbanapp.test
MAIL_FROM_NAME="${APP_NAME}"
```

#### 3. Keuntungan Mailtrap

✅ Email tidak terkirim ke user real (safe untuk testing)
✅ Bisa cek HTML preview
✅ Gratis untuk testing
✅ Support spam analysis

---

### **Option 3: Mailgun (Production)**

#### 1. Setup Mailgun

1. Daftar: https://www.mailgun.com
2. Verify domain
3. Copy API credentials

#### 2. Install Mailgun Package

```bash
composer require mailgun/mailgun-php symfony/http-client
```

#### 3. Update `.env`

```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=your-domain.com
MAILGUN_SECRET=your-mailgun-api-key
MAILGUN_ENDPOINT=api.mailgun.net

MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

### **Option 4: AWS SES (Production)**

#### 1. Setup AWS SES

1. Login AWS Console
2. Navigate to SES
3. Verify email/domain
4. Create SMTP credentials

#### 2. Update `.env`

```env
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1

MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 🚀 Testing Email Invitation

### 1. Run Migration

```bash
php artisan migrate
```

Output yang diharapkan:
```
Migrating: 2025_10_18_000010_create_invitations_table
Migrated:  2025_10_18_000010_create_invitations_table
```

### 2. Start Application

```bash
npm run dev       # Terminal 1
# Herd already running (no need php artisan serve)
```

### 3. Test Invite Flow

#### A. Invite User Baru

1. Login ke aplikasi
2. Buka board
3. Click "Invite" button
4. Masukkan email: `newuser@example.com`
5. Select role: Member/Admin
6. Click "Send Invitation"

**Expected Result:**
- ✅ Toast notification: "Invitation sent successfully"
- ✅ Email terkirim ke inbox (cek Mailtrap jika pakai Mailtrap)

#### B. Check Email

Email akan berisi:
- Board title & description
- Inviter name
- Accept invitation button
- Expiry date (7 days from now)

#### C. Accept Invitation (New User)

1. Click link di email: `http://your-app.test/invitations/{token}`
2. Form register akan muncul
3. Isi nama & password
4. Click "Create Account & Accept Invitation"
5. Auto-login dan redirect ke board

#### D. Accept Invitation (Existing User)

1. Click link di email
2. System detect user exists
3. Click "Log In & Accept Invitation"
4. Login dan auto-join board

---

## 📧 Email Template Customization

### Location

Email template: `resources/views/emails/board-invitation.blade.php`

### Customize Content

```blade
<x-mail::message>
# You're Invited!

{{ $inviterName }} invited you to join {{ $boardTitle }}.

<!-- Add custom message here -->
<x-mail::button :url="$acceptUrl">
Accept Invitation
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
```

### Test Changes

```bash
php artisan view:clear
```

---

## 🔄 Queue Configuration (Optional - Recommended)

Untuk mengirim email secara asynchronous (tidak blocking):

### 1. Update `.env`

```env
QUEUE_CONNECTION=database
```

### 2. Create Jobs Table

```bash
php artisan queue:table
php artisan migrate
```

### 3. Update BoardController

```php
// In inviteMember method, change:
Mail::to($request->email)->send(new BoardInvitation($invitation));

// To:
Mail::to($request->email)->queue(new BoardInvitation($invitation));
```

### 4. Run Queue Worker

```bash
php artisan queue:work
```

---

## 🛠️ Troubleshooting

### ❌ Email tidak terkirim

**Check:**
1. SMTP credentials benar?
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

2. Port tidak blocked?
   ```bash
   telnet smtp.gmail.com 587
   ```

3. Check logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```

### ❌ "Connection refused"

**Solution:**
- Check firewall/antivirus
- Try port 465 (SSL) instead of 587 (TLS)
- Update `.env`:
  ```env
  MAIL_PORT=465
  MAIL_ENCRYPTION=ssl
  ```

### ❌ "Authentication failed"

**Solution:**
- Verify username/password
- Gmail: pastikan App Password sudah benar
- Enable "Less secure apps" (Gmail lama)

### ❌ Email masuk spam

**Solution:**
- Setup SPF/DKIM records (production)
- Use verified domain
- Warm up email (send gradually)

---

## 📊 Database Structure

### Invitations Table

```sql
CREATE TABLE invitations (
    id BIGINT PRIMARY KEY,
    board_id BIGINT,
    inviter_id BIGINT,
    email VARCHAR(255),
    token VARCHAR(255) UNIQUE,
    role ENUM('admin', 'member'),
    status ENUM('pending', 'accepted', 'expired'),
    expires_at TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Check Pending Invitations

```sql
SELECT * FROM invitations WHERE status = 'pending';
```

---

## 🔐 Security Notes

### Token Security
- ✅ 64-character random token
- ✅ Unique per invitation
- ✅ 7-day expiry
- ✅ One-time use

### Email Validation
- ✅ Valid email format required
- ✅ Check duplicate invitations
- ✅ Check existing members

### Rate Limiting (Recommended)

Add to `app/Http/Controllers/Api/BoardController.php`:

```php
use Illuminate\Support\Facades\RateLimiter;

public function inviteMember(Request $request, Board $board)
{
    $key = 'invite-board-' . $board->id . '-user-' . $request->user()->id;

    if (RateLimiter::tooManyAttempts($key, 5)) {
        return response()->json([
            'message' => 'Too many invitations. Please try again later.'
        ], 429);
    }

    RateLimiter::hit($key, 3600); // 5 invites per hour

    // ... rest of code
}
```

---

## 📈 Monitoring

### Email Logs

```bash
# Watch email logs
tail -f storage/logs/laravel.log | grep "Mail"
```

### Invitation Statistics

```sql
-- Total invitations
SELECT COUNT(*) FROM invitations;

-- Accepted vs Pending
SELECT status, COUNT(*)
FROM invitations
GROUP BY status;

-- Expired invitations
SELECT COUNT(*)
FROM invitations
WHERE expires_at < NOW() AND status = 'pending';
```

---

## 🎨 Email Preview

### Preview in Browser (Development)

1. Create test route in `routes/web.php`:

```php
Route::get('/test-email', function() {
    $invitation = \App\Models\Invitation::first();
    return new \App\Mail\BoardInvitation($invitation);
});
```

2. Visit: `http://your-app.test/test-email`

---

## ✅ Checklist Setup

- [ ] Migration `invitations` table sudah di-run
- [ ] Email credentials sudah di-set di `.env`
- [ ] Test email berhasil
- [ ] Invitation link berfungsi
- [ ] New user bisa register via invitation
- [ ] Existing user bisa accept invitation
- [ ] Email template sesuai branding
- [ ] Queue setup (optional)
- [ ] Rate limiting (optional)

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `database/migrations/2025_10_18_000010_create_invitations_table.php` | Invitations table |
| `app/Models/Invitation.php` | Invitation model |
| `app/Mail/BoardInvitation.php` | Email mailable |
| `resources/views/emails/board-invitation.blade.php` | Email template |
| `app/Http/Controllers/InvitationController.php` | Accept logic |
| `app/Http/Controllers/Api/BoardController.php` | Invite logic |
| `resources/js/pages/invitations/accept.tsx` | Accept page |
| `resources/js/pages/invitations/expired.tsx` | Expired page |

---

## 🚀 Quick Start (TL;DR)

### For Testing (Mailtrap)

```bash
# 1. Setup Mailtrap account and get credentials

# 2. Update .env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password

# 3. Run migration
php artisan migrate

# 4. Clear cache
php artisan config:clear

# 5. Test invite!
```

### For Production (Gmail)

```bash
# 1. Generate App Password from Google

# 2. Update .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password

# 3. Run migration
php artisan migrate

# 4. Clear cache
php artisan config:clear
```

---

**Happy Inviting! 📧🎉**

For questions: Check `storage/logs/laravel.log`
