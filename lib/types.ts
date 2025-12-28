// Database entity types for the refactored schema
// These types match the new normalized lookup table design

export interface Branch {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Year {
  id: string;
  batch_year: number;
  display_name: string;
  created_at: string;
}

export interface Semester {
  id: string;
  semester_number: number;
  year_id: string;
  created_at: string;
  year?: Year;
}

export interface Student {
  id: string;
  roll_number: string;
  name: string;
  email: string;
  branch_id: string;
  year_id: string;
  semester_id: string;
  section?: string;
  created_at: string;
  updated_at: string;
  branch?: Branch;
  year?: Year;
  semester?: Semester;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  drive_link: string;
  file_type: string;
  branch_id: string;
  year_id: string;
  semester_id: string;
  uploader_id?: string;
  created_at: string;
  // Legacy fields that might still exist during transition
  category?: string;
  subject?: string;
  unit?: number;
  date?: string;
  is_pdf?: boolean;
  // Additional legacy compatibility fields for UI backward compatibility
  name?: string; // legacy alias for title
  url?: string; // legacy alias for drive_link
  type?: string; // legacy alias for file_type
  regulation?: string;
  archived?: boolean;
  deleted_at?: string;
  updated_at?: string;
  // Joined relations
  branch?: Branch;
  year?: Year;
  semester?: Semester;
  uploader?: Student;
}

export interface AcademicCalendar {
  id: string;
  current_year_id: string;
  current_semester_id: string;
  last_updated: string;
  updated_by?: string;
  current_year?: Year;
  current_semester?: Semester;
}

// Subject types
export type ResourceType = 'resources';

export interface Subject {
  id: string;
  code: string;
  name: string;
  full_name?: string;
  default_units: number;
  resource_type: ResourceType;
  created_at: string;
  updated_at: string;
}

// Utility types
export type AdminRole = 'admin' | 'yeshh';
export type UserRole = 'student' | 'representative' | 'admin' | 'yeshh' | null;

// Database query types
export interface ResourceFilters {
  branch_id?: string;
  year_id?: string;
  semester_id?: string;
  uploader_id?: string;
  category?: string;
  subject?: string;
  unit?: number;
  file_type?: string;
  archived?: boolean;
}

export interface UserPermissions {
  canRead: {
    resources: boolean;

    recentUpdates: boolean;
    exams: boolean;
    profiles: boolean;
  };
  canWrite: {
    resources: boolean;

    recentUpdates: boolean;
    exams: boolean;
    profiles: boolean;
  };
  canDelete: {
    resources: boolean;

    recentUpdates: boolean;
    exams: boolean;
    profiles: boolean;
  };
  canPromoteSemester: boolean;
  scopeRestrictions?: {
    branchIds?: string[];
    yearIds?: string[];
  };
}

