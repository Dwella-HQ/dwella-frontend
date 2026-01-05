# Project Coding Rules & Conventions

> **Philosophy**: Consistency over preference. These rules prioritize maintainability, clarity, and team collaboration.

---

## 🚀 Quick Start for New Team Members

### First Day Checklist

1. **Setup Environment**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd <repo-name>
   
   # Install dependencies
   npm install
   # or: pnpm install (if using pnpm)
   
   # Copy environment variables
   cp .env.example .env.local
   # Edit .env.local with your values
   
   # Start development server
   npm run dev
   # or: pnpm dev
   ```

2. **Read These Sections First**
   - [Technology Stack](#technology-stack) - Understand what we use
   - [Project Structure](#project-structure) - Know where things go
   - [Naming Conventions](#naming-conventions) - Follow naming patterns
   - [Components](#components) - How to create components
   - [API Layer](#api-layer) - How to fetch data

3. **Common Tasks Quick Reference**
   - [Creating a Component](#creating-a-component)
   - [Adding an API Endpoint](#adding-an-api-endpoint)
   - [Creating a Form](#creating-a-form)
   - [Adding a New Page](#adding-a-new-page)

4. **Development Workflow**
   ```bash
   # Before starting work
   git checkout -b feature/your-feature-name
   
   # Make changes following coding rules
   # Test your changes
   npm run lint
   # or: pnpm lint
   
   # Commit with descriptive message
   git commit -m "feat: add user profile component"
   ```

### Essential Patterns to Learn

- **Components**: Named exports, `import * as React`, props types inline
- **API Calls**: Use SWR hooks, centralized API client, proper error handling
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS classes, shadcn/ui components
- **State**: `useState` first, Jotai only when needed

---

## 📚 Table of Contents

- [Quick Start for New Team Members](#quick-start-for-new-team-members)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Layer](#api-layer)
- [Components](#components)
- [Pages](#pages)
- [Hooks](#hooks)
- [State Management](#state-management)
- [Forms](#forms)
- [Styling](#styling)
- [Utils](#utils)
- [Constants](#constants)
- [Contexts](#contexts)
- [Library Configuration](#library-configuration)
- [Types & Interfaces](#types--interfaces)
- [Testing](#testing)
- [Version Stability](#version-stability)
- [Error Handling Patterns](#error-handling-patterns)
- [Accessibility Requirements](#accessibility-requirements)
- [Performance Considerations](#performance-considerations)
- [Naming Conventions](#naming-conventions)
- [Quick Reference Checklists](#quick-reference-checklists)

---

## 🛠 Technology Stack

### Core Dependencies

- ✅ React 19+
- ✅ Next.js 16+ (Pages Router)
- ✅ TypeScript 5+
- ✅ Tailwind CSS 4+
- ✅ SWR for data fetching
- ✅ React Hook Form + Zod for forms
- ✅ shadcn/ui + Radix UI for UI components
- ✅ Jotai (only when React.useState is insufficient)
- ✅ npm for package management (pnpm optional - use npm to avoid deployment issues)

### Development Tools

- ✅ ESLint
- ✅ Prettier
- ✅ TypeScript strict mode

### Stack Rationale

**Why SWR over TanStack Query?**
- Simpler API, less boilerplate
- Built-in caching and revalidation
- Better for Pages Router architecture
- Already integrated and working well

**Why Jotai over Zustand?**
- Atomic state management (more granular updates)
- Better TypeScript inference
- Already in use and performing well
- More powerful for complex state scenarios

**Why shadcn/ui?**
- Built on Radix UI (already using)
- Copy-paste components (not a dependency)
- Fully customizable with Tailwind
- Accessible by default
- Perfect fit for our stack

**Why npm over pnpm?**
- Better deployment compatibility (Heroku, Vercel, etc.)
- No additional setup required on CI/CD
- Standard Node.js tooling
- Avoids deployment headaches
- pnpm can be used locally if preferred, but npm is required for production builds

**Why Pages Router over App Router?**
- **Current Status**: We use Next.js 16 with Pages Router
- **Decision Rationale**:
  - Pages Router is stable, mature, and well-documented
  - Team is already familiar with Pages Router patterns
  - Migration to App Router is a significant undertaking
  - Pages Router meets all current requirements
- **Future Consideration**: App Router offers better performance and developer experience, but migration should be planned as a separate project, not done incrementally
- **When to Consider Migration**: 
  - If we need advanced features like streaming, server components, or improved data fetching patterns
  - If starting a new major version of the application
  - If team consensus and dedicated migration time are available

---

## 📁 Project Structure

```
src/
├── api/              # API calls, DTOs, schemas
├── components/       # Reusable UI components (flat structure)
├── pages/            # Next.js pages
├── hooks/            # Custom React hooks
├── contexts/         # React Context providers
├── utils/            # Utility functions
├── constants/        # App-wide constants
├── lib/              # Third-party library configs
├── styles/           # Global styles
└── types/            # Shared TypeScript types
```

### Structure Rules

1. **Flat Component Structure**: Maximum 1 level deep from `components/`

   ```
   ✅ src/components/Button.tsx
   ✅ src/components/LoginForm.tsx
   ✅ src/components/TransactionTable.tsx
   ❌ src/components/Auth/Forms/LoginForm.tsx
   ```

2. **Feature Colocation**: Keep related files close

   ```
   ✅ src/api/users/getUsers.ts
   ✅ src/api/users/users.schema.ts
   ```

3. **No Nested Folders** beyond 2 levels in any directory

---

## 🌐 API Layer

### Location

- All API calls in `src/api/` folder
- Organize by resource/entity (users, transactions, etc.)

### Rules

1. **Use SWR for data fetching** (unless you need SSR/SSG)

   ```tsx
   import useSWR from "swr";

   export const useGetUsers = () =>
     useSWR<UsersResponse>("/api/users", fetcher);
   ```

2. **Use Zod for validation** - DTOs and schemas in same file

   ```tsx
   import { z } from "zod";

   export const userSchema = z.object({
     id: z.string(),
     name: z.string(),
     email: z.string().email(),
   });

   export type UserDTO = z.infer<typeof userSchema>;
   ```

3. **Always use `createUrl` for formatting URLs**

   ```tsx
   import { createUrl } from "@/utils/createUrl";

   const url = createUrl("/api/users", { search: "john", limit: 10 });
   ```

4. **File naming**: `resourceName.ts`, `resourceName.schema.ts`

   ```
   api/
   ├── users/
   │   ├── getUsers.ts
   │   ├── createUser.ts
   │   └── users.schema.ts
   ```

5. **Mock data**: Store in `*.mock.ts` files within API folder
   ```tsx
   // api/users/users.mock.ts
   export const mockUsers: UserDTO[] = [...];
   ```

### API Client Pattern

**Always use centralized API client** for consistency, error handling, and authentication.

```tsx
// lib/apiClient.ts
import { createUrl } from "@/utils/createUrl";

