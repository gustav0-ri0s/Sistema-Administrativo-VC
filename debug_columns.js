
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log('Inspecting columns of course_assignments (empty table?)');
    try {
        // Insert a dummy row to inspect, then delete? No, that's risky.
        // Try selecting limit 0? 
        // Supabase/Postgrest doesn't easily return schema info via select unless rows exist.
        // Let's try inserting a dummy row if safe? No.

        // Let's try selecting 'created_at' specifically.
        const { data, error } = await supabase.from('course_assignments').select('created_at').limit(1);
        if (error) console.log('Error selecting created_at:', error.message);
        else console.log('Selected created_at successfully (even if 0 rows)');
    } catch (e) {
        console.log(e);
    }
}

inspectColumns();
