
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Inspecting schema...");

    console.log("\n--- Curricular Areas ---");
    const { data: areas, error: areasError } = await supabase
        .from('curricular_areas')
        .select('*')
        .order('id');

    if (areasError) {
        console.error("Error fetching areas:", areasError);
    } else {
        console.table(areas);
    }

    console.log("\n--- Competencies (For relevant areas) ---");
    // We specifically want to check 'Tutoría' and 'Competencias Transversales' if it exists
    // Let's filter by names that sound relevant
    const relevantIds = areas?.filter(a =>
        a.name.toLowerCase().includes('tutor') ||
        a.name.toLowerCase().includes('transversal') ||
        a.name.toLowerCase().includes('tic')
    ).map(a => a.id);

    if (relevantIds && relevantIds.length > 0) {
        const { data: competencies, error: compError } = await supabase
            .from('competencies')
            .select('*')
            .in('area_id', relevantIds);

        if (compError) {
            console.error("Error fetching competencies:", compError);
        } else {
            console.table(competencies);
        }
    } else {
        console.log("No relevant areas found to inspect competencies for.");
    }
}

inspectSchema();
