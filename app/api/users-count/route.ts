import { apiSuccess, apiError } from '@/lib/api-utils';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    // Count only from profiles (single source of truth for registered users)
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching profiles count:', error);
      return apiError('Failed to fetch users count', 500);
    }

    const totalUsers = count || 0;

    return apiSuccess({
      totalUsers,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Users count API error:', error);
    return apiError('Internal server error', 500);
  }
}
