# Kanban Board Application

Aplikasi management task berbasis Kanban (seperti Trello) yang dibangun dengan Laravel, React (Inertia.js), MySQL, Tailwind CSS, shadcn/ui, dan Framer Motion.

## 🚀 Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 dengan Inertia.js 2.0
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI)
- **Animations**: Framer Motion
- **Drag & Drop**: @hello-pangea/dnd
- **State Management**: Zustand
- **Database**: MySQL
- **Authentication**: Bearer Token (Custom API Token)

## ✨ Fitur Utama

### MVP Features
- ✅ Autentikasi dengan Bearer Token
- ✅ Dashboard dengan daftar boards
- ✅ **Sidebar Navigation** dengan menu Board, Settings, dan Profile
- ✅ **Board Header** dengan invite member & board actions
- ✅ Membuat, edit, dan hapus boards
- ✅ Membuat, edit, dan hapus lists (kolom)
- ✅ Membuat, edit, dan hapus cards (tugas)
- ✅ Drag & drop cards antar lists
- ✅ Drag & drop lists (reorder)
- ✅ Detail card dengan modal
- ✅ Komentar pada cards
- ✅ Members assignment pada cards
- ✅ Labels untuk cards
- ✅ Due dates untuk cards
- ✅ Mark cards as completed
- ✅ Board visibility (private/team/public)
- ✅ **Email invitation system** untuk invite members (user baru & existing)
- ✅ Invite members ke board dengan email
- ✅ **Profile management** (update name, email, password)
- ✅ Activity logging
- ✅ Real-time animations dengan Framer Motion

## 📋 Prerequisites

- PHP 8.2 atau lebih tinggi
- Composer
- Node.js 18+ dan npm
- MySQL 8.0+
- Laravel Herd (optional, untuk development)

## 🛠️ Installation

### 1. Clone Repository

```bash
cd /path/to/your/project
```

### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install
```

### 3. Environment Setup

Konfigurasi file `.env`:

```env
APP_NAME="Kanban Board"
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanban_app
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Create Database

Buat database MySQL:

```bash
mysql -u root -p
CREATE DATABASE kanban_app;
EXIT;
```

### 6. Run Migrations

```bash
php artisan migrate
```

### 7. Build Frontend Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Start Development Server

```bash
php artisan serve
```

Aplikasi akan berjalan di `http://localhost:8000`

## 📁 Struktur Project

```
kanban-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── AuthController.php       # API Authentication
│   │   │   │   ├── BoardController.php      # Board API endpoints
│   │   │   │   ├── ListController.php       # List API endpoints
│   │   │   │   └── CardController.php       # Card API endpoints
│   │   │   └── BoardController.php          # Inertia Board pages
│   │   └── Middleware/
│   │       └── AuthenticateWithBearerToken.php
│   └── Models/
│       ├── User.php
│       ├── Board.php
│       ├── BoardList.php
│       ├── Card.php
│       ├── Label.php
│       ├── Comment.php
│       └── ActivityLog.php
├── database/
│   └── migrations/
│       ├── 2025_10_18_000001_create_boards_table.php
│       ├── 2025_10_18_000002_create_board_members_table.php
│       ├── 2025_10_18_000003_create_lists_table.php
│       ├── 2025_10_18_000004_create_cards_table.php
│       ├── 2025_10_18_000005_create_labels_table.php
│       ├── 2025_10_18_000006_create_card_members_table.php
│       ├── 2025_10_18_000007_create_comments_table.php
│       ├── 2025_10_18_000008_create_activity_logs_table.php
│       └── 2025_10_18_000009_add_api_token_to_users_table.php
├── resources/
│   └── js/
│       ├── components/
│       │   ├── kanban/
│       │   │   ├── KanbanBoard.tsx
│       │   │   ├── KanbanList.tsx
│       │   │   └── KanbanCard.tsx
│       │   └── ui/                          # shadcn/ui components
│       ├── lib/
│       │   ├── axios.ts                     # API client setup
│       │   ├── store.ts                     # Zustand store
│       │   └── utils.ts
│       ├── pages/
│       │   ├── boards/
│       │   │   ├── index.tsx                # Boards list page
│       │   │   └── show.tsx                 # Board detail page
│       │   └── auth/                        # Authentication pages
│       └── app.tsx
└── routes/
    ├── web.php                              # Inertia routes
    └── api.php                              # API routes
```

