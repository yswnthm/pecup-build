# Plan: Codebase Cleanup and Optimization

## Phase 1: Environment & Tooling Setup [checkpoint: c1e19d6]
- [x] Task: Create a new cleanup branch `cleanup/codebase-optimization` 6f15dfb
- [x] Task: Install and configure `knip` using `bun` 273a19f
- [x] Task: Establish a baseline bundle size report for comparison d75824d
- [x] Task: Conductor - User Manual Verification 'Environment & Tooling Setup' (Protocol in workflow.md) 28844d4

## Phase 2: Dead Code Elimination [checkpoint: 01689e9]
- [x] Task: Execute `knip` to identify unused files and remove them 0a738f0
- [x] Task: Identify and remove unused dependencies from `package.json` 56d1155
- [x] Task: Prune unused exports and variables identified by `knip` c9de876
- [x] Task: Run existing test suite to ensure no regressions after removal 2e4f745
- [x] Task: Conductor - User Manual Verification 'Dead Code Elimination' (Protocol in workflow.md) 4a8492f

## Phase 3: Standardization & Refactoring
- [x] Task: Centralize UI components (consolidate fragmented components into `components/ui/`) 412727f
- [~] Task: Refactor API routes to use a standardized response/error structure
- [ ] Task: Refactor data fetching hooks for consistent patterns
- [ ] Task: Extract hardcoded strings and magic numbers into `lib/constants.ts` or config files
- [ ] Task: Update/Write tests for standardized components and hooks
- [ ] Task: Conductor - User Manual Verification 'Standardization & Refactoring' (Protocol in workflow.md)

## Phase 4: Performance & Optimization
- [ ] Task: Implement Code Splitting and Lazy Loading for heavy components/routes
- [ ] Task: Apply `memo`, `useMemo`, and `useCallback` to optimize React rendering in key areas
- [ ] Task: Optimize TanStack Query configurations for better caching and request deduping
- [ ] Task: Verify performance improvements via manual profiling and build logs
- [ ] Task: Conductor - User Manual Verification 'Performance & Optimization' (Protocol in workflow.md)

## Phase 5: Final Quality Gate & Verification
- [ ] Task: Run full test suite with coverage report (>80% target)
- [ ] Task: Execute final linting and type checking (`tsc`, `eslint`)
- [ ] Task: Compare final bundle size with baseline
- [ ] Task: Conductor - User Manual Verification 'Final Quality Gate & Verification' (Protocol in workflow.md)
