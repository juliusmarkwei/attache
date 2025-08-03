# App Directory Structure

This directory contains all the application code organized in a clean, maintainable structure.

## Directory Structure

```
app/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard-specific components
│   ├── providers/      # Context providers
│   └── ui/            # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions (cn, etc.)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and constants
├── api/                # API routes
├── dashboard/          # Dashboard pages
├── login/              # Login pages
└── globals.css         # Global styles
```

## Key Improvements

### 1. Type Safety

- **`types/index.ts`**: Centralized type definitions for all interfaces
- Proper TypeScript interfaces for Company, Document, Auth, etc.
- Type-safe component props

### 2. Custom Hooks

- **`hooks/useAuth.ts`**: Centralized authentication logic
- Reusable across components
- Clean separation of concerns

### 3. Utility Functions

- **`utils/formatters.ts`**: Common formatting functions
- **`utils/constants.ts`**: App-wide constants and configuration
- Reusable across the application

### 4. Component Organization

- **`components/ui/`**: Reusable UI components
- **`components/auth/`**: Authentication-specific components
- **`components/dashboard/`**: Dashboard-specific components
- **`components/providers/`**: Context providers

## Usage Examples

### Using Types

```typescript
import { Company, Document, AuthStep } from '../types';
```

### Using Hooks

```typescript
import { useAuth } from '../hooks/useAuth';

const { company, loading, handleLogout } = useAuth();
```

### Using Utilities

```typescript
import { formatFileSize, formatDate } from '../utils/formatters';
import { API_ENDPOINTS, SUCCESS_MESSAGES } from '../utils/constants';
```

### Using Components

```typescript
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
```

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Reusability**: Shared utilities and components
3. **Type Safety**: Comprehensive TypeScript definitions
4. **Consistency**: Centralized constants and configurations
5. **Scalability**: Easy to add new features and components
