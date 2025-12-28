const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubjects() {
    console.log('Checking subject_offerings for CSE 3-1...');

    const { data, error } = await supabase
        .from('subject_offerings')
        .select('*')
        .eq('branch', 'CSE')
        .eq('year', 3)
        .eq('semester', 1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} offerings for CSE 3-1.`);

    // Group by regulation
    const byReg = {};
    data.forEach(r => {
        byReg[r.regulation] = (byReg[r.regulation] || 0) + 1;
    });
    console.log('Counts by regulation:', byReg);

    if (data.length > 0) {
        console.log('Sample offering:', data[0]);

        const subjectIds = data.map(o => o.subject_id);
        const { data: subData, error: subError } = await supabase
            .from('subjects')
            .select('*')
            .in('id', subjectIds);

        if (subError) {
            console.error('Error fetching subjects:', subError);
        } else {
            console.log('Subjects found:', subData);
        }
    }
}

checkSubjects();
