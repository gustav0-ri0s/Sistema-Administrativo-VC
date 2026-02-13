const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkColumns() {
    console.log('🔍 Verificando estructura real de course_assignments...\n');

    // Intentar obtener un registro para ver las columnas
    const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Columnas encontradas en course_assignments:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('\n📋 Estructura completa del primer registro:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('⚠️  No hay registros en la tabla (tabla vacía)');
        console.log('Intentando insertar un registro de prueba para ver qué columnas acepta...\n');

        // Obtener un usuario y salón de prueba
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        const { data: classrooms } = await supabase.from('classrooms').select('id').limit(1);

        if (profiles && profiles.length > 0 && classrooms && classrooms.length > 0) {
            const testInsert = {
                user_id: profiles[0].id,
                classroom_id: classrooms[0].id
            };

            console.log('Intentando insertar:', testInsert);

            const { data: inserted, error: insertError } = await supabase
                .from('course_assignments')
                .insert(testInsert)
                .select()
                .single();

            if (insertError) {
                console.error('❌ Error al insertar:', insertError);
            } else {
                console.log('✅ Registro insertado exitosamente');
                console.log('Columnas:', Object.keys(inserted).join(', '));
                console.log('\nEstructura:', JSON.stringify(inserted, null, 2));

                // Limpiar
                await supabase.from('course_assignments').delete().eq('id', inserted.id);
                console.log('\n🧹 Registro de prueba eliminado');
            }
        }
    }
}

checkColumns().then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
