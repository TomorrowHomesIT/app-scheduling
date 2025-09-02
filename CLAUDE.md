# App Scheduling - Project Documentation

## Overview
A Next.js-based scheduling application for managing construction jobs, tasks, and suppliers with a hierarchical owner structure.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
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
    ├── mock-data.ts    # Mock data for development
    └── utils.ts        # Utility functions

```

## Key Features

### 1. Hierarchical Navigation
- Owners contain multiple jobs
- Jobs contain tasks organized by stages
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

# Run type checking
npm run typecheck

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
- `startDate`: Task due date
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

### Latest Updates
- Implemented sidebar search that filters jobs while maintaining owner structure
- Added color props to Owner and Supplier models
- Added owner/checklist icons with color support in sidebar
- Removed checkboxes from task tables
- Reorganized table columns: Name, Supplier, Start date, Notes, PO, Plans, Email Template, Progress
- Added PDF badges for document attachments
- Browser title updates to show current job name

## Notes for Future Development

1. **Mock Data**: Currently using mock data from `src/lib/mock-data.ts`. This should be replaced with actual API calls or database connections.

2. **Authentication**: No authentication system is currently implemented.

3. **State Management**: Currently using React's built-in state. Consider implementing a state management solution (Redux, Zustand, etc.) as the app grows.

4. **File Uploads**: PDF attachment functionality currently only displays badges. Actual file upload/download needs to be implemented.

5. **Email Templates**: Email template feature is displayed but not yet functional.

## Environment Setup

No environment variables are currently required. When adding backend integration, create a `.env.local` file with necessary configuration.

## Browser Compatibility

Tested and optimized for modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Known Issues

- None currently documented

## Code Style Guidelines

### Import Conventions
- **IMPORTANT**: Always use named imports from React, never namespace imports
  - ✅ Correct: `import { useState, useEffect } from "react"`
  - ❌ Incorrect: `import * as React from "react"`
- **React Types**: Always import React types directly as named imports
  - ✅ Correct: `import { ReactNode, ComponentProps, FC } from "react"`
  - ❌ Incorrect: `import * as React from "react"` then using `React.ReactNode`
  - ❌ Incorrect: `React.ComponentProps`, `React.FC`, etc.
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

Progress Modal System

  1. Shared Configuration (/models/task.const.ts):
    - Added CTaskProgressConfig with consistent styling for all progress states
    - Includes className for badges and progressColor for the progress indicator bar
  2. Reusable Progress Badge (/components/ui/progress-badge.tsx):
    - Uses the shared configuration for consistent styling
    - Can be used as both a static badge and clickable button
    - Matches the pattern of the status badge
  3. Progress Selection Modal (/components/modals/progress/progress-modal.tsx):
    - Modal interface similar to the status modal
    - Shows all progress options as larger buttons for easy selection
    - Includes ProgressTrigger component for easy integration
  4. Task Table Integration:
    - Removed old getProgressBadge function and uses the new shared config
    - Added handleProgressChange function that only updates the task (no extra API call needed)
    - Integrated ProgressTrigger to replace the old static progress display

  The system now provides:
  - Consistent Styling: All progress badges use the same configuration
  - Modal Selection: Click any progress badge to open a selection modal
  - Store Integration: Updates are handled through the existing updateTask function
  - Reusable Components: Both badge and modal can be used throughout the app

  The progress modal follows the same pattern as the status modal but only updates the task
  directly without needing additional API requests, as requested.