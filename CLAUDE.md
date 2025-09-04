# App Scheduling - Project Documentation

## Overview
A Next.js-basd scheduling application for managing construction jobs, tasks, and suppliers with a hierarchical owner structure.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Data**: Supabase Postgress
- **Authentication**: Supabase auth
- **Language**: TypeScript
- **Styling**: Tailwind CSS (single light theme only - no dark mode)
- **UI Components**: shadcn/ui
- **Code Quality**: Biome (linting & formatting)

## Project Structure
```
src/
├── app/
│   ├── models/         # TypeScript interfaces and enums
│   │   ├── owner.model.ts
│   │   ├── job.model.ts
│   │   ├── supplier.model.ts
│   │   └── task.model.ts
│   ├── jobs/
│   │   ├── page.tsx    # Jobs listing page
│   │   └── [id]/
│   │       └── page.tsx # Job detail page with tasks
│   └── page.tsx        # Home page
├── components/
│   ├── ui/             # Reusable UI components
│   │   ├── accordion.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   └── ...
│   ├── sidebar.tsx     # Navigation sidebar with owners/jobs
│   └── dashboard-layout.tsx
└── lib/
    └── utils.ts        # Utility functions

```

## Key Features

### 1. Hierarchical Navigation
- Owners contain multiple jobs
- Jobs contain Job tasks organized by stages
- Sidebar with search functionality that filters jobs while maintaining owner structure
- Auto-expands owner when navigating directly to a job

### 2. Task Management
- Tasks grouped by stages (Base Stage, Frame Stage, etc.)
- Each task has:
  - Progress status (To Call, Called, Confirmed, Started, Completed, Not Required)
  - Supplier assignment with color-coded badges
  - Due dates
  - Notes
  - PO and Plan attachments (displayed as PDF badges)
  - Email templates

### 3. Visual Indicators
- Color-coded progress bars for task status
- Supplier badges with customizable colors
- Owner and job icons with matching colors
- PDF badges for document attachments

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Format code with Biome
npm run format
```

## Data Models

### ITask
- `id`: Unique identifier
- `name`: Task name
- `supplierId`: Reference to supplier
- `progress`: ETaskProgress enum value
- `status`: ETaskStatus enum value
- `taskStageId`: Reference to task stage
- `notes`: Optional notes
- `startDate`: Task start date
- `purchaseOrderLinks`: Array of PO document links
- `planLinks`: Array of plan document links

### IOwner
- `id`: Unique identifier
- `name`: Owner name
- `color`: Optional hex color for visual indicators
- `jobs`: Array of IOwnerJob references

### ISupplier
- `id`: Unique identifier
- `name`: Supplier name

## Recent Changes

### Theme Simplification
- Removed dark theme support to maintain a single consistent light theme
- App now uses only the light green and off-grey color scheme
- No theme switching functionality

## Environment Setup

No environment variables are currently required. When adding backend integration, create a `.env` file with necessary configuration.



## Code Style Guidelines

### Import Conventions
- **IMPORTANT**: Always use named imports from React, never namespace imports
  - ✅ Correct: `import { useState, useEffect } from "react"`
  - ❌ Incorrect: `import * as React from "react"`
- **React Types**: Always import React types directly as named imports
  - ✅ Correct: `import { ReactNode, ComponentProps, FC } from "react"`
  - ❌ Incorrect: `import * as React from "react"` then using `React.ReactNode`
  - ❌ Incorrect: `React.ComponentProps`, `React.FC`, etc.
- Preffer direct type imports when only types are imported
  - ✅ Correct: `import type { ComponentProps } from "react"`
  - ❌ Incorrect: `import { type ComponentProps } from "react"`
  - ❌ Incorrect: `import { ComponentProps } from "react"`
- Use specific imports for better tree-shaking and cleaner code
- Group imports logically: React first, then external libraries, then local imports

### TypeScript Naming Conventions
- **Interfaces**: Always prefix with `I` (e.g., `ITask`, `IOwner`, `ISupplier`)
- **Enums**: Always prefix with `E` (e.g., `ETaskProgress`, `ETaskStatus`)
- **Types**: Always prefix with `T` (e.g., `TCustomType`)
- Use TypeScript interfaces for type safety
- Prefer type inference where possible
- Export interfaces that may be reused

### Component Structure
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

## Contributing

When making changes:
1. Follow the existing code structure and patterns
2. Use named imports (especially for React)
3. Use TypeScript interfaces for type safety
4. Maintain consistent styling with Tailwind CSS
5. Run linting and type checking before committing
6. Update this documentation for significant changes