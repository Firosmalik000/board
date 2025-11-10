# Panduan Setup Lengkap - Kanban Board Application

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Testing the Application](#testing-the-application)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Development Workflow](#development-workflow)

---

## Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:

### Required Software

1. **PHP 8.2 atau lebih tinggi**
   ```bash
   php -v
   ```

2. **Composer** (PHP Dependency Manager)
   ```bash
   composer --version
   ```

3. **Node.js 18+ dan npm**
   ```bash
   node -v
   npm -v
   ```

4. **MySQL 8.0+**
   ```bash
   mysql --version
   ```

5. **Git** (untuk version control)
   ```bash
   git --version
   ```

### Optional (Recommended)

- **Laravel Herd** - Local development environment untuk macOS/Windows
- **VS Code** atau IDE lainnya
- **Postman** atau **Insomnia** - untuk testing API

---

## Installation Steps

### Step 1: Setup Project

Jika Anda sudah berada di direktori project:

```bash
cd C:\Users\XBOSS\Herd\template-test
```

### Step 2: Install PHP Dependencies

```bash
composer install
```

Output yang diharapkan:
```
Installing dependencies from lock file
...
Package operations: XX installs, 0 updates, 0 removals
```

### Step 3: Install JavaScript Dependencies

```bash
npm install
```

Output yang diharapkan:
```
added XXX packages in XX.XXs
```

### Step 4: Environment Configuration

File `.env` sudah ada. Pastikan konfigurasi database sudah benar:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanban_app
DB_USERNAME=root
DB_PASSWORD=
```

**Catatan**: Sesuaikan `DB_PASSWORD` dengan password MySQL Anda.

### Step 5: Generate Application Key

```bash
php artisan key:generate
```

Output:
```
Application key set successfully.
```

---

## Database Setup

### Option 1: MySQL via Command Line

1. **Login ke MySQL**:
```bash
mysql -u root -p
```

2. **Buat Database**:
```sql
CREATE DATABASE kanban_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Verifikasi**:
```sql
SHOW DATABASES;
USE kanban_app;
```

4. **Exit**:
```sql
EXIT;
```

### Option 2: MySQL via phpMyAdmin

1. Buka phpMyAdmin di browser
2. Click "New" di sidebar kiri
3. Nama database: `kanban_app`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

### Run Migrations

Setelah database dibuat, jalankan migrations:

```bash
php artisan migrate
```

Output yang diharapkan:
```
Migration table created successfully.
Migrating: 0001_01_01_000000_create_users_table
Migrated:  0001_01_01_000000_create_users_table (XX.XXms)
Migrating: 2025_10_18_000001_create_boards_table
Migrated:  2025_10_18_000001_create_boards_table (XX.XXms)
...
```

Jika berhasil, Anda akan melihat 12+ migrations dijalankan.

### Verify Migrations

Cek apakah tables sudah dibuat:

```sql
mysql -u root -p kanban_app -e "SHOW TABLES;"
```

Output yang diharapkan:
```
+-------------------------+
| Tables_in_kanban_app    |
+-------------------------+
| activity_logs           |
| board_members           |
| boards                  |
| cache                   |
| cache_locks             |
| card_label              |
| card_members            |
| cards                   |
| comments                |
| failed_jobs             |
| job_batches             |
| jobs                    |
| labels                  |
| lists                   |
| migrations              |
| password_reset_tokens   |
| sessions                |
| users                   |
+-------------------------+
```

---

## Configuration

### Frontend Build

#### Development Mode

Untuk development dengan hot-reload:

```bash
npm run dev
```

Output:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Jangan tutup terminal ini!** Vite akan watch file changes.

#### Production Build

Untuk production:

```bash
npm run build
```

### Start Laravel Server

Di terminal baru (jika menggunakan npm run dev):

```bash
php artisan serve
```

Output:
```
Starting Laravel development server: http://127.0.0.1:8000
```

Atau jika menggunakan Laravel Herd, aplikasi otomatis tersedia di:
```
http://template-test.test
```

---

## Testing the Application

### 1. Access the Application

Buka browser dan akses:
- Via artisan serve: `http://localhost:8000`
- Via Herd: `http://template-test.test`

### 2. Register User

1. Click "Register" atau akses `/register`
2. Isi form:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
3. Click "Register"

### 3. Test API (Optional)

#### Register via API

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

Simpan `access_token` dari response.

#### Get User Info

```bash
curl -X GET http://localhost:8000/api/auth/user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

#### Create Board

```bash
curl -X POST http://localhost:8000/api/boards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Board",
    "description": "Test board",
    "visibility": "private",
    "background_color": "#0079bf"
  }'
