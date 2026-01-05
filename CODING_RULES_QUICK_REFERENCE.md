# Coding Rules - Quick Reference

## 📦 Imports

```tsx
✅ import * as React from 'react';
❌ import React from 'react';
```

## 🧩 Components

```tsx
// ✅ Named export
export const Button = () => { ... };

// ✅ Props type
export type ButtonProps = {
  children: React.ReactNode;
};

// ✅ Location
src/components/Button.tsx  // Flat structure
```

## 📄 Pages

```tsx
// ✅ Default export for pages
const LoginPage: NextPageWithLayout = () => { ... };
export default LoginPage;

// ✅ Location
src/pages/auth/login.tsx
```

## 🌐 API

```tsx
// ✅ Use SWR
export const useGetUsers = () =>
  useSWR<UsersResponse>('/api/users', fetcher);

// ✅ DTOs & schemas together
export const userSchema = z.object({ ... });
export type UserDTO = z.infer<typeof userSchema>;

// ✅ Always use createUrl
const url = createUrl('/api/users', { search: 'john' });

// ✅ Location
src/api/users/getUsers.ts
src/api/users/users.schema.ts
```

## 🪝 Hooks

```tsx
// ✅ Named export with 'use' prefix
export const useToggle = () => { ... };

// ✅ Location
src/hooks/useToggle.ts
```

## 📝 Forms

```tsx
// ✅ React Hook Form + Zod
const schema = z.object({
  email: z.string().email(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## 🛠 Utils

```tsx
// ✅ Named export, pure function
export const formatDate = (date: string) => { ... };

// ✅ Location
src/utils/formatDate.ts
```

## 📊 Constants

```tsx
// ✅ SCREAMING_SNAKE_CASE
export const API_BASE_URL = "https://api.com";
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ✅ Location
src / constants / api.ts;
```

## 🌍 Contexts

```tsx
// ✅ Context + Provider + Hook in one file
const MyContext = React.createContext<T>(undefined);

export const MyProvider = ({ children }) => { ... };

export const useMyContext = () => {
  const context = React.useContext(MyContext);
  if (!context) throw new Error('Must use within Provider');
  return context;
};

// ✅ Location
src/contexts/MyContext.tsx
```

## 🎨 Styling

```tsx
// ✅ Tailwind CSS
<button className="rounded-lg bg-blue-500 px-4 py-2">

// ✅ shadcn/ui components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// ✅ CSS variables for brand colors
:root {
  --brand-main: #1089ff;
}
```

## 📘 Types

```tsx
// ✅ Component-specific types: inline
type ButtonProps = { ... };

// ✅ Shared types: src/types/
// types/common.ts
export type Nullable<T> = T | null;
```

## 🔄 State

```tsx
// ✅ Try useState first
const [count, setCount] = React.useState(0);

// ✅ Use Jotai only when needed
const [user, setUser] = useAtom(userAtom);
```

## 📝 Naming

- **Files**: `Button.tsx`, `formatDate.ts`, `useToggle.ts`
- **Components**: PascalCase - `Button`, `LoginForm`
- **Functions**: camelCase - `handleClick`, `formatDate`
- **Constants**: SCREAMING_SNAKE_CASE - `API_URL`
- **Types**: PascalCase - `ButtonProps`, `UserDTO`
- **Booleans**: `isLoading`, `hasError`, `shouldShow`

## 📁 Structure

```
src/
├── api/              # API calls, DTOs, schemas
├── components/       # UI components (flat!)
├── pages/            # Next.js pages
├── hooks/            # Custom hooks
├── contexts/         # React contexts
├── utils/            # Utilities
├── constants/        # Constants
├── lib/              # Library configs
├── styles/           # Global styles
└── types/            # Shared types
```

## ⚠️ Error Handling

```tsx
// ✅ API error handling
const { data, error } = useSWR('/api/users', fetcher);
if (error) return <ErrorMessage error={error} />;

// ✅ Try/catch in async functions
try {
  await apiCall();
} catch (error) {
  if (error instanceof AppError) {
    // Handle specific error
  }
}

// ✅ Error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

## ♿ Accessibility

```tsx
// ✅ Semantic HTML
<button aria-label="Close" aria-expanded={isOpen}>

// ✅ Form labels
<label htmlFor="email">Email</label>
<input id="email" aria-required="true" />

// ✅ Keyboard navigation
<button onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
```

## ⚡ Performance

```tsx
// ✅ Code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'));

// ✅ Memoization
const memoized = React.useMemo(() => expensive(), [deps]);
const callback = React.useCallback(() => {}, [deps]);

// ✅ Next.js Image
<Image src="/img.jpg" width={800} height={600} alt="..." />
```

## 🔒 Version Stability

```json
// ✅ Pin major versions
"react": "19.2.0",
"next": "16.0.1"

// ✅ Commit lock files
git add package-lock.json
```

## ✅ Pre-Commit Checklist

- [ ] React imports use namespace (`import * as React`)
- [ ] Components use named exports
- [ ] Flat component structure
- [ ] No linter errors
- [ ] Forms use React Hook Form + Zod
- [ ] API calls use SWR with error handling
- [ ] No `any` types
- [ ] Proper error handling (try/catch, boundaries)
- [ ] Accessibility: semantic HTML, ARIA labels
- [ ] Performance: memoization, code splitting
- [ ] Dependencies: lock file committed

## 🚫 Don't

- ❌ `import React from 'react'`
- ❌ Default exports for components
- ❌ Nested folders (>1 level)
- ❌ Inline styles (unless dynamic)
- ❌ `any` type
- ❌ Prop drilling
- ❌ Side effects in render
- ❌ Direct state mutation
