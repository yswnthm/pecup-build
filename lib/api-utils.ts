import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    data,
  }, { status });
}

export function apiError(message: string, status = 500, code?: string, details?: any) {
  return NextResponse.json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  }, { status });
}

/**
 * Client-side helper to fetch from standardized API routes
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const body = await res.json();

  if (!res.ok || body.success === false) {
    const error = body.error || { message: `Request failed with status ${res.status}` };
    throw new Error(error.message);
  }

  // Some routes might not wrap in {success: true, data: T} yet for compatibility
  // If success is true, return data. If no success field, assume legacy and return body.
  if (body.success === true) {
    return body.data as T;
  }
  
  return body as T;
}