type ApiClientOptions = RequestInit & {
  token?: string;
  skipAuth?: boolean;
};

export const apiClient = async <T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> => {
  const { token, skipAuth, ...fetchOptions } = options;
  
  const url = createUrl(endpoint);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Add authentication token
  if (!skipAuth) {
    const authToken = token || (typeof window !== "undefined" 
      ? localStorage.getItem("authToken") 
      : null);
    
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};
```

### Loading States Pattern

**Always handle loading states** in components using SWR or manual state.

```tsx
// ✅ Good: Using SWR (automatic loading state)
export const UsersList = () => {
  const { data, error, isLoading } = useGetUsers();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!data) {
    return <EmptyState message="No users found" />;
  }

  return (
    <ul>
      {data.users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};

// ✅ Good: Manual loading state (for non-SWR calls)
export const ManualFetchComponent = () => {
  const [data, setData] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUsers();
        if (result.success) {
          setData(result.data);
        } else {
          setError(new Error(result.error));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <UsersList users={data} />;
};
```

### Example API File

```tsx
// api/users/getUsers.ts
import useSWR from "swr";
import { createUrl } from "@/utils/createUrl";
import { apiClient } from "@/lib/apiClient";
import type { UserDTO, UsersResponseDTO } from "./users.schema";
import { usersResponseSchema } from "./users.schema";

// Fetcher function using centralized API client
const fetchUsers = async (url: string): Promise<UsersResponseDTO> => {
  const data = await apiClient<unknown>(url);
  return usersResponseSchema.parse(data);
};

export type UseGetUsersParams = {
  search?: string;
  limit?: number;
};

export const getUsersKey = (params?: UseGetUsersParams) =>
  createUrl("/api/users", params);

export const useGetUsers = (params?: UseGetUsersParams) => {
  const { data, error, isLoading, mutate } = useSWR<UsersResponseDTO>(
    getUsersKey(params),
    fetchUsers,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    users: data?.users ?? [],
    error,
    isLoading,
    refetch: mutate,
  };
};
```

### Example API File (Non-SWR - Manual Fetch)

```tsx
// api/users/createUser.ts
import { z } from "zod";
import { apiClient } from "@/lib/apiClient";
import { createUrl } from "@/utils/createUrl";
import type { CreateUserDTO, UserDTO } from "./users.schema";
import { createUserSchema, userSchema } from "./users.schema";

type CreateUserResult =
  | { success: true; data: UserDTO }
  | { success: false; error: string };

export const createUser = async (
  userData: CreateUserDTO,
  token?: string
): Promise<CreateUserResult> => {
  try {
    // Validate input
    const validated = createUserSchema.parse(userData);

    const data = await apiClient<UserDTO>(
      createUrl("/api/users"),
      {
        method: "POST",
        body: JSON.stringify(validated),
        token,
      }
    );

    const parsed = userSchema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
};
```

---

## 🧩 Components

### Location

- All components in `src/components/` folder
- Flat structure (no nested folders)

### Rules

1. **Import React as namespace**

   ```tsx
   ✅ import * as React from 'react';
   ❌ import React from 'react';
   ```

2. **Always use named exports**

   ```tsx
   ✅ export const Button = () => { ... };
   ❌ export default Button;
   ```

3. **Component file = Component name**

   ```
   ✅ Button.tsx → export const Button
   ✅ LoginForm.tsx → export const LoginForm
   ```

4. **Props type naming**: `ComponentNameProps`

   ```tsx
   export type ButtonProps = {
     variant?: "primary" | "secondary";
     children: React.ReactNode;
   };

   export const Button = ({ variant = "primary", children }: ButtonProps) => {
     return <button className={variant}>{children}</button>;
   };
   ```

5. **Component-specific types**: Define inline in same file
   ```tsx
   // Inside Button.tsx
   type ButtonVariant = "primary" | "secondary";
   type ButtonSize = "sm" | "md" | "lg";
   ```

### Component Template

```tsx
import * as React from "react";

export type ButtonProps = {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
  onClick,
}: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`btn-${variant} btn-${size}`}
    >
      {children}
    </button>
  );
};
```

---

## 📄 Pages

### Location

- All pages in `src/pages/` folder (Next.js Pages Router)

### Rules

1. **Always use default export** for pages

   ```tsx
   export default LoginPage;
   ```

2. **Import React as namespace** (same as components)

   ```tsx
   import * as React from "react";
   ```

3. **Page naming**: Lowercase with hyphens (Next.js convention)

   ```
   pages/
   ├── index.tsx              → /
   ├── about.tsx              → /about
   ├── auth/
   │   └── login.tsx          → /auth/login
   ├── dashboard/
   │   ├── index.tsx          → /dashboard
   │   └── settings.tsx       → /dashboard/settings
   ```

4. **Use layouts** for shared UI structure

   ```tsx
   import type { NextPageWithLayout } from "./_app";

   const DashboardPage: NextPageWithLayout = () => {
     return <div>Dashboard content</div>;
   };

   DashboardPage.getLayout = (page) => (
     <DashboardLayout>{page}</DashboardLayout>
   );

   export default DashboardPage;
   ```

### Page Template

```tsx
import * as React from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { NextPageWithLayout } from "../_app";

const DashboardPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Dashboard | My App</title>
      </Head>
      <div>{/* Page content */}</div>
    </>
  );
};

DashboardPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default DashboardPage;
```

---

## 🪝 Hooks

### Location

- All custom hooks in `src/hooks/` folder

### Rules

1. **Always prefix with `use`**

   ```tsx
   ✅ useToggle
   ✅ useLocalStorage
   ✅ useDebounce
   ```

2. **Use named exports**

   ```tsx
   ✅ export const useToggle = () => { ... };
   ❌ export default useToggle;
   ```

3. **Import React as namespace**

   ```tsx
   import * as React from "react";
   ```

4. **Return arrays for boolean states, objects for complex states**

   ```tsx
   // Boolean state - return array
   export const useToggle = (initial = false) => {
     const [value, setValue] = React.useState(initial);
     const toggle = React.useCallback(() => setValue((v) => !v), []);
     return [value, toggle] as const;
   };

   // Complex state - return object
   export const useForm = <T,>(initial: T) => {
     const [values, setValues] = React.useState(initial);
     const [errors, setErrors] = React.useState({});
     return { values, setValues, errors, setErrors };
   };
   ```

### Hook Template

```tsx
import * as React from "react";

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = React.useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};
```

---

## 🔄 State Management

### Rules

1. **Try `React.useState` first** - Use for local component state

   ```tsx
   const [count, setCount] = React.useState(0);
   ```

2. **Use Jotai only when needed** - For complex global state

   ```tsx
   import { atom, useAtom } from "jotai";

   export const userAtom = atom<User | null>(null);

   // In component
   const [user, setUser] = useAtom(userAtom);
   ```

3. **Avoid prop drilling** - Use Context or Jotai for deep state

   ```tsx
   // ❌ Passing through 5 levels
   <Parent user={user}>
     <Child user={user}>
       <GrandChild user={user}>
         <GreatGrandChild user={user} />

   // ✅ Use Context
   <UserProvider>
     <App />
   </UserProvider>
   ```

---

## 📝 Forms

### Rules

1. **Always use React Hook Form with Zod**

   ```tsx
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import { z } from "zod";

   const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
   });

   type LoginFormValues = z.infer<typeof loginSchema>;

   export const LoginForm = () => {
     const {
       register,
       handleSubmit,
       formState: { errors },
     } = useForm<LoginFormValues>({
       resolver: zodResolver(loginSchema),
     });

     const onSubmit = handleSubmit((data) => {
       console.log(data);
     });

     return <form onSubmit={onSubmit}>...</form>;
   };
   ```

2. **Define schema before component**

   ```tsx
   // ✅ Schema first
   const schema = z.object({...});
   type FormValues = z.infer<typeof schema>;
   export const MyForm = () => { ... };
   ```

3. **Use Radix UI for form primitives** (Label, etc.)

   ```tsx
   import * as Label from '@radix-ui/react-label';

   <Label.Root htmlFor="email">Email</Label.Root>
   <input id="email" {...register('email')} />
   ```

---

## 🎨 Styling

### Rules

1. **Use Tailwind CSS** for all styling

   ```tsx
   <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
     Click me
   </button>
   ```

2. **Use shadcn/ui components** for common UI patterns

   ```tsx
   // ✅ Good: Use shadcn/ui components
   import { Button } from '@/components/ui/button';
   import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
   import { Input } from '@/components/ui/input';

   // Components are in src/components/ui/ (installed via shadcn CLI)
   // They're copy-paste components, fully customizable
   ```

3. **shadcn/ui Setup**

   ```bash
   # Install shadcn/ui CLI
   npx shadcn@latest init

   # Add components as needed
   npx shadcn@latest add button
   npx shadcn@latest add dialog
   npx shadcn@latest add input
   ```

   Components will be added to `src/components/ui/` and can be customized.

4. **Use SCSS only for global styles** in `src/styles/globals.css`

   ```css
   @import "tailwindcss";

   :root {
     --brand-primary: #1089ff;
   }
   ```

5. **Use CSS variables** for brand colors

   ```css
   :root {
     --brand-main: #1089ff;
     --brand-success: #22c55e;
   }

   @theme inline {
     --color-brand-main: var(--brand-main);
     --color-brand-success: var(--brand-success);
   }
   ```

6. **No inline styles** unless dynamic
   ```tsx
   ❌ <div style={{ color: 'red' }}>Text</div>
   ✅ <div className="text-red-500">Text</div>
   ✅ <div style={{ width: `${progress}%` }}>Dynamic</div>
   ```

---

## 🛠 Utils

### Location

- All utility functions in `src/utils/` folder

### Rules

1. **Use named exports**

   ```tsx
   ✅ export const formatDate = () => { ... };
   ❌ export default formatDate;
   ```

2. **One function per file** (unless closely related)

   ```
   utils/
   ├── formatDate.ts
   ├── createUrl.ts
   └── validation.ts  // Multiple related validators OK
   ```

3. **Pure functions preferred** - No side effects

   ```tsx
   // ✅ Pure
   export const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat("en-NG", {
       style: "currency",
       currency: "NGN",
     }).format(amount);
   };

   // ❌ Side effect
   export const logAndFormat = (amount: number) => {
     console.log(amount); // Side effect!
     return formatCurrency(amount);
   };
   ```

### Util Template

```tsx
/**
 * Formats a date string into a human-readable format
 * @param date - ISO date string or Date object
 * @param format - Output format ('short' | 'long')
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  format: "short" | "long" = "short"
): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "short") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
```

---

## 📊 Constants

### Location

- All constants in `src/constants/` folder

### Rules

1. **Use SCREAMING_SNAKE_CASE**

   ```tsx
   export const API_BASE_URL = "https://api.example.com";
   export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   export const ALLOWED_ROLES = ["admin", "user", "guest"] as const;
   ```

2. **Group related constants**

   ```tsx
   // constants/api.ts
   export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
   export const API_TIMEOUT = 10000;
   export const API_RETRY_COUNT = 3;

   // constants/validation.ts
   export const MIN_PASSWORD_LENGTH = 8;
   export const MAX_USERNAME_LENGTH = 20;
   ```

3. **Use `as const` for literal types**
   ```tsx
   export const TRANSACTION_STATUSES = [
     "pending",
     "completed",
     "failed",
   ] as const;
   export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
   ```

---

## 🌍 Contexts

### Location

- All React Contexts in `src/contexts/` folder

### Rules

1. **Context + Provider + Hook in same file**

   ```tsx
   import * as React from "react";

   type AuthContextType = {
     user: User | null;
     login: (credentials: Credentials) => Promise<void>;
     logout: () => void;
   };

   const AuthContext = React.createContext<AuthContextType | undefined>(
     undefined
   );

   export const AuthProvider = ({
     children,
   }: {
     children: React.ReactNode;
   }) => {
     const [user, setUser] = React.useState<User | null>(null);

     const login = React.useCallback(async (credentials: Credentials) => {
       // Implementation
     }, []);

     const logout = React.useCallback(() => {
       setUser(null);
     }, []);

     return (
       <AuthContext.Provider value={{ user, login, logout }}>
         {children}
       </AuthContext.Provider>
     );
   };

   export const useAuth = () => {
     const context = React.useContext(AuthContext);
     if (!context) {
       throw new Error("useAuth must be used within AuthProvider");
     }
     return context;
   };
   ```

2. **Always provide error handling** for context consumer
   ```tsx
   if (!context) {
     throw new Error("useMyContext must be used within MyProvider");
   }
   ```

---

## 🔧 Library Configuration

### Location

- All third-party library configs in `src/lib/` folder

### Rules

1. **One file per library**

   ```
   lib/
   ├── axios.ts
   ├── dayjs.ts
   └── analytics.ts
   ```

2. **Export configured instances**

   ```tsx
   // lib/axios.ts
   import axios from "axios";

   export const apiClient = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
     timeout: 10000,
     headers: {
       "Content-Type": "application/json",
     },
   });

   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem("token");
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

---

## 📘 Types & Interfaces

### Location

- Component-specific types: **Inline in component file**
- Shared types: `src/types/` folder

### Rules

1. **Prefer `type` over `interface`** (unless extending)

   ```tsx
   ✅ type User = { id: string; name: string; };
   ⚠️  interface User { id: string; name: string; } // Only if extending
   ```

2. **Use `type` suffix for reusable types**

   ```tsx
   type ButtonProps = { ... };
   type TransactionStatus = 'pending' | 'completed';
   ```

3. **Component props**: `ComponentNameProps`

   ```tsx
   export type ButtonProps = { ... };
   export type ModalProps = { ... };
   ```

4. **API DTOs**: `ResourceNameDTO`

   ```tsx
   export type UserDTO = {
     id: string;
     email: string;
     name: string;
   };
   ```

5. **Truly shared types** go in `src/types/`
   ```tsx
   // types/common.ts
   export type Nullable<T> = T | null;
   export type Optional<T> = T | undefined;
   ```

---

## 🧪 Testing

### Location

- Co-located with component: `Button.test.tsx`
- Or in `__tests__` folder: `__tests__/Button.test.tsx`
- API tests: `api/users/getUsers.test.ts`
- Utils tests: `utils/formatDate.test.ts`

### Testing Strategy

1. **Test Pyramid Approach**
   - **Unit Tests** (70%): Components, hooks, utils, pure functions
   - **Integration Tests** (20%): API calls, form submissions, user flows
   - **E2E Tests** (10%): Critical user journeys (login, checkout, etc.)

2. **What to Test**
   - ✅ Component rendering and props
   - ✅ User interactions (clicks, form submissions)
   - ✅ Error states and edge cases
   - ✅ API hooks and data fetching
   - ✅ Form validation
   - ✅ Utility functions
   - ❌ Implementation details (internal state, refs)
   - ❌ Third-party library internals

3. **Testing Tools**
   - **Jest** + **React Testing Library** (recommended)
   - **Vitest** (alternative, faster)
   - **Playwright** or **Cypress** for E2E

### Rules

1. **Use `.test.tsx` or `.test.ts` extension**

   ```
   Button.tsx → Button.test.tsx
   formatDate.ts → formatDate.test.ts
   ```

2. **Test file naming matches source file**

   ```
   ✅ Button.tsx → Button.test.tsx
   ✅ LoginForm.tsx → LoginForm.test.tsx
   ✅ useToggle.ts → useToggle.test.ts
   ```

3. **Use React Testing Library best practices**

   ```tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { Button } from './Button';

   describe('Button', () => {
     it('renders with children', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
     });

     it('calls onClick when clicked', () => {
       const handleClick = jest.fn();
       render(<Button onClick={handleClick}>Click</Button>);
       
       fireEvent.click(screen.getByRole('button'));
       expect(handleClick).toHaveBeenCalledTimes(1);
     });

     it('is disabled when disabled prop is true', () => {
       render(<Button disabled>Click</Button>);
       expect(screen.getByRole('button')).toBeDisabled();
     });
   });
   ```

4. **Test user behavior, not implementation**

   ```tsx
   // ✅ Good: Test what user sees/does
   it('shows error message when email is invalid', () => {
     render(<LoginForm />);
     fireEvent.change(screen.getByLabelText(/email/i), {
       target: { value: 'invalid-email' }
     });
     fireEvent.click(screen.getByRole('button', { name: /submit/i }));
     expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
   });

   // ❌ Bad: Test implementation details
   it('sets error state to true', () => {
     // Don't test internal state
   });
   ```

5. **Mock API calls in tests**

   ```tsx
   import { renderHook, waitFor } from '@testing-library/react';
   import { useGetUsers } from '@/api/users/getUsers';

   // Mock SWR
   jest.mock('swr', () => ({
     __esModule: true,
     default: jest.fn(),
   }));

   describe('useGetUsers', () => {
     it('returns users data', async () => {
       const mockUsers = [{ id: '1', name: 'John' }];
       (useSWR as jest.Mock).mockReturnValue({
         data: mockUsers,
         error: null,
         isLoading: false,
       });

       const { result } = renderHook(() => useGetUsers());
       expect(result.current.data).toEqual(mockUsers);
     });
   });
   ```

6. **Use describe blocks for organization**

   ```tsx
   describe('Button', () => {
     describe('when disabled', () => {
       it('should not call onClick', () => { ... });
       it('should have disabled attribute', () => { ... });
     });

     describe('when clicked', () => {
       it('should call onClick handler', () => { ... });
     });

     describe('variants', () => {
       it('applies primary variant styles', () => { ... });
       it('applies secondary variant styles', () => { ... });
     });
   });
   ```

7. **Test coverage goals**
   - Minimum 70% coverage for critical paths
   - 100% coverage for utility functions
   - Focus on user-facing functionality over internal logic

---

## 🔒 Version Stability

### Version Strategy: Stable Over Cutting-Edge

**Philosophy**: We prioritize stability and reliability over using the latest versions. This ensures:
- Predictable behavior in production
- Fewer breaking changes and bugs
- Easier maintenance and debugging
- Better team velocity (less time fixing version issues)

### Dependency Management

1. **Version Pinning Strategy**

   ```json
   // ✅ Good: Pin exact versions for critical dependencies
   "react": "19.2.0",           // Exact - critical framework
   "next": "16.0.1",             // Exact - critical framework
   "typescript": "^5.9.3",       // Caret - allow patch/minor updates
   "tailwindcss": "^3.4.17",    // Caret - allow patch/minor updates
   "zod": "^4.1.12"             // Caret - allow patch/minor updates
   ```

   **Rules**:
   - **Exact versions (`"x.y.z"`)**: Core frameworks (React, Next.js, TypeScript)
   - **Caret ranges (`"^x.y.z"`)**: Libraries and utilities (allow patch/minor)
   - **Never use `*` or `latest`**: In production dependencies

2. **Update Policy**

   - **Critical Dependencies** (React, Next.js, TypeScript):
     - Update only when necessary (security, critical bugs)
     - Test thoroughly in staging before production
     - Update one at a time, not all together
     - Wait 2-4 weeks after major release before adopting
   
   - **Regular Dependencies** (libraries, utilities):
     - Monthly review and update
     - Use `npm outdated` (or `pnpm outdated`) to check for updates
     - Test after updates
     - Update in batches (related packages together)
   
   - **Security Updates**:
     - Apply immediately after testing
     - Use `npm audit` (or `pnpm audit`) to identify vulnerabilities

3. **Use `package-lock.json` (npm) or `pnpm-lock.yaml` (pnpm)** - Always commit lock files

   ```bash
   # ✅ Always commit lock files
   git add package-lock.json
   # or: git add pnpm-lock.yaml (if using pnpm)
   
   # ❌ Never add to .gitignore
   # Lock files ensure consistent installs across environments
   ```

4. **Version Constraints**

   ```json
   {
     "engines": {
       "node": "20.x",    // Specify Node version
       "npm": "10.x"     // Specify package manager version (or "pnpm": ">=8.0.0" if using pnpm)
     }
   }
   ```

5. **Breaking Changes Strategy**

   ```bash
   # Before updating major versions:
   # 1. Read changelog/breaking changes
   # 2. Create feature branch
   # 3. Update dependency
   # 4. Fix breaking changes
   # 5. Test thoroughly
   # 6. Get code review
   # 7. Merge to main
   ```

6. **Dependency Audit Workflow**

   ```bash
   # Check for vulnerabilities (weekly)
   npm audit
   # or: pnpm audit
   
   # Fix automatically (if safe)
   npm audit fix
   # or: pnpm audit --fix
   
   # Review and update dependencies (monthly)
   npm outdated
   # or: pnpm outdated
   
   npm update
   # or: pnpm update --latest  # Only for non-critical deps
   ```

7. **When to Use Cutting-Edge Versions**

   - ✅ **Development/Experimental Features**: Use latest in feature branches
   - ✅ **New Projects**: Can start with latest stable
   - ❌ **Production Code**: Wait for stability (2-4 weeks after release)
   - ❌ **Critical Paths**: Never use bleeding edge

8. **Version Update Checklist**

   - [ ] Read changelog and breaking changes
   - [ ] Check GitHub issues for known problems
   - [ ] Update in feature branch
   - [ ] Run full test suite
   - [ ] Test manually in development
   - [ ] Deploy to staging and test
   - [ ] Get team review
   - [ ] Document any breaking changes
   - [ ] Update this document if patterns change

---

## ⚠️ Error Handling Patterns

### API Error Handling

1. **Always handle errors in API hooks**

   ```tsx
   // api/users/getUsers.ts
   const fetchUsers = async (url: string) => {
     try {
       const response = await fetch(url);
       
       if (!response.ok) {
         // Handle HTTP errors
         if (response.status === 401) {
           throw new Error('Unauthorized');
         }
         if (response.status === 404) {
           throw new Error('Users not found');
         }
         throw new Error(`Failed to fetch: ${response.statusText}`);
       }
       
       const data = await response.json();
       return usersResponseSchema.parse(data);
     } catch (error) {
       // Handle network errors, parsing errors, etc.
       if (error instanceof z.ZodError) {
         console.error('Validation error:', error.errors);
         throw new Error('Invalid response format');
       }
       throw error;
     }
   };

   export const useGetUsers = (params?: UseGetUsersParams) => {
     const { data, error, isLoading } = useSWR<UsersResponseDTO>(
       getUsersKey(params),
       fetchUsers,
       {
         onError: (error) => {
           // Log to error tracking service
           console.error('Failed to fetch users:', error);
         },
       }
     );

     return { data, error, isLoading };
   };
   ```

2. **Error Types and Messages**

   ```tsx
   // types/errors.ts
   export type ApiError = {
     message: string;
     code: string;
     statusCode?: number;
   };

   export class AppError extends Error {
     constructor(
       message: string,
       public code: string,
       public statusCode?: number
     ) {
       super(message);
       this.name = 'AppError';
     }
   }

   // Usage
   throw new AppError('User not found', 'USER_NOT_FOUND', 404);
   ```

3. **Error Boundaries for React Components**

   ```tsx
   // components/ErrorBoundary.tsx
   import * as React from 'react';

   type ErrorBoundaryProps = {
     children: React.ReactNode;
     fallback?: React.ReactNode;
   };

   type ErrorBoundaryState = {
     hasError: boolean;
     error: Error | null;
   };

   export class ErrorBoundary extends React.Component<
     ErrorBoundaryProps,
     ErrorBoundaryState
   > {
     constructor(props: ErrorBoundaryProps) {
       super(props);
       this.state = { hasError: false, error: null };
     }

     static getDerivedStateFromError(error: Error): ErrorBoundaryState {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
       // Log to error tracking service
     }

     render() {
       if (this.state.hasError) {
         return (
           this.props.fallback || (
             <div className="p-4 text-red-600">
               <h2>Something went wrong</h2>
               <p>{this.state.error?.message}</p>
             </div>
           )
         );
       }

       return this.props.children;
     }
   }
   ```

4. **Form Error Handling**

   ```tsx
   export const LoginForm = () => {
     const {
       register,
       handleSubmit,
       formState: { errors },
       setError,
     } = useForm<LoginFormValues>({
       resolver: zodResolver(loginSchema),
     });

     const onSubmit = handleSubmit(async (data) => {
       try {
         await login(data);
       } catch (error) {
         // Handle API errors
         if (error instanceof AppError) {
           if (error.code === 'INVALID_CREDENTIALS') {
             setError('root', {
               message: 'Invalid email or password',
             });
           } else {
             setError('root', { message: error.message });
           }
         } else {
           setError('root', {
             message: 'An unexpected error occurred',
           });
         }
       }
     });

     return (
       <form onSubmit={onSubmit}>
         {errors.root && (
           <div className="text-red-600">{errors.root.message}</div>
         )}
         {/* form fields */}
       </form>
     );
   };
   ```

5. **Error Display Patterns**

   ```tsx
   // ✅ Good: User-friendly error messages
   const ErrorMessage = ({ error }: { error: Error | null }) => {
     if (!error) return null;

     const userMessage =
       error.message === 'Failed to fetch'
         ? 'Unable to connect to server. Please check your internet connection.'
         : error.message;

     return (
       <div
         className="rounded-lg bg-red-50 border border-red-200 p-4"
         role="alert"
         aria-live="polite"
       >
         <p className="text-red-800">{userMessage}</p>
       </div>
     );
   };

   // Usage
   const { data, error } = useGetUsers();
   if (error) return <ErrorMessage error={error} />;
   ```

6. **Error Logging**

   ```tsx
   // utils/errorLogger.ts
   export const logError = (error: Error, context?: Record<string, unknown>) => {
     // Log to console in development
     if (process.env.NODE_ENV === 'development') {
       console.error('Error:', error, context);
     }

     // Send to error tracking service in production
     if (process.env.NODE_ENV === 'production') {
       // Example: Sentry, LogRocket, etc.
       // errorTrackingService.captureException(error, { extra: context });
     }
   };
   ```

---

## ♿ Accessibility Requirements

### WCAG 2.1 Level AA Compliance

1. **Semantic HTML**

   ```tsx
   // ✅ Good: Use semantic elements
   <header>
     <nav>
       <ul>
         <li><a href="/">Home</a></li>
       </ul>
     </nav>
   </header>
   <main>
     <article>
       <h1>Article Title</h1>
       <p>Content...</p>
     </article>
   </main>
   <footer>Footer content</footer>

   // ❌ Bad: Div soup
   <div>
     <div>
       <div>Home</div>
     </div>
   </div>
   ```

2. **ARIA Labels and Roles**

   ```tsx
   // ✅ Good: Proper ARIA attributes
   <button
     aria-label="Close dialog"
     aria-expanded={isOpen}
     onClick={handleClose}
   >
     <CloseIcon aria-hidden="true" />
   </button>

   // ✅ Good: Live regions for dynamic content
   <div role="status" aria-live="polite" aria-atomic="true">
     {loadingMessage}
   </div>

   // ✅ Good: Form labels
   <label htmlFor="email">
     Email Address
     <input
       id="email"
       type="email"
       aria-required="true"
       aria-describedby="email-error"
     />
   </label>
   {error && (
     <span id="email-error" role="alert" className="text-red-600">
       {error}
     </span>
   )}
   ```

3. **Keyboard Navigation**

   ```tsx
   // ✅ Good: Keyboard support
   export const Button = ({ onClick, children, ...props }: ButtonProps) => {
     const handleKeyDown = (e: React.KeyboardEvent) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onClick?.();
       }
     };

     return (
       <button
         onClick={onClick}
         onKeyDown={handleKeyDown}
         {...props}
       >
         {children}
       </button>
     );
   };

   // ✅ Good: Focus management
   export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
     const modalRef = React.useRef<HTMLDivElement>(null);

     React.useEffect(() => {
       if (isOpen && modalRef.current) {
         // Focus first focusable element
         const firstFocusable = modalRef.current.querySelector(
           'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
         ) as HTMLElement;
         firstFocusable?.focus();
       }
     }, [isOpen]);

     if (!isOpen) return null;

     return (
       <div
         ref={modalRef}
         role="dialog"
         aria-modal="true"
         aria-labelledby="modal-title"
       >
         {children}
       </div>
     );
   };
   ```

4. **Color Contrast**

   ```tsx
   // ✅ Good: WCAG AA compliant (4.5:1 for text)
   <button className="bg-blue-600 text-white">
     // Blue-600 (#2563eb) on white has 4.5:1 contrast
   </button>

   // ❌ Bad: Low contrast
   <button className="bg-gray-300 text-gray-400">
     // Gray-300 on gray-400 has low contrast
   </button>
   ```

5. **Focus Indicators**

   ```tsx
   // ✅ Good: Visible focus styles
   <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
     Click me
   </button>

   // Global focus styles in globals.css
   /* globals.css */
   *:focus-visible {
     outline: 2px solid theme('colors.blue.500');
     outline-offset: 2px;
   }
   ```

6. **Alt Text for Images**

   ```tsx
   // ✅ Good: Descriptive alt text
   <img
     src="/logo.png"
     alt="app logo"
   />

   // ✅ Good: Decorative images
   <img
     src="/decoration.png"
     alt=""
     role="presentation"
     aria-hidden="true"
   />
   ```

7. **Form Accessibility**

   ```tsx
   export const LoginForm = () => {
     const {
       register,
       formState: { errors },
     } = useForm<LoginFormValues>({
       resolver: zodResolver(loginSchema),
     });

     return (
       <form>
         <div>
           <label htmlFor="email">
             Email Address
             <span aria-label="required">*</span>
           </label>
           <input
             id="email"
             type="email"
             aria-required="true"
             aria-invalid={!!errors.email}
             aria-describedby={errors.email ? 'email-error' : undefined}
             {...register('email')}
           />
           {errors.email && (
             <span id="email-error" role="alert" className="text-red-600">
               {errors.email.message}
             </span>
           )}
         </div>
       </form>
     );
   };
   ```

8. **Screen Reader Testing**
   - Test with screen readers (NVDA, JAWS, VoiceOver)
   - Use browser DevTools accessibility panel
   - Run automated accessibility audits (Lighthouse, axe DevTools)

---

## ⚡ Performance Considerations

### Code Splitting and Lazy Loading

1. **Dynamic Imports for Routes**

   ```tsx
   // ✅ Good: Lazy load heavy components
   import dynamic from 'next/dynamic';

   const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
     loading: () => <div>Loading chart...</div>,
     ssr: false, // Disable SSR if not needed
   });

   // Usage
   export const DashboardPage = () => {
     return (
       <div>
         <HeavyChart />
       </div>
     );
   };
   ```

2. **Component Code Splitting**

   ```tsx
   // ✅ Good: Split large components
   const Modal = React.lazy(() => import('@/components/Modal'));

   export const Page = () => {
     return (
       <React.Suspense fallback={<div>Loading...</div>}>
         <Modal />
       </React.Suspense>
     );
   };
   ```

### Image Optimization

1. **Use Next.js Image Component**

   ```tsx
   // ✅ Good: Optimized images
   import Image from 'next/image';

   <Image
     src="/hero.jpg"
     alt="Hero image"
     width={1200}
     height={600}
     priority // For above-the-fold images
     placeholder="blur"
     blurDataURL="data:image/..."
   />

   // ❌ Bad: Regular img tag
   <img src="/hero.jpg" alt="Hero" />
   ```

### Memoization

1. **Use React.memo for Expensive Components**

   ```tsx
   // ✅ Good: Memoize expensive renders
   export const ExpensiveComponent = React.memo(({ data }: Props) => {
     // Expensive computation
     return <div>{/* render */}</div>;
   }, (prevProps, nextProps) => {
     // Custom comparison if needed
     return prevProps.data.id === nextProps.data.id;
   });
   ```

2. **Use useMemo for Expensive Calculations**

   ```tsx
   // ✅ Good: Memoize expensive calculations
   export const DataTable = ({ data }: DataTableProps) => {
     const sortedData = React.useMemo(() => {
       return data.sort((a, b) => a.date - b.date);
     }, [data]);

     return <table>{/* render */}</table>;
   };
   ```

3. **Use useCallback for Event Handlers**

   ```tsx
   // ✅ Good: Memoize callbacks
   export const Parent = ({ items }: ParentProps) => {
     const handleClick = React.useCallback((id: string) => {
       // Handle click
     }, []);

     return (
       <div>
         {items.map((item) => (
           <Child key={item.id} onClick={handleClick} />
         ))}
       </div>
     );
   };
   ```

### API Optimization

1. **SWR Configuration for Performance**

   ```tsx
   // ✅ Good: Configure SWR for optimal performance
   export const useGetUsers = (params?: UseGetUsersParams) => {
     return useSWR<UsersResponseDTO>(
       getUsersKey(params),
       fetchUsers,
       {
         revalidateOnFocus: false, // Don't refetch on window focus
         revalidateOnReconnect: true, // Refetch on reconnect
         dedupingInterval: 2000, // Dedupe requests within 2s
         keepPreviousData: true, // Keep previous data while loading
       }
     );
   };
   ```

2. **Pagination and Infinite Scroll**

   ```tsx
   // ✅ Good: Use SWR infinite for pagination
   import useSWRInfinite from 'swr/infinite';

   export const useInfiniteUsers = () => {
     const { data, error, size, setSize, isValidating } = useSWRInfinite(
       (index) => `/api/users?page=${index + 1}`,
       fetchUsers
     );

     const users = data ? data.flat() : [];
     const isLoadingMore = isValidating && data && data[size - 1];

     return {
       users,
       error,
       isLoadingMore,
       loadMore: () => setSize(size + 1),
     };
   };
   ```

### Bundle Size Optimization

1. **Tree Shaking**

   ```tsx
   // ✅ Good: Import only what you need
   import { format } from 'date-fns/format';
   import { parseISO } from 'date-fns/parseISO';

   // ❌ Bad: Import entire library
   import * as dateFns from 'date-fns';
   ```

2. **Avoid Large Dependencies**

   - Use lightweight alternatives when possible
   - Check bundle size impact before adding dependencies
   - Use `npm run build` to analyze bundle size

### Performance Monitoring

1. **Measure Core Web Vitals**

   ```tsx
   // pages/_app.tsx
   export function reportWebVitals(metric: NextWebVitalsMetric) {
     // Log to analytics
     console.log(metric);
     // Or send to analytics service
     // analytics.track(metric.name, metric.value);
   }
   ```

2. **Performance Best Practices Checklist**

   - ✅ Use Next.js Image component
   - ✅ Implement code splitting
   - ✅ Minimize JavaScript bundle size
   - ✅ Optimize API calls (caching, deduplication)
   - ✅ Use memoization for expensive operations
   - ✅ Lazy load below-the-fold content
   - ✅ Minimize re-renders
   - ✅ Use production builds for testing

---

## 📝 Naming Conventions

### Files

- **Components**: PascalCase - `Button.tsx`, `LoginForm.tsx`
- **Pages**: kebab-case - `index.tsx`, `login.tsx`
- **Utils**: camelCase - `formatDate.ts`, `createUrl.ts`
- **Hooks**: camelCase with `use` prefix - `useToggle.ts`
- **Constants**: camelCase file - `api.ts` (exports SCREAMING_SNAKE_CASE)
- **Types**: camelCase - `common.ts`, `api.types.ts`

### Variables & Functions

- **Variables**: camelCase - `userName`, `isLoading`
- **Functions**: camelCase - `handleClick`, `formatDate`
- **Components**: PascalCase - `Button`, `LoginForm`
- **Hooks**: camelCase with `use` - `useToggle`, `useAuth`
- **Constants**: SCREAMING_SNAKE_CASE - `API_URL`, `MAX_SIZE`
- **Types**: PascalCase - `UserProps`, `TransactionStatus`
- **Booleans**: Prefix with `is`, `has`, `should` - `isLoading`, `hasError`

### Folders

- **Lowercase with hyphens**: `api`, `components`, `utils`
- **No plurals for folders**: `component/` not `components/` for subfolders

---

## 🚫 Common Mistakes to Avoid

1. ❌ Default exports for components
2. ❌ `import React from 'react'`
3. ❌ Nested component folders (>1 level)
4. ❌ Types/interfaces in separate files (unless shared)
5. ❌ Using `any` type
6. ❌ Inline styles (unless dynamic)
7. ❌ Prop drilling (use Context/Jotai)
8. ❌ Side effects in render
9. ❌ Mutating state directly
10. ❌ Not using `useCallback`/`useMemo` for expensive operations

---

## 📋 Quick Reference Checklists

### Creating a Component

- [ ] Create file in `src/components/ComponentName.tsx`
- [ ] Use named export: `export const ComponentName`
- [ ] Import React as namespace: `import * as React from 'react'`
- [ ] Define props type: `export type ComponentNameProps = { ... }`
- [ ] Use semantic HTML elements
- [ ] Add ARIA labels if needed
- [ ] Style with Tailwind CSS classes
- [ ] Handle loading/error states if fetching data
- [ ] Add TypeScript types (no `any`)
- [ ] Test component manually
- [ ] Run linter: `npm run lint` (or `pnpm lint`)

**Template:**
```tsx
import * as React from "react";

