# Frontend Structure Documentation

Dokumentasi struktur frontend yang telah diorganisir untuk memudahkan pengembangan dan maintenance.

## Struktur Direktori

```
resources/js/
├── actions/                    # Laravel route actions (auto-generated)
├── components/                 # Komponen React
│   ├── shared/                # Komponen bersama (shared components)
│   │   ├── auth/             # Komponen autentikasi
│   │   │   ├── delete-user.tsx
│   │   │   ├── two-factor-recovery-codes.tsx
│   │   │   ├── two-factor-setup-modal.tsx
│   │   │   └── index.ts
│   │   ├── common/           # Komponen umum
│   │   │   ├── app-logo.tsx
│   │   │   ├── app-logo-icon.tsx
│   │   │   ├── appearance-dropdown.tsx
│   │   │   ├── appearance-tabs.tsx
│   │   │   ├── heading.tsx
│   │   │   ├── heading-small.tsx
│   │   │   ├── icon.tsx
│   │   │   ├── text-link.tsx
│   │   │   ├── user-info.tsx
│   │   │   ├── user-menu-content.tsx
│   │   │   └── index.ts
│   │   ├── form/             # Komponen form
│   │   │   ├── alert-error.tsx
│   │   │   ├── input-error.tsx
│   │   │   └── index.ts
│   │   ├── layout/           # Komponen layout
│   │   │   ├── app-content.tsx
│   │   │   ├── app-header.tsx
│   │   │   ├── app-shell.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── app-sidebar-header.tsx
│   │   │   └── index.ts
│   │   ├── navigation/       # Komponen navigasi
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── nav-footer.tsx
│   │   │   ├── nav-main.tsx
│   │   │   ├── nav-user.tsx
│   │   │   └── index.ts
│   │   └── index.ts         # Export semua shared components
│   └── ui/                   # UI primitives (shadcn/ui)
│       ├── alert.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── ... (komponen UI lainnya)
├── features/                  # Feature-based modules
│   └── boards/               # Fitur board/kanban
│       ├── components/       # Komponen spesifik board
│       │   ├── BoardHeader.tsx
│       │   ├── CardDetailModal.tsx
│       │   ├── ImagePreviewModal.tsx
│       │   ├── KanbanBoard.tsx
│       │   ├── KanbanCard.tsx
│       │   ├── KanbanList.tsx
│       │   └── index.ts
│       ├── hooks/            # Custom hooks untuk board
│       │   ├── useCardModal.ts
│       │   ├── useImagePreview.ts
│       │   └── index.ts
│       ├── types/            # TypeScript types (jika diperlukan)
│       └── index.ts          # Export semua board modules
├── hooks/                     # Global custom hooks
│   ├── use-appearance.tsx
│   ├── use-clipboard.ts
│   ├── use-initials.tsx
│   ├── use-mobile.tsx
│   ├── use-mobile-navigation.ts
│   └── use-two-factor-auth.ts
├── layouts/                   # Layout components
│   ├── app/
│   ├── auth/
│   ├── settings/
│   ├── app-layout.tsx
│   └── auth-layout.tsx
├── lib/                       # Utilities & configurations
│   ├── axios.ts
│   ├── store.ts
│   ├── utils.ts
│   └── ...
├── pages/                     # Page components (Inertia.js)
│   ├── auth/
│   ├── boards/
│   │   ├── index.tsx         # List boards
│   │   └── show.tsx          # Board detail
│   ├── invitations/
│   ├── settings/
│   ├── dashboard.tsx
│   ├── profile.tsx
│   └── welcome.tsx
├── routes/                    # Route definitions (Ziggy)
├── types/                     # Global TypeScript types
│   ├── index.d.ts
│   └── vite-env.d.ts
├── app.tsx                    # Main app component
├── ssr.tsx                    # SSR entry point
└── README.md                  # Dokumentasi ini

```

## Prinsip Organisasi

### 1. **Feature-Based Organization** (`features/`)
Modul fitur yang lengkap dengan komponen, hooks, dan types-nya sendiri.

**Contoh: boards feature**
```typescript
// Import dari feature boards
import {
  KanbanBoard,
  BoardHeader,
  useCardModal,
  useImagePreview
} from '@/features/boards'
```

**Keuntungan:**
- Mudah menemukan semua kode terkait satu fitur
- Komponen dan logic terisolasi per fitur
- Mudah untuk refactoring atau menghapus fitur
- Mendukung pengembangan modular

### 2. **Shared Components** (`components/shared/`)
Komponen yang digunakan di berbagai bagian aplikasi, diorganisir berdasarkan kategori.

**Kategori:**
- `auth/` - Komponen autentikasi (2FA, delete account, dll)
- `common/` - Komponen umum (logo, heading, user info, dll)
- `form/` - Komponen form (error handling, validation, dll)
- `layout/` - Komponen layout (header, sidebar, shell, dll)
- `navigation/` - Komponen navigasi (breadcrumbs, nav items, dll)