```

### 4. Test Web Interface

1. **Create Board**:
   - Go to `/boards`
   - Click "Create Board"
   - Isi title: "Project Management"
   - Click "Create Board"

2. **Create List**:
   - Di board page, click "Add another list"
   - Isi title: "To Do"
   - Click "Add List"
   - Ulangi untuk "In Progress" dan "Done"

3. **Create Cards**:
   - Di list "To Do", click "Add a card"
   - Isi title: "Setup project"
   - Click "Add Card"
   - Buat beberapa cards lagi

4. **Test Drag & Drop**:
   - Drag card dari "To Do" ke "In Progress"
   - Card harus berpindah dengan smooth animation

5. **Card Detail**:
   - Click pada card
   - Modal akan terbuka
   - Test fitur:
     - Edit description
     - Set due date
     - Mark as completed
     - Add comment
     - Change cover color

---

## Common Issues & Solutions

### Issue 1: Migration Failed

**Error**: `SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'`

**Solution**:
1. Cek MySQL credentials di `.env`
2. Pastikan MySQL service running:
   ```bash
   # Windows
   net start mysql

   # macOS/Linux
   sudo systemctl start mysql
   ```

### Issue 2: Vite Not Found

**Error**: `sh: vite: command not found`

**Solution**:
```bash
npm install
npm run dev
```

### Issue 3: Permission Denied

**Error**: `The stream or file "storage/logs/laravel.log" could not be opened`

**Solution**:
```bash
# macOS/Linux
chmod -R 775 storage bootstrap/cache

# Windows (run as Administrator)
icacls storage /grant Users:F /t
icacls bootstrap\cache /grant Users:F /t
```

### Issue 4: Class Not Found

**Error**: `Class 'App\Models\Board' not found`

**Solution**:
```bash
composer dump-autoload
```

### Issue 5: CORS Error (untuk API)

Jika menggunakan API dari frontend terpisah, tambahkan ke `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:3000'],
```

### Issue 6: npm run dev shows blank page

**Solution**:
1. Clear cache:
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan view:clear
   ```
2. Rebuild:
   ```bash
   npm run build
   ```

---

## Development Workflow

### Daily Development

1. **Start development servers**:
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   php artisan serve
   ```

2. **Make changes** to code

3. **Test** in browser (auto-reload dengan Vite)

### Before Committing

1. **Format code**:
   ```bash
   # PHP
   ./vendor/bin/pint

   # JavaScript
   npm run format
   ```

2. **Run linter**:
   ```bash
   npm run lint
   ```

3. **Run tests**:
   ```bash
   php artisan test
   ```

### Database Seeding (Optional)

Buat seeder untuk sample data:

```bash
php artisan make:seeder BoardSeeder
```

Edit `database/seeders/BoardSeeder.php`:

```php
use App\Models\User;
use App\Models\Board;
use App\Models\BoardList;
use App\Models\Card;

public function run()
{
    $user = User::first();

    $board = Board::create([
        'title' => 'Sample Project',
        'description' => 'Sample board with data',
        'owner_id' => $user->id,
    ]);

    $board->members()->attach($user->id, ['role' => 'owner']);

    $list = BoardList::create([
        'board_id' => $board->id,
        'title' => 'To Do',
        'position' => 0,
    ]);

    Card::create([
        'list_id' => $list->id,
        'title' => 'Sample Task',
        'created_by' => $user->id,
        'position' => 0,
    ]);
}
```

Run seeder:
```bash
php artisan db:seed --class=BoardSeeder
```

---

## Next Steps

Setelah aplikasi berjalan:

1. **Explore Features**: Coba semua fitur di aplikasi
2. **Read Documentation**: Baca README.md untuk detail API
3. **Customize**: Sesuaikan dengan kebutuhan project Anda
4. **Deploy**: Ikuti panduan deployment di README.md

---

## Support

Jika menemui masalah:

1. Check error logs: `storage/logs/laravel.log`
2. Check browser console untuk frontend errors
3. Check network tab untuk API errors
4. Refer to Laravel docs: https://laravel.com/docs
5. Refer to Inertia docs: https://inertiajs.com

---

**Selamat! Aplikasi Kanban Board Anda siap digunakan! 🎉**
