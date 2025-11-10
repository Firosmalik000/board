# Menu Navigation Guide - Kanban Board Application

## 📋 Overview

Aplikasi Kanban Board memiliki navigasi yang lengkap dan intuitif dengan sidebar menu yang dapat dikustomisasi.

---

## 🧭 Menu Structure

### **Main Navigation (Sidebar)**

#### 1. **Dashboard**
- **Icon**: LayoutGrid
- **Route**: `/dashboard`
- **Description**: Halaman overview untuk melihat ringkasan semua aktivitas
- **Access**: All authenticated users

#### 2. **Boards**
- **Icon**: Trello
- **Route**: `/boards`
- **Description**: Daftar semua boards yang Anda miliki atau menjadi member
- **Features**:
  - View all boards
  - Create new board
  - Quick access to boards
  - Filter by visibility (private/team/public)
- **Access**: All authenticated users

---

### **Footer Navigation (Sidebar Bottom)**

#### 3. **Settings**
- **Icon**: Settings
- **Route**: `/settings`
- **Description**: Pengaturan aplikasi
- **Features**:
  - Profile settings
  - Password management
  - Two-factor authentication
  - Appearance (dark/light mode)
- **Access**: All authenticated users

#### 4. **Profile**
- **Icon**: User
- **Route**: `/profile`
- **Description**: Halaman profil pengguna
- **Features**:
  - Update profile information (name, email)
  - Change password
  - View account statistics
  - Account creation date
- **Access**: All authenticated users

---

## 🎨 Board Header Menu

Ketika Anda membuka board detail (`/boards/{id}`), terdapat header khusus dengan menu:

### **Board Information**
- **Board color indicator**: Visual color tag
- **Board title**: Nama board
- **Board description**: Deskripsi singkat
- **Visibility badge**: Private/Team/Public status

### **Members Section**
- **Member avatars**: Menampilkan foto/initial member (max 5 visible)
- **+X indicator**: Jika member lebih dari 5
- **Invite button**: Undang member baru

### **Board Actions Menu** (⋮)
- **Add to Favorites**: (Coming soon) Tandai board sebagai favorit
- **Archive Board**: Arsipkan board
- **Delete Board**: Hapus board (owner only)

---

## 📱 Responsive Behavior

### Desktop (≥768px)
- Sidebar tetap visible
- Full menu labels ditampilkan
- Hover effects active

### Tablet & Mobile (<768px)
- Sidebar collapsible
- Icon-only mode
- Swipe gesture support

---

## 🎯 Menu Features

### **1. Sidebar Collapse**
Sidebar dapat di-collapse untuk memberikan lebih banyak ruang workspace:
- Click icon di header untuk toggle
- Auto-collapse di mobile devices
- State tersimpan di localStorage

### **2. Active State**
Menu yang sedang aktif akan memiliki:
- Background highlight
- Bold text
- Left border accent

### **3. Breadcrumbs**
Setiap halaman menampilkan breadcrumb navigation:
```
Dashboard > Boards > My Project Board
```

---

## 🔐 Access Control

### Public Routes (No Auth Required)
- `/` - Landing page
- `/login` - Login page
- `/register` - Register page

### Protected Routes (Auth Required)
- `/dashboard` - Dashboard
- `/boards` - Boards list
- `/boards/{id}` - Board detail
- `/profile` - Profile page
- `/settings` - Settings page
- `/settings/*` - Settings sub-pages

---

## 🚀 Navigation Usage

### **Quick Board Access**

1. **From Dashboard**:
   - Click "Boards" in sidebar
   - View all your boards
   - Click any board card to open

2. **From Boards List**:
   - Click board card
   - Board detail akan terbuka dengan Kanban view

3. **Direct URL**:
   - Bookmark board: `/boards/{id}`
   - Share dengan team members

### **Profile Management**

1. **Update Profile**:
   - Click "Profile" in sidebar
   - Edit name or email
   - Click "Update Profile"

2. **Change Password**:
   - Go to Profile page
   - Fill current & new password
   - Click "Update Password"

### **Settings Configuration**

1. **Appearance**:
   - Go to Settings
   - Click "Appearance"
   - Choose Dark/Light/System

