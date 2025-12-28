import { NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase';
import { academicConfig } from '@/lib/academic-config';
import { apiError } from '@/lib/api-utils';

// Helper function to sanitize payload for logging
function sanitizeForLogging(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  const sensitiveKeys = ['password', 'email', 'ssn', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  return sanitized;
}

function maskEmail(e?: string | null) {
  if (!e) return '[unknown]';
  const [u, d] = e.split('@');
  return `${u?.slice(0, 2) || ''}***@${d || ''}`;
}

interface ProfilePayload {
  name: string;
  branch_id: string;
  year_id?: string;
  academic_year_level?: number;
  semester_id: string;
  roll_number: string;
  section?: string;
}

function validatePayload(body: any): { ok: true; data: ProfilePayload } | { ok: false; error: string } {
  const { name, branch_id, year_id, academic_year_level, semester_id, roll_number, section } = body;

  if (!name || typeof name !== 'string') {
    return { ok: false, error: 'Name is required and must be a string' };
  }
  if (!branch_id || typeof branch_id !== 'string') {
    return { ok: false, error: 'Branch ID is required and must be a string' };
  }
  if (!semester_id || typeof semester_id !== 'string') {
    return { ok: false, error: 'Semester ID is required and must be a string' };
  }
  if (!roll_number || typeof roll_number !== 'string') {
    return { ok: false, error: 'Roll number is required and must be a string' };
  }

  // Must have either year_id OR academic_year_level
  if (!year_id && !academic_year_level) {
    return { ok: false, error: 'Either year_id or academic_year_level is required' };
  }

  return { ok: true, data: { name, branch_id, year_id, academic_year_level, semester_id, roll_number, section } };
}

export async function GET() {
  return apiError('Unauthorized', 401);
}

export async function POST(request: Request) {
  return apiError('Unauthorized', 401);
}