
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateRamirez() {
    console.log('Searching for Ramirez...');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%ramirez%');

    if (pError) console.error(pError);
    else {
        console.log('Profiles found:', profiles.length);
        profiles.forEach(p => console.log(`ID: ${p.id}, Name: ${p.full_name}, Role: ${p.role}`));

        if (profiles.length > 0) {
            const pid = profiles[0].id; // Take the first one (Jacqueline?)
            console.log(`Checking assignments for ${pid}...`);
            const { data: a, error: aErr } = await supabase.from('course_assignments').select('*').eq('profile_id', pid);

            if (aErr) console.error(aErr);
            else {
                console.log('Course Assignments:', a.length);
                console.table(a);
            }
        }
    }

    console.log('Checking classrooms columns...');
    const { data: c, error: cErr } = await supabase.from('classrooms').select('*').limit(1);
    if (!cErr && c.length > 0) {
        console.log('Classroom columns:', Object.keys(c[0]));
    }
}

investigateRamirez();
