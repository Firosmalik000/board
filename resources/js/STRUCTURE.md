# Frontend Structure - Quick Reference

## 📁 Struktur Folder

```
resources/js/
│
├── 🎯 features/                    # Feature Modules (Feature-based architecture)
│   └── boards/                     # Board/Kanban feature
│       ├── components/             # Board-specific components
│       │   ├── KanbanBoard.tsx    # Main kanban board
│       │   ├── KanbanList.tsx     # Kanban list column
│       │   ├── KanbanCard.tsx     # Kanban card item
│       │   ├── BoardHeader.tsx    # Board header with actions
│       │   ├── CardDetailModal.tsx # Card detail modal
│       │   ├── ImagePreviewModal.tsx # Image preview modal
│       │   └── index.ts           # Barrel export
│       ├── hooks/                  # Board-specific hooks
│       │   ├── useCardModal.ts    # Card modal state & logic
│       │   ├── useImagePreview.ts # Image preview state & logic
│       │   └── index.ts           # Barrel export
│       └── index.ts               # Main feature export
│
├── 🧩 components/
│   ├── shared/                     # Shared Components (Category-based)
│   │   ├── layout/                # Layout components
│   │   │   ├── app-header.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── app-shell.tsx
│   │   │   ├── app-content.tsx
│   │   │   └── index.ts
│   │   ├── navigation/            # Navigation components
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── nav-main.tsx
│   │   │   ├── nav-user.tsx
│   │   │   ├── nav-footer.tsx
│   │   │   └── index.ts
│   │   ├── form/                  # Form components
│   │   │   ├── input-error.tsx
│   │   │   ├── alert-error.tsx
│   │   │   └── index.ts
│   │   ├── common/                # Common components
│   │   │   ├── app-logo.tsx
│   │   │   ├── heading.tsx
│   │   │   ├── user-info.tsx
│   │   │   ├── appearance-dropdown.tsx
│   │   │   └── index.ts
│   │   ├── auth/                  # Auth components
│   │   │   ├── two-factor-setup-modal.tsx
│   │   │   ├── delete-user.tsx
│   │   │   └── index.ts
│   │   └── index.ts               # Main shared export
│   └── ui/                         # UI Primitives (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── 📄 pages/                       # Page Components (Inertia.js)
│   ├── boards/
│   │   ├── index.tsx              # Boards list page
│   │   └── show.tsx               # Board detail page
│   ├── auth/
│   ├── settings/
│   └── ...
│
├── 🎣 hooks/                       # Global Custom Hooks
│   ├── use-mobile.tsx
│   ├── use-appearance.tsx
│   └── ...
│
├── 📐 layouts/                     # Layout Components
│   ├── app-layout.tsx
│   ├── auth-layout.tsx
│   └── ...
│
├── 🛠️ lib/                         # Utilities & Config
│   ├── axios.ts
│   ├── store.ts
│   ├── utils.ts
│   └── ...
│
└── 📝 types/                       # TypeScript Types
    └── index.d.ts

```

## 🎯 Import Patterns

### Feature Modules

```typescript
// ✅ DO: Import dari feature barrel
import {
    KanbanBoard,
    BoardHeader,
    useCardModal,
    useImagePreview,
} from '@/features/boards';

// ❌ DON'T: Import langsung dari file
import { KanbanBoard } from '@/features/boards/components/KanbanBoard';
```

### Shared Components

```typescript
// ✅ Layout Components
import { AppHeader, AppSidebar } from '@/components/shared/layout';

// ✅ Navigation Components
import { Breadcrumbs, NavMain } from '@/components/shared/navigation';

// ✅ Form Components
import { InputError, AlertError } from '@/components/shared/form';

// ✅ Common Components
import { AppLogo, Heading, UserInfo } from '@/components/shared/common';

// ✅ Auth Components
import { TwoFactorSetupModal, DeleteUser } from '@/components/shared/auth';
```

### UI Components

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
```

## 🗂️ Kapan Meletakkan Komponen Dimana?

### ➡️ Letakkan di `features/{feature}/components/`

- Komponen **hanya digunakan dalam 1 fitur**
- Memiliki business logic spesifik untuk fitur tersebut
- Contoh: `KanbanCard`, `BoardHeader`

### ➡️ Letakkan di `components/shared/{category}/`

- Komponen **digunakan di berbagai fitur/halaman**
- Tidak memiliki business logic spesifik
- Contoh: `AppHeader`, `Breadcrumbs`, `InputError`

### ➡️ Letakkan di `components/ui/`

- Komponen UI primitif dari library (shadcn/ui)
- Pure presentational components
- Contoh: `Button`, `Card`, `Dialog`

## 🎣 Custom Hooks

### ➡️ Feature-specific hooks → `features/{feature}/hooks/`

```typescript
// features/boards/hooks/useCardModal.ts
export function useCardModal() {
    // Logic spesifik untuk card modal
}
```

### ➡️ Global hooks → `hooks/`

```typescript
// hooks/use-mobile.tsx
export function useMobile() {
    // Logic global untuk detect mobile
}
```

## 📦 Barrel Exports (index.ts)

Setiap folder harus memiliki `index.ts` untuk export:

```typescript
// features/boards/components/index.ts
export { KanbanBoard } from './KanbanBoard';
export { KanbanList } from './KanbanList';
export { KanbanCard } from './KanbanCard';
export { BoardHeader } from './BoardHeader';
export { CardDetailModal } from './CardDetailModal';
export { ImagePreviewModal } from './ImagePreviewModal';
```

## 🔍 Quick Search

| Cari apa?             | Lokasi                          |
| --------------------- | ------------------------------- |
| Board components      | `features/boards/components/`   |
| Board hooks           | `features/boards/hooks/`        |
| Layout components     | `components/shared/layout/`     |
| Navigation components | `components/shared/navigation/` |
| Form components       | `components/shared/form/`       |
| Auth components       | `components/shared/auth/`       |
| UI primitives         | `components/ui/`                |
| Pages                 | `pages/`                        |
| Global hooks          | `hooks/`                        |
| Utilities             | `lib/`                          |

## ✨ Benefits

✅ **Easy Navigation** - Clear separation of concerns
✅ **Easy Testing** - Isolated components with clear dependencies
✅ **Easy Refactoring** - Changes in one feature don't affect others
✅ **Easy Scaling** - Add new features without disrupting existing ones
✅ **Easy Tracing** - Clear import paths show dependency flow
✅ **Better DX** - Autocomplete dan IntelliSense work better

## 📚 Read More

Lihat [README.md](./README.md) untuk dokumentasi lengkap.
