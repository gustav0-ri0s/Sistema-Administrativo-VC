
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = require('dotenv').config({ path: envPath });

if (envConfig.error) {
    console.error("Error loading .env.local file");
    process.exit(1);
}

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
        .select('*');

    if (areasError) {
        console.error("Error fetching areas:", areasError);
    } else {
        console.table(areas);
    }

    console.log("\n--- Competencies (Limit 20) ---");
    const { data: competencies, error: compError } = await supabase
        .from('competencies')
        .select('*')
        .limit(20);

    if (compError) {
        console.error("Error fetching competencies:", compError);
    } else {
        console.table(competencies);
    }
}

inspectSchema();
