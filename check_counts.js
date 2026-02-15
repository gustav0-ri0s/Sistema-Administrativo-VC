
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

async function checkCount() {
    const { count, error } = await supabase
        .from('curricular_areas')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Curricular Areas count: ${count}`);
    }

    const { count: compCount, error: compError } = await supabase
        .from('competencies')
        .select('*', { count: 'exact', head: true });

    if (compError) {
        console.error("Error:", compError);
    } else {
        console.log(`Competencies count: ${compCount}`);
    }
}

checkCount();
