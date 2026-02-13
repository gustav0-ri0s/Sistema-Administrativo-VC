
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnyTable() {
    console.log('Checking classrooms table...');
    const { data: c, error: cErr } = await supabase.from('classrooms').select('*').limit(5);
    if (cErr) console.log('Error classrooms:', cErr);
    else console.log('Classrooms:', c ? c.length : 0);

    console.log('Checking profiles table...');
    const { data: p, error: pErr } = await supabase.from('profiles').select('*').limit(5);
    if (pErr) console.log('Error profiles:', pErr);
    else console.log('Profiles:', p ? p.length : 0);
}

checkAnyTable();