export type ComponentNameProps = {
  // Define props here
};

export const ComponentName = ({ ...props }: ComponentNameProps) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

### Adding an API Endpoint

- [ ] Create schema file: `api/resource/resource.schema.ts`
- [ ] Define Zod schema and DTO type
- [ ] Create API file: `api/resource/getResource.ts` or `createResource.ts`
- [ ] Use `apiClient` from `@/lib/apiClient`
- [ ] Use `createUrl` for URL formatting
- [ ] Handle errors with try/catch
- [ ] Return typed result: `{ success: true, data }` or `{ success: false, error }`
- [ ] For SWR hooks: Export `useGetResource` hook
- [ ] Export key function: `getResourceKey`
- [ ] Handle loading states in consuming components
- [ ] Test API call manually

**Template (SWR Hook):**
```tsx
// api/resource/getResource.ts
import useSWR from "swr";
import { createUrl } from "@/utils/createUrl";
import { apiClient } from "@/lib/apiClient";
import { resourceSchema } from "./resource.schema";

const fetchResource = async (url: string) => {
  const data = await apiClient(url);
  return resourceSchema.parse(data);
};

export const getResourceKey = (params?: Params) =>
  createUrl("/api/resource", params);

export const useGetResource = (params?: Params) => {
  const { data, error, isLoading } = useSWR(
    getResourceKey(params),
    fetchResource
  );
  return { data, error, isLoading };
};
```

