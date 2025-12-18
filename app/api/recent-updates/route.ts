// app/api/recent-updates/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const supabaseAdmin = createSupabaseAdmin();

// Define the structure for a recent update item
interface RecentUpdate {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export async function GET(request: Request) {
  try {
    console.log(`API Route: /api/recent-updates called at ${new Date().toISOString()}`);
    const url = new URL(request.url)
    let year = url.searchParams.get('year')
    let branch = url.searchParams.get('branch')

    if (!year || !branch) {
      console.warn('API Updates: Missing year or branch parameters.');
    }

    // Query Supabase for recent updates
    let query = supabaseAdmin
      .from('recent_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // If user has year and branch, filter by them, otherwise show all updates
    if (year && branch) {
      query = query
        .eq('year', parseInt(year, 10))
        .eq('branch', branch)
    }

    const updatesRes = await query
    if (updatesRes.error) {
      console.error('API Error: Supabase query failed:', updatesRes.error)
      return NextResponse.json({ error: 'Failed to load recent updates from database' }, { status: 500 })
    }
    const updates = updatesRes.data

    console.log(`API Route: Found ${updates?.length || 0} recent updates`);

    // Hard-coded recent updates
    const staticUpdates: RecentUpdate[] = [
      {
        id: 'static-0',
        title: 'Recent Updates Sectionsss',
        date: '03 November 2025',
        description: 'Recent Updates Section lists the recent updates to the resource hub, for the current year and branch'
      }
      // {
      //     id: 'static-1',
      //     title: 'Syllabus and Timetables were updated',
      //     date: '01 October 2025',
      //     description: 'Welcome to the new academic year with updated resources and features.'
      // },
    ];

    // Transform the data to match the expected format
    const dbUpdates: RecentUpdate[] = (updates || []).map(update => ({
      id: update.id,
      title: update.title || 'No Title',
      date: update.date || '',
      description: update.description || undefined
    }));

    // Combine static updates (first) with database updates
    const allUpdates = [...staticUpdates, ...dbUpdates];

    console.log(`API Route: Returning ${allUpdates.length} recent updates (${staticUpdates.length} static, ${dbUpdates.length} from DB)`);
    return NextResponse.json(allUpdates);

  } catch (error: any) {
    console.error("API Error during Supabase query:", error);
    return NextResponse.json({ error: "Failed to fetch recent updates from database." }, { status: 500 });
  }
}