# Migration Guide - Frontend Restructure

Panduan untuk update import paths setelah reorganisasi struktur frontend.

## 📦 Ringkasan Perubahan

Semua komponen telah direorganisasi ke dalam struktur yang lebih baik:

- **Feature modules**: `features/{feature-name}/`
- **Shared components**: `components/shared/{category}/`
- **UI primitives**: `components/ui/` (tidak berubah)

## 🔄 Import Path Changes

### Board/Kanban Components

#### ❌ Before

```typescript
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { KanbanList } from '@/components/kanban/KanbanList';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { BoardHeader } from '@/components/board-header';
```

#### ✅ After

```typescript
import {
    KanbanBoard,
    KanbanList,
    KanbanCard,
    BoardHeader,
    CardDetailModal,
    ImagePreviewModal,
    useCardModal,
    useImagePreview,
} from '@/features/boards';
```

---

### Layout Components

#### ❌ Before

```typescript
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { AppShell } from '@/components/app-shell';
import { AppContent } from '@/components/app-content';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
```

#### ✅ After

```typescript
import {
    AppHeader,
    AppSidebar,
    AppShell,
    AppContent,
    AppSidebarHeader,
} from '@/components/shared/layout';
```

---

### Navigation Components

#### ❌ Before

```typescript
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NavFooter } from '@/components/nav-footer';
```

#### ✅ After

```typescript
import {
    Breadcrumbs,
    NavMain,
    NavUser,
    NavFooter,
} from '@/components/shared/navigation';
```

---

### Form Components

#### ❌ Before

```typescript
import InputError from '@/components/input-error';
import AlertError from '@/components/alert-error';
```

#### ✅ After

```typescript
import { InputError, AlertError } from '@/components/shared/form';
```

---

### Common Components

#### ❌ Before

```typescript
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import Icon from '@/components/icon';
import TextLink from '@/components/text-link';
import UserInfo from '@/components/user-info';
import UserMenuContent from '@/components/user-menu-content';
import AppearanceDropdown from '@/components/appearance-dropdown';
import AppearanceTabs from '@/components/appearance-tabs';
```

#### ✅ After

```typescript
import {
    AppLogo,
    AppLogoIcon,
    Heading,
    HeadingSmall,
    Icon,
    TextLink,
    UserInfo,
    UserMenuContent,
    AppearanceDropdown,
    AppearanceTabs,
} from '@/components/shared/common';
```

---

### Auth Components

#### ❌ Before

```typescript
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import DeleteUser from '@/components/delete-user';
```

#### ✅ After

```typescript
import {
    TwoFactorSetupModal,
    TwoFactorRecoveryCodes,
    DeleteUser,
} from '@/components/shared/auth';
```

---

## 📁 Lokasi File Baru

### Features

```
features/boards/
├── components/
│   ├── KanbanBoard.tsx
│   ├── KanbanList.tsx
│   ├── KanbanCard.tsx
│   ├── BoardHeader.tsx
│   ├── CardDetailModal.tsx
│   ├── ImagePreviewModal.tsx
│   └── index.ts
├── hooks/
│   ├── useCardModal.ts
│   ├── useImagePreview.ts
│   └── index.ts
└── index.ts
```

### Shared Components

```
components/shared/
├── layout/
│   ├── app-header.tsx
│   ├── app-sidebar.tsx
│   ├── app-shell.tsx
│   ├── app-content.tsx
│   ├── app-sidebar-header.tsx
│   └── index.ts
├── navigation/
│   ├── breadcrumbs.tsx
│   ├── nav-main.tsx
│   ├── nav-user.tsx
│   ├── nav-footer.tsx
│   └── index.ts
├── form/
│   ├── input-error.tsx
│   ├── alert-error.tsx
│   └── index.ts
├── common/
│   ├── app-logo.tsx
│   ├── app-logo-icon.tsx
│   ├── heading.tsx
│   ├── heading-small.tsx
│   ├── icon.tsx
│   ├── text-link.tsx
│   ├── user-info.tsx
│   ├── user-menu-content.tsx
│   ├── appearance-dropdown.tsx
│   ├── appearance-tabs.tsx
│   └── index.ts
├── auth/
│   ├── two-factor-setup-modal.tsx
│   ├── two-factor-recovery-codes.tsx
│   ├── delete-user.tsx
│   └── index.ts
└── index.ts
```

