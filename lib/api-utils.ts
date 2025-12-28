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
