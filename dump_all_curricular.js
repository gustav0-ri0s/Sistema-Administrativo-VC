
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function dumpAll() {
    console.log("Dumping all curricular areas and competencies...");

    const { data: areas, error: areaError } = await supabase
        .from('curricular_areas')
        .select('*')
        .order('id');

    if (areaError) {
        console.error("Error:", areaError);
        return;
    }

    console.table(areas);

    const { data: competencies, error: compError } = await supabase
        .from('competencies')
        .select('*');

    if (compError) {
        console.error("Error:", compError);
        return;
    }

    console.log("\nAll Competencies:");
    console.table(competencies.map(c => ({
        id: c.id,
        area_id: c.area_id,
        name: c.name.substring(0, 50) + '...'
    })));
}

dumpAll();