## 🔍 Search & Replace Guide

Gunakan find & replace di editor Anda untuk update import paths secara otomatis:

### VS Code / IDE Lainnya

1. **Board Components**
    - Find: `from '@/components/kanban/`
    - Replace: `from '@/features/boards/components/`

2. **Layout Components**
    - Find: `from '@/components/app-`
    - Replace: `from '@/components/shared/layout'`
    - Note: Perlu manual adjustment untuk named imports

3. **Navigation Components**
    - Find: `from '@/components/breadcrumbs'`
    - Replace: `from '@/components/shared/navigation'`
    - Find: `from '@/components/nav-`
    - Replace: `from '@/components/shared/navigation'`

4. **Form Components**
    - Find: `from '@/components/input-error'`
    - Replace: `from '@/components/shared/form'`
    - Find: `from '@/components/alert-error'`
    - Replace: `from '@/components/shared/form'`

5. **Common Components**
    - Find: `from '@/components/heading'`
    - Replace: `from '@/components/shared/common'`
    - Find: `from '@/components/text-link'`
    - Replace: `from '@/components/shared/common'`
    - Find: `from '@/components/appearance-`
    - Replace: `from '@/components/shared/common'`

6. **Auth Components**
    - Find: `from '@/components/two-factor-`
    - Replace: `from '@/components/shared/auth'`
    - Find: `from '@/components/delete-user'`
    - Replace: `from '@/components/shared/auth'`

## ✅ Files Updated

Semua file berikut sudah diupdate import path-nya:

### Layouts

- ✅ `layouts/app/app-header-layout.tsx`
- ✅ `layouts/app/app-sidebar-layout.tsx`
- ✅ `layouts/auth/auth-card-layout.tsx`
- ✅ `layouts/auth/auth-simple-layout.tsx`
- ✅ `layouts/auth/auth-split-layout.tsx`
- ✅ `layouts/settings/layout.tsx`

### Pages - Auth

- ✅ `pages/auth/confirm-password.tsx`
- ✅ `pages/auth/forgot-password.tsx`
- ✅ `pages/auth/login.tsx`
- ✅ `pages/auth/register.tsx`
- ✅ `pages/auth/reset-password.tsx`
- ✅ `pages/auth/two-factor-challenge.tsx`
- ✅ `pages/auth/verify-email.tsx`

### Pages - Settings

- ✅ `pages/settings/appearance.tsx`
- ✅ `pages/settings/password.tsx`
- ✅ `pages/settings/profile.tsx`
- ✅ `pages/settings/two-factor.tsx`

### Pages - Boards

- ✅ `pages/boards/show.tsx`

### Shared Components (Internal)

- ✅ `components/shared/layout/app-header.tsx`
- ✅ `components/shared/layout/app-sidebar.tsx`
- ✅ `components/shared/layout/app-sidebar-header.tsx`

## 🚀 Benefits

Setelah migration ini, Anda akan mendapatkan:

1. **Cleaner Imports** - Lebih mudah dibaca dan dimengerti
2. **Better Organization** - Komponen dikelompokkan berdasarkan fungsi
3. **Easier Maintenance** - Mudah menemukan dan update komponen
4. **Better IDE Support** - Autocomplete dan IntelliSense lebih baik
5. **Scalability** - Mudah menambah fitur baru

## ⚠️ Breaking Changes

Tidak ada breaking changes dalam fungsionalitas, hanya import paths yang berubah.

## 🐛 Troubleshooting

### Error: Cannot find module '@/components/...'

**Solusi**: Update import path sesuai panduan di atas.

### Error: Named export not found

**Solusi**: Pastikan menggunakan named import `{ ComponentName }` bukan default import.

**Before (Wrong):**

```typescript
import ComponentName from '@/components/shared/...';
```

**After (Correct):**

```typescript
import { ComponentName } from '@/components/shared/...';
```

## 📚 Dokumentasi Tambahan

- [README.md](./README.md) - Dokumentasi lengkap struktur frontend
- [STRUCTURE.md](./STRUCTURE.md) - Quick reference struktur folder

## ❓ Questions?

Jika ada pertanyaan atau menemukan masalah setelah migration, silakan cek dokumentasi atau tanyakan ke tim!
