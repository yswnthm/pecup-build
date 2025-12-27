# Track Plan: Implement Distinct URL Routing and Navigation

## Phase 1: Routing Foundation & Core Hierarchy
Goal: Establish the basic dynamic routing structure for academic resources.

- [x] Task: Define dynamic routes for `[regulation]/[branch]/[yearSem]` in the App Router. a9e26aa
    - [x] Task: Write Tests for URL parameter parsing and validation.
    - [x] Task: Implement route handlers to display placeholder content for specific semesters.
- [x] Task: Implement dynamic routing for resource categories (e.g., `/resources/[category]`).
    - [x] Task: Write Tests for category-based routing.
    - [x] Task: Implement category-specific view logic.
- [x] Task: Refactor Resource Category routes to use context-based URLs (e.g., `/[regulation]/[branch]/[yearSem]/[category]`). 42d25b9
    - [x] Task: Create context-based category page.
    - [x] Task: Update `ResourcesFiltersClient` to generate hierarchical URLs.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Routing Foundation & Core Hierarchy' (Protocol in workflow.md)

## Phase 2: Subject & Direct Link Integration
Goal: Enable deep linking down to the subject and individual resource level.

- [x] Task: Implement nested subject routes under context (e.g., `/[regulation]/[branch]/[yearSem]/[category]/[subject]`).
    - [x] Task: Write Tests for subject-level deep links.
    - [x] Task: Implement subject detail views with direct resource links. 5fc9073
- [x] Task: Verify global navigation (Header/Breadcrumbs) updates correctly based on the URL. 0d8e376
    - [x] Task: Write Tests for breadcrumb generation from URL path.
    - [x] Task: Implement/Refactor Breadcrumb component to be URL-aware.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Subject & Direct Link Integration' (Protocol in workflow.md)
