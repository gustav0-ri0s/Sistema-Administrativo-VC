
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllProfiles() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');

    if (error) console.error(error);
    else {
        console.table(profiles);
        // Maybe her name is not "Jacqueline" in 'full_name' but in 'first_name' column that doesn't exist? (User said 'JACQUELINE RAMIREZ PUTPAÑA')
        // We know 'full_name' exists from previous query. 
        // Maybe I need to enable 'ilike' (it might not be case insensitive on free tier in JS client if configured?)
        // Or using 'like' for broader match.
        // Let's filter in JS.
        const matches = profiles.filter(p => p.full_name?.toLowerCase().includes('ramirez') || p.email?.toLowerCase().includes('ramirez'));
        console.log('Matches for ramirez:', matches);

        const matches2 = profiles.filter(p => p.full_name?.toLowerCase().includes('jacky') || p.email?.toLowerCase().includes('jacky'));
        console.log('Matches for jacky:', matches2);

        if (matches.length > 0) {
            const p = matches[0];
            console.log(`User: ${p.full_name}, ID: ${p.id}`);

            // Check ANY table that might link teacher to classroom
            // Maybe 'attendance_assignments'? we failed on that check earlier.
            // Maybe 'classroom_tutor'?
        }
    }
}

listAllProfiles();