## 🔐 Authentication Flow

Aplikasi ini menggunakan Bearer Token authentication untuk API:

### 1. Register User

**API Endpoint**: `POST /api/auth/register`

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

**Response**:
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "access_token": "your-bearer-token",
  "token_type": "Bearer"
}
```

### 2. Login

**API Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Menggunakan Bearer Token

Setelah mendapat token, gunakan di semua request API:

```bash
curl -X GET http://localhost:8000/api/boards \
  -H "Authorization: Bearer your-bearer-token"
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)
- `POST /api/auth/refresh` - Refresh token (requires auth)

### Boards
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create new board
- `GET /api/boards/{id}` - Get board detail
- `PATCH /api/boards/{id}` - Update board
- `DELETE /api/boards/{id}` - Delete board
- `POST /api/boards/{id}/invite` - Invite member to board
- `DELETE /api/boards/{id}/members/{userId}` - Remove member

### Lists
- `POST /api/boards/{boardId}/lists` - Create list
- `PATCH /api/lists/{id}` - Update list
- `DELETE /api/lists/{id}` - Delete list
- `PATCH /api/lists/{id}/move` - Move/reorder list

### Cards
- `POST /api/lists/{listId}/cards` - Create card
- `GET /api/cards/{id}` - Get card detail
- `PATCH /api/cards/{id}` - Update card
- `DELETE /api/cards/{id}` - Delete card
- `PATCH /api/cards/{id}/move` - Move card to another list
- `POST /api/cards/{id}/members/{userId}` - Toggle card member
- `POST /api/cards/{id}/comments` - Add comment to card

## 🎨 Features Detail

### Drag & Drop

Aplikasi menggunakan `@hello-pangea/dnd` untuk drag & drop functionality:

- Drag cards dalam satu list untuk reorder
- Drag cards antar lists untuk move
- Smooth animations dengan Framer Motion

### Board Management

- **Create Board**: Buat board baru dengan title, description, visibility, dan background color
- **Board Visibility**:
  - `private`: Hanya visible untuk owner dan invited members
  - `team`: Visible untuk team members
  - `public`: Visible untuk semua

### List Management

- Add unlimited lists ke board
- Reorder lists dengan drag & drop
- Edit list title inline
- Archive atau delete lists

### Card Management

- Create cards dengan title
- Edit card details:
  - Title
  - Description (rich text)
  - Due date
  - Status (completed/incomplete)
  - Cover color
  - Labels
  - Assigned members
- Add comments ke cards
- View full card detail di modal

### Activity Logging

Semua aktivitas di board dicatat:
- Card created/updated/deleted/moved
- List created/updated/deleted/moved
- Board updated
- Member invited
- Comments added

## 🎭 Framer Motion Animations

Aplikasi menggunakan Framer Motion untuk smooth animations:

- **Cards**: Fade in saat dibuat, scale on hover, rotate saat di-drag
- **Lists**: Slide in dari kanan
- **Modals**: Fade in/out transitions
- **Drag**: Smooth drag animations

## 🔧 Development

### Running Tests

```bash
php artisan test
```

### Code Formatting

```bash
# PHP
./vendor/bin/pint

# JavaScript/TypeScript
npm run format
npm run lint
```

### Build for Production

```bash
npm run build
php artisan optimize
```

## 📝 Database Schema

### Tables

1. **users** - User accounts
2. **boards** - Kanban boards
3. **board_members** - Board membership with roles
4. **lists** - Lists (columns) in boards
5. **cards** - Cards (tasks) in lists
6. **labels** - Labels for cards
7. **card_label** - Card-Label pivot
8. **card_members** - Card assignments
9. **comments** - Comments on cards
10. **activity_logs** - Activity tracking

## 🚀 Deployment

### Production Checklist

1. Set environment to production:
```env
APP_ENV=production
APP_DEBUG=false
```

2. Optimize Laravel:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. Build assets:
```bash
npm run build
```

4. Set proper permissions:
```bash
chmod -R 775 storage bootstrap/cache
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open-sourced software licensed under the MIT license.

## 👥 Credits

Built with:
- Laravel Framework
- React
- Inertia.js
- Tailwind CSS
- shadcn/ui
- Framer Motion
- @hello-pangea/dnd

---

**Happy Coding! 🎉**
