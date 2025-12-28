/**
 * Project-wide constants and configuration values
 */

export const DEFAULT_REGULATION = 'R23';

export const CATEGORY_TITLES: Record<string, string> = {
  notes: 'Notes',
  assignments: 'Assignments',
  papers: 'Papers',

};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  notes: 'Lecture notes and study materials',
  assignments: 'Assignment questions all batches',
  papers: 'Mid-1, Mid-2, Previous year papers',

};

// Map old year numbers (1,2,3,4) to batch years based on current academic progression
// Used for legacy parameter support in API routes
export const YEAR_TO_BATCH_MAPPING: Record<number, number> = {
  1: 2024, // Year 1 -> 2024 batch (no 2025 batch in DB yet)
  2: 2024, // Year 2 -> 2024 batch
  3: 2023, // Year 3 -> 2023 batch
  4: 2022, // Year 4 -> 2022 batch
};

export const BRANCH_CODES = ['CSE', 'AIML', 'AI', 'DS', 'ECE', 'EEE', 'MEC', 'CE', 'IT', 'CS'] as const;

export const REGULATIONS = ['R23', 'R20', 'R16', 'R10'] as const;

export const CACHE_TTL = {
  RESOURCES: 300, // 5 minutes
  SUBJECTS: 3600, // 1 hour
  STATIC_DATA: 86400, // 24 hours
  DYNAMIC_DATA: 300, // 5 minutes
};
