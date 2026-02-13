
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugServiceCall() {
    console.log('Testing courseAssignmentService.getAll() query...');

    // exact query from service
    const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Query Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Query Success. Rows:', data.length);
        if (data.length > 0) {
            console.log('First row keys:', Object.keys(data[0]));
            console.log('First row sample:', data[0]);
        }
    }
}

debugServiceCall();
