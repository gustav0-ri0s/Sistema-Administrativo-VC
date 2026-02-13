const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
    console.log('🔍 Verificando esquema de course_assignments...\n');

    // Obtener una muestra de course_assignments para ver su estructura
    const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .limit(3);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`📋 Registros encontrados: ${data.length}\n`);

    if (data.length > 0) {
        console.log('Estructura de course_assignments:');
        console.log('Columnas:', Object.keys(data[0]));
        console.log('\nPrimer registro:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('⚠️  No hay registros en course_assignments');
    }

    // Verificar si existe la columna user_id o profile_id
    console.log('\n🔍 Verificando relación users/profiles...\n');

    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(1);

    if (!pError && profiles.length > 0) {
        console.log('✅ Tabla profiles existe');
        console.log('Ejemplo de profile.id:', profiles[0].id);
    }
}

checkSchema().then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
