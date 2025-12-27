# Track Plan: Implement Distinct URL Routing and Navigation

## Phase 1: Routing Foundation & Core Hierarchy
Goal: Establish the basic dynamic routing structure for academic resources.

- [ ] Task: Define dynamic routes for `[regulation]/[branch]/[yearSem]` in the App Router.
    - [ ] Task: Write Tests for URL parameter parsing and validation.
    - [ ] Task: Implement route handlers to display placeholder content for specific semesters.
- [ ] Task: Implement dynamic routing for resource categories (e.g., `/resources/[category]`).
    - [ ] Task: Write Tests for category-based routing.
    - [ ] Task: Implement category-specific view logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Routing Foundation & Core Hierarchy' (Protocol in workflow.md)

## Phase 2: Subject & Direct Link Integration
Goal: Enable deep linking down to the subject and individual resource level.

- [ ] Task: Implement nested subject routes (e.g., `/resources/[category]/[subject]`).
    - [ ] Task: Write Tests for subject-level deep links.
    - [ ] Task: Implement subject detail views with direct resource links.
- [ ] Task: Verify global navigation (Header/Breadcrumbs) updates correctly based on the URL.
    - [ ] Task: Write Tests for breadcrumb generation from URL path.
    - [ ] Task: Implement/Refactor Breadcrumb component to be URL-aware.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Subject & Direct Link Integration' (Protocol in workflow.md)