2. **Security**:
   - Go to Settings > Password
   - Update password
   - Enable 2FA (if needed)

---

## 🎨 Customization

### **Adding New Menu Items**

Edit: `resources/js/components/app-sidebar.tsx`

```typescript
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Boards',
        href: '/boards',
        icon: Trello,
    },
    // Add your custom menu here
    {
        title: 'Your Menu',
        href: '/your-route',
        icon: YourIcon,
    },
];
```

### **Menu with Submenu** (Coming Soon)

Future enhancement untuk nested menu:

```typescript
const mainNavItems: NavItem[] = [
    {
        title: 'Boards',
        icon: Trello,
        items: [
            { title: 'All Boards', href: '/boards' },
            { title: 'Favorites', href: '/boards/favorites' },
            { title: 'Archived', href: '/boards/archived' },
        ],
    },
];
```

---

## 📊 User Menu (Avatar Dropdown)

Located at bottom of sidebar:

### Options:
1. **Profile** - Link to profile page
2. **Settings** - Link to settings
3. **Logout** - Sign out from application

### User Info Display:
- Avatar (with initials)
- User name
- User email

---

## 🔔 Notifications (Coming Soon)

Future enhancement:
- Notification bell icon di header
- Real-time notifications
- Activity feed
- Mark as read/unread

---

## 🎯 Keyboard Shortcuts (Coming Soon)

Future enhancement untuk quick navigation:

| Shortcut | Action |
|----------|--------|
| `G` + `D` | Go to Dashboard |
| `G` + `B` | Go to Boards |
| `G` + `P` | Go to Profile |
| `G` + `S` | Go to Settings |
| `/` | Focus search |
| `N` | New board |

---

## 🔍 Search Navigation (Coming Soon)

Quick search feature untuk navigate:
- Search boards by name
- Search cards by title
- Search members
- Global search shortcut: `/`

---

## 💡 Tips & Tricks

### **1. Quick Board Creation**
- Click "Create Board" dari Boards page
- Fill minimal info (title saja cukup)
- Hit Enter untuk quick create

### **2. Board Favorites**
- Star your frequently used boards
- Access dari "Favorites" section
- Quick filter di boards list

### **3. Recent Boards**
- Last 5 accessed boards
- Shown di dashboard
- One-click access

### **4. Keyboard Navigation**
- Tab untuk navigate menu
- Enter untuk select
- Esc untuk close dialogs

---

## 🎨 Visual Indicators

### **Menu States**

1. **Active**:
   - Bold text
   - Blue accent
   - Background highlight

2. **Hover**:
   - Light background
   - Cursor pointer
   - Smooth transition

3. **Disabled**:
   - Gray text
   - No hover effect
   - Tooltip explanation

### **Board Visibility Icons**

- 🔒 **Lock**: Private board
- 👥 **Users**: Team board
- 🌐 **Globe**: Public board

---

## 📱 Mobile Navigation

### **Mobile Menu**
- Hamburger button (☰) untuk open sidebar
- Overlay sidebar
- Touch-friendly tap targets
- Swipe to close

### **Bottom Navigation** (Optional Future Enhancement)
- Quick access buttons
- Floating action button (FAB)
- Mobile-optimized layout

---

## 🔧 Troubleshooting

### Menu tidak muncul?
1. Clear browser cache
2. Refresh page (Ctrl+R)
3. Check authentication status
4. Verify route permissions

### Sidebar tidak collapse?
1. Check localStorage settings
2. Clear site data
3. Try different browser
4. Report bug

### Navigation slow?
1. Check network connection
2. Clear browser cache
3. Disable extensions
4. Check server status

---

## 📚 Related Documentation

- [README.md](README.md) - Main documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup instructions
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

---

## ✨ Menu Summary

| Menu | Route | Icon | Features |
|------|-------|------|----------|
| Dashboard | `/dashboard` | LayoutGrid | Overview, stats |
| Boards | `/boards` | Trello | List, create, manage |
| Settings | `/settings` | Settings | App config |
| Profile | `/profile` | User | User info, password |

---

**Last Updated**: 2025-10-18
**Version**: 1.1.0

**Happy Navigating! 🎉**
