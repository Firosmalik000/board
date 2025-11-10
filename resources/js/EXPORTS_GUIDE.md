# Export/Import Guide - Named vs Default

Panduan untuk memahami perbedaan antara named export dan default export dalam struktur frontend ini.

## 📚 Konsep Dasar

### Default Export
File mengexport satu nilai sebagai default.

**File dengan default export:**
```typescript
// heading.tsx
export default function Heading({ children }: Props) {
  return <h1>{children}</h1>
}
```

**Import:**
```typescript
// Bisa gunakan nama apapun saat import
import Heading from './heading'
import MyHeading from './heading'  // Juga valid
import { default as Heading } from './heading'  // Juga valid
```

### Named Export
File mengexport satu atau lebih nilai dengan nama spesifik.

**File dengan named export:**
```typescript
// nav-main.tsx
export function NavMain({ items }: Props) {
  return <nav>{items}</nav>
}
```

**Import:**
```typescript
// HARUS gunakan nama yang sama
import { NavMain } from './nav-main'
import { NavMain as NavigationMain } from './nav-main'  // Rename OK
```

## 🗂️ Struktur di Project Ini

### Layout Components - Named Exports ✅
```typescript
// app-header.tsx
export function AppHeader() { }

// app-sidebar.tsx
export function AppSidebar() { }

// app-shell.tsx
export function AppShell() { }
```

**index.ts:**
```typescript
export { AppHeader } from './app-header'
export { AppSidebar } from './app-sidebar'
export { AppShell } from './app-shell'
```

**Usage:**
```typescript
import { AppHeader, AppSidebar, AppShell } from '@/components/shared/layout'
```

---

### Navigation Components - Named Exports ✅
```typescript
// nav-main.tsx
export function NavMain() { }

// nav-user.tsx
export function NavUser() { }

// breadcrumbs.tsx
export function Breadcrumbs() { }
```

**index.ts:**
```typescript
export { NavMain } from './nav-main'
export { NavUser } from './nav-user'
export { Breadcrumbs } from './breadcrumbs'
```

**Usage:**
```typescript
import { NavMain, NavUser, Breadcrumbs } from '@/components/shared/navigation'
```

---

### Common Components - Mixed Exports 🔀

#### Default Exports
```typescript
// app-logo.tsx
export default function AppLogo() { }

// heading.tsx
export default function Heading() { }

// text-link.tsx
export default function TextLink() { }
```

#### Named Exports
```typescript
// icon.tsx
export function Icon() { }

// user-info.tsx
export function UserInfo() { }

// user-menu-content.tsx
export function UserMenuContent() { }
```

**index.ts:**
```typescript
// Default exports - perlu `default as`
export { default as AppLogo } from './app-logo'
export { default as Heading } from './heading'
export { default as TextLink } from './text-link'

// Named exports - langsung
export { Icon } from './icon'
export { UserInfo } from './user-info'
export { UserMenuContent } from './user-menu-content'
```

**Usage:**
```typescript
// Semua jadi named imports
import {
  AppLogo,
  Heading,
  Icon,
  UserInfo
} from '@/components/shared/common'
```

---

### Form Components - Default Exports ✅
```typescript
// input-error.tsx
export default function InputError() { }

// alert-error.tsx
export default function AlertError() { }
```

**index.ts:**
```typescript
export { default as InputError } from './input-error'
export { default as AlertError } from './alert-error'
```

**Usage:**
```typescript
import { InputError, AlertError } from '@/components/shared/form'
```

---

### Auth Components - Default Exports ✅
```typescript
// two-factor-setup-modal.tsx
export default function TwoFactorSetupModal() { }

// delete-user.tsx
export default function DeleteUser() { }
```

**index.ts:**
```typescript
export { default as TwoFactorSetupModal } from './two-factor-setup-modal'
export { default as DeleteUser } from './delete-user'
```

**Usage:**
```typescript
import {
  TwoFactorSetupModal,
  DeleteUser
} from '@/components/shared/auth'
```

---

## 🔧 Barrel Export Pattern

### Untuk Default Exports
```typescript
// index.ts
export { default as ComponentName } from './component-name'
```

Ini mengubah default export menjadi named export saat di-reexport.

### Untuk Named Exports
```typescript
// index.ts
export { ComponentName } from './component-name'
```

Langsung pass-through named export.

---

## ✅ Konsistensi Import

Dengan barrel exports, semua import menjadi konsisten menggunakan named imports:

```typescript
// ✅ Konsisten - semua named imports
import { AppHeader } from '@/components/shared/layout'
import { NavMain } from '@/components/shared/navigation'
import { InputError } from '@/components/shared/form'
import { AppLogo } from '@/components/shared/common'
import { DeleteUser } from '@/components/shared/auth'

// ❌ Inkonsisten - campuran default dan named
import AppHeader from '@/components/app-header'
import { NavMain } from '@/components/nav-main'
```

---

## 🎯 Best Practices

### 1. Prefer Named Exports untuk Multiple Components
```typescript
// ✅ Good - bisa export banyak
export function ComponentA() { }
export function ComponentB() { }
export function ComponentC() { }
```

### 2. Use Default Export untuk Single Component Files (Legacy)
```typescript
// ✅ OK - jika sudah ada
export default function MyComponent() { }
```

### 3. Konsisten dalam Satu Folder
- Semua layout → named exports
- Semua navigation → named exports
- Semua form → default exports (legacy)
- Semua auth → default exports (legacy)

### 4. Gunakan Barrel Exports
Selalu buat `index.ts` untuk normalize exports:
```typescript
// index.ts
export { ComponentA } from './component-a'
export { default as ComponentB } from './component-b'
```

---

## 🔍 Troubleshooting

### Error: "does not provide an export named 'default'"
```
index.ts:2 The requested module does not provide an export named 'default'
```

**Penyebab:** File menggunakan named export tapi index.ts mencoba import sebagai default.

**Solusi:**
```typescript
// ❌ Wrong
export { default as NavMain } from './nav-main'

// ✅ Correct
export { NavMain } from './nav-main'
```

### Error: "does not provide an export named 'ComponentName'"
```
The requested module does not provide an export named 'ComponentName'
```

**Penyebab:** File menggunakan default export tapi index.ts mencoba import sebagai named.

**Solusi:**
```typescript
// ❌ Wrong
export { AppLogo } from './app-logo'

// ✅ Correct
export { default as AppLogo } from './app-logo'
```

---

## 📋 Quick Reference

| File Type | Export Type | Barrel Export Pattern |
|-----------|-------------|----------------------|
| `app-header.tsx` | `export function` | `export { AppHeader } from './app-header'` |
| `app-logo.tsx` | `export default` | `export { default as AppLogo } from './app-logo'` |
| `nav-main.tsx` | `export function` | `export { NavMain } from './nav-main'` |
| `input-error.tsx` | `export default` | `export { default as InputError } from './input-error'` |

---

## 🎓 Summary

1. **Named exports** = `export function ComponentName()`
2. **Default exports** = `export default function ComponentName()`
3. **Barrel exports** normalize keduanya menjadi named exports
4. **Always import as named** dari barrel exports
5. **Check the source file** jika ada error export/import

---

*Last updated: 2025-01-25*
