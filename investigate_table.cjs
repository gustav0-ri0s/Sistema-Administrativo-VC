const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function investigateTable() {
    console.log('🔍 Investigando estructura REAL de course_assignments...\n');

    // 1. Intentar SELECT * para ver qué columnas devuelve
    console.log('Paso 1: Intentando SELECT *...');
    const { data: allData, error: allError } = await supabase
        .from('course_assignments')
        .select('*')
        .limit(5);

    if (allError) {
        console.error('❌ Error en SELECT *:', allError);
    } else {
        console.log(`✅ Registros encontrados: ${allData.length}`);
        if (allData.length > 0) {
            console.log('\n📋 Columnas disponibles:');
            console.log(Object.keys(allData[0]).join(', '));
            console.log('\n📄 Primer registro completo:');
            console.log(JSON.stringify(allData[0], null, 2));
        } else {
            console.log('⚠️  Tabla vacía');
        }
    }

    // 2. Intentar seleccionar columnas específicas para ver cuáles existen
    console.log('\n\nPaso 2: Probando columnas específicas...');

    const columnsToTest = [
        'id',
        'user_id',
        'profile_id',
        'classroom_id',
        'area_id',
        'created_at',
        'updated_at'
    ];

    for (const col of columnsToTest) {
        const { data, error } = await supabase
            .from('course_assignments')
            .select(col)
            .limit(1);

        if (error) {
            console.log(`❌ ${col}: NO EXISTE (${error.message})`);
        } else {
            console.log(`✅ ${col}: EXISTE`);
        }
    }

    // 3. Intentar un INSERT mínimo para ver qué acepta
    console.log('\n\nPaso 3: Probando INSERT con diferentes combinaciones...');

    // Obtener IDs de prueba
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const { data: classrooms } = await supabase.from('classrooms').select('id').limit(1);

    if (profiles && profiles.length > 0 && classrooms && classrooms.length > 0) {
        const testCombinations = [
            { user_id: profiles[0].id, classroom_id: classrooms[0].id },
            { profile_id: profiles[0].id, classroom_id: classrooms[0].id },
            { id: profiles[0].id, classroom_id: classrooms[0].id }
        ];

        for (const combo of testCombinations) {
            console.log(`\nProbando: ${JSON.stringify(combo)}`);
            const { data, error } = await supabase
                .from('course_assignments')
                .insert(combo)
                .select();

            if (error) {
                console.log(`❌ Error: ${error.message}`);
            } else {
                console.log('✅ ¡ÉXITO! Esta combinación funciona');
                console.log('Registro insertado:', JSON.stringify(data[0], null, 2));

                // Limpiar
                await supabase.from('course_assignments').delete().eq('id', data[0].id);
                console.log('🧹 Registro de prueba eliminado');
                break;
            }
        }
    }
}

investigateTable().then(() => {
    console.log('\n\n✅ Investigación completada');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