**Contoh:**
```typescript
// Import shared components
import { AppHeader, AppSidebar } from '@/components/shared/layout'
import { InputError, AlertError } from '@/components/shared/form'
import { Breadcrumbs, NavMain } from '@/components/shared/navigation'
```

### 3. **UI Primitives** (`components/ui/`)
Komponen UI dasar dari shadcn/ui atau library UI lainnya.

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
```

### 4. **Pages** (`pages/`)
Komponen halaman untuk Inertia.js routing. Setiap page harus minimal dan fokus pada orchestration, bukan logic.

**Best Practice:**
- Gunakan custom hooks untuk complex logic
- Import dari features untuk fitur-specific components
- Keep pages simple dan readable

**Contoh:**
```typescript
// pages/boards/show.tsx
import { KanbanBoard, useCardModal } from '@/features/boards'

export default function BoardShow({ board }: BoardShowProps) {
  const cardModal = useCardModal()

  return (
    <AppLayout>
      <KanbanBoard
        board={board}
        onCardClick={cardModal.handleCardClick}
      />
    </AppLayout>
  )
}
```

## Best Practices

### Import Patterns

#### ✅ DO: Gunakan barrel exports (index.ts)
```typescript
// Good
import { KanbanBoard, useCardModal } from '@/features/boards'
import { AppHeader, AppSidebar } from '@/components/shared/layout'
```

#### ❌ DON'T: Import langsung dari file
```typescript
// Avoid
import { KanbanBoard } from '@/features/boards/components/KanbanBoard'
import { AppHeader } from '@/components/shared/layout/app-header'
```

### Component Organization

#### Feature Components
Jika komponen hanya digunakan dalam satu fitur, letakkan di `features/{feature-name}/components/`

```typescript
// features/boards/components/KanbanCard.tsx
export function KanbanCard({ card }: KanbanCardProps) {
  // Component implementation
}
```

#### Shared Components
Jika komponen digunakan di berbagai fitur, letakkan di `components/shared/{category}/`

```typescript
// components/shared/form/InputError.tsx
export default function InputError({ message }: InputErrorProps) {
  // Component implementation
}
```

### Custom Hooks

#### Feature-specific Hooks
Letakkan di `features/{feature-name}/hooks/`

```typescript
// features/boards/hooks/useCardModal.ts
export function useCardModal() {
  // Hook implementation
  return {
    selectedCard,
    handleCardClick,
    handleCloseModal,
    // ...
  }
}
```

#### Global Hooks
Letakkan di `hooks/`

```typescript
// hooks/use-mobile.ts
export function useMobile() {
  // Hook implementation
}
```

## Migration Guide

Jika Anda perlu mengupdate import setelah reorganisasi:

### Komponen Kanban
```typescript
// Before
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { BoardHeader } from '@/components/board-header'

// After
import { KanbanBoard, BoardHeader } from '@/features/boards'
```

### Shared Components
```typescript
// Before
import AppHeader from '@/components/app-header'
import { InputError } from '@/components/input-error'

// After
import { AppHeader } from '@/components/shared/layout'
import { InputError } from '@/components/shared/form'
```

## Menambah Fitur Baru

1. Buat folder di `features/{feature-name}/`
2. Buat subfolder: `components/`, `hooks/`, `types/` (jika diperlukan)
3. Buat barrel export `index.ts` di setiap subfolder
4. Buat main barrel export di `features/{feature-name}/index.ts`

**Contoh struktur fitur baru:**
```
features/
└── notifications/
    ├── components/
    │   ├── NotificationBell.tsx
    │   ├── NotificationList.tsx
    │   └── index.ts
    ├── hooks/
    │   ├── useNotifications.ts
    │   └── index.ts
    ├── types/
    │   └── index.ts
    └── index.ts
```

## Testing & Maintenance

### Keuntungan Struktur Ini:
1. **Easy to Navigate** - Setiap fitur dan kategori komponen jelas terpisah
2. **Easy to Test** - Komponen terisolasi dengan dependencies yang jelas
3. **Easy to Refactor** - Perubahan pada satu fitur tidak mempengaruhi yang lain
4. **Easy to Scale** - Menambah fitur baru tanpa mengganggu yang ada
5. **Easy to Trace** - Import paths yang clear menunjukkan dependency flow

### Code Search Tips:
- Cari komponen board: `features/boards/components/`
- Cari shared components: `components/shared/{category}/`
- Cari hooks: `features/{feature}/hooks/` atau `hooks/`
- Cari pages: `pages/{section}/`

## Questions?

Jika ada pertanyaan tentang struktur ini atau butuh bantuan reorganisasi, silakan tanyakan!