### Creating a Form

- [ ] Create form component in `src/components/FormName.tsx`
- [ ] Define Zod schema with validation rules
- [ ] Infer type: `type FormValues = z.infer<typeof schema>`
- [ ] Use `useForm` with `zodResolver`
- [ ] Register inputs with `{...register('fieldName')}`
- [ ] Add labels with `htmlFor` matching input `id`
- [ ] Display errors: `{errors.fieldName && <span>{errors.fieldName.message}</span>}`
- [ ] Handle submit with `handleSubmit(onSubmit)`
- [ ] Show loading state during submission
- [ ] Handle API errors with `setError('root', { message })`
- [ ] Add ARIA attributes for accessibility
- [ ] Test form validation
- [ ] Test form submission

**Template:**
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be 8+ characters"),
});

type FormValues = z.infer<typeof formSchema>;

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await submitForm(data);
    } catch (error) {
      setError("root", { message: "Submission failed" });
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Adding a New Page

- [ ] Create page file in `src/pages/route/page.tsx`
- [ ] Use default export for page component
- [ ] Import React as namespace
- [ ] Type as `NextPageWithLayout` if using layout
- [ ] Add `getLayout` function if using custom layout
- [ ] Add `<Head>` for page title and meta
- [ ] Handle loading states for data fetching
- [ ] Handle error states
- [ ] Use semantic HTML structure
- [ ] Test page navigation
- [ ] Test responsive design
- [ ] Check accessibility

**Template:**
```tsx
import * as React from "react";
import Head from "next/head";
import type { NextPageWithLayout } from "../_app";
import { DashboardLayout } from "@/components/DashboardLayout";

const NewPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Page Title | App Name</title>
      </Head>
      <main>
        {/* Page content */}
      </main>
    </>
  );
};

NewPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default NewPage;
```

### Adding a Custom Hook

- [ ] Create file in `src/hooks/useHookName.ts`
- [ ] Use named export: `export const useHookName`
- [ ] Import React as namespace
- [ ] Prefix with `use` (React requirement)
- [ ] Return array for simple state, object for complex
- [ ] Use `useCallback` for stable function references
- [ ] Use `useMemo` for expensive computations
- [ ] Handle errors appropriately
- [ ] Add JSDoc comments
- [ ] Test hook behavior

**Template:**
```tsx
import * as React from "react";

/**
 * Hook description
 * @param param - Parameter description
 * @returns Return value description
 */
export const useHookName = (param: string) => {
  const [state, setState] = React.useState<string>("");

  const handler = React.useCallback(() => {
    // Handler logic
  }, [dependencies]);

  return { state, handler };
};
```

### Adding a Utility Function

- [ ] Create file in `src/utils/functionName.ts`
- [ ] Use named export: `export const functionName`
- [ ] Keep function pure (no side effects)
- [ ] Add JSDoc comments with params and return
- [ ] Add TypeScript types (no `any`)
- [ ] Handle edge cases
- [ ] Add unit tests
- [ ] Export from `utils/index.ts` if commonly used

**Template:**
```tsx
/**
 * Function description
 * @param param - Parameter description
 * @returns Return value description
 * @example
 * const result = functionName("input");
 */
export const functionName = (param: string): string => {
  // Implementation
  return result;
};
```

---

## ✅ Quick Checklist

Before committing code, ensure:

- [ ] All React imports use `import * as React from 'react'`
- [ ] All components use named exports
- [ ] Component folder structure is flat (max 1 level)
- [ ] API calls use SWR with proper error handling
- [ ] Forms use React Hook Form + Zod
- [ ] Utils are pure functions with named exports
- [ ] Constants use SCREAMING_SNAKE_CASE
- [ ] Custom hooks start with `use`
- [ ] No linter errors
- [ ] Styles use Tailwind CSS / shadcn/ui
- [ ] No `any` types
- [ ] Proper error handling (try/catch, error boundaries)
- [ ] Accessibility: semantic HTML, ARIA labels, keyboard navigation
- [ ] Performance: memoization where needed, code splitting for heavy components
- [ ] Tests: unit tests for critical functionality
- [ ] Dependencies: lock file committed, versions pinned

---

## 📚 Additional Resources

- [React Docs](https://react.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [SWR](https://swr.vercel.app/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Radix UI](https://www.radix-ui.com/)

---

**Last Updated**: December 2025
**Version**: 2.1.0
