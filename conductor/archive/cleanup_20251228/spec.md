# Specification: Codebase Cleanup and Optimization

## 1. Overview
This track focuses on a comprehensive cleanup and optimization of the Pecup codebase. The primary goals are to eliminate technical debt (unused code, files, and dependencies), standardize patterns for maintainability, and improve runtime performance and bundle size.

## 2. Functional Requirements

### 2.1 Tooling & Cleanup
- **Install Knip:** Integrate `knip` using `bun` to identify unused files, dependencies, and exports.
- **Dead Code Removal:** Delete unused files, remove unused dependencies from `package.json`, and prune unused exports/variables across the project.
- **Clean Branch:** All changes must be performed in a fresh branch to ensure a clean slate.

### 2.2 Refactoring & Standardization
- **UI Centralization:** Consolidate fragmented UI components into a centralized system (e.g., ensuring consistent use of base components from `components/ui/`).
- **API & Hook Standardization:** Standardize the structure of API routes and data fetching hooks (e.g., consistent error handling and response types).
- **Magic Number Removal:** Replace hardcoded strings and "magic numbers" with descriptive constants or configuration files.

## 3. Non-Functional Requirements

### 3.1 Performance & Optimization
- **Bundle Size Reduction:** Minimize the final bundle size through dead code elimination and dependency pruning.
- **Runtime Optimization:**
  - Implement Code Splitting and Lazy Loading for heavy components and routes.
  - Optimize React rendering by applying `memo`, `useMemo`, and `useCallback` where appropriate to prevent unnecessary re-renders.
- **Data Fetching:** Optimize data fetching patterns using caching and request deduping (leveraging TanStack Query capabilities).

### 3.2 Maintainability
- **TypeScript Strictness:** Ensure all refactored code maintains high type safety standards.
- **Consistent Structure:** Align the codebase with the project's established folder structure and naming conventions.

## 4. Acceptance Criteria
- `knip` runs successfully with zero (or minimal/justified) unused items reported.
- All unit tests pass, ensuring no regressions during cleanup/refactoring.
- Bundle size is measurably reduced (can be verified via build logs).
- API routes and UI components follow the new standardized patterns.
- No hardcoded configuration strings remain in the main logic.

## 5. Out of Scope
- Major architectural shifts (e.g., moving away from Next.js or Supabase).
- Significant UI/UX redesigns (focus is on internal cleanup, not visual changes).
- Implementing new features unrelated to the cleanup.
