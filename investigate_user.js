
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigate() {
    console.log('Searching for Jacqueline...');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%jacqueline%');

    if (pError) {
        console.error('Error finding profile:', pError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('Profile not found.');
        return;
    }

    const profile = profiles[0];
    console.log('Found Profile:', profile.id, profile.full_name, profile.role);

    console.log('Checking course_assignments for this profile...');
    const { data: assignments, error: aError } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('profile_id', profile.id);

    if (aError) {
        console.error('Error fetching assignments:', aError);
    } else {
        console.log('Assignments found:', assignments.length);
        console.log(JSON.stringify(assignments, null, 2));
    }

    // Check unrelated tables just in case
    console.log('Listing all tables to find where attendance assignments might be...');
    // Since we can't query information_schema easily, let's try to guess common names based on features.
    // The user mentioned "sistema de asistencia".
    // Maybe `teacher_classrooms`? `tutor_assignments`?
}

investigate();
