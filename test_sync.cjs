const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testSync() {
    console.log('🔍 Verificando sincronización con sistema de asistencia...\n');

    // 1. Obtener un usuario de ejemplo
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .limit(1);

    if (pError || !profiles || profiles.length === 0) {
        console.error('❌ No se encontraron usuarios');
        return;
    }

    const profile = profiles[0];
    console.log('✅ Usuario de prueba:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nombre: ${profile.full_name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Rol: ${profile.role}\n`);

    // 2. Obtener un salón de ejemplo
    const { data: classrooms, error: cError } = await supabase
        .from('classrooms')
        .select('id, name, grade, section')
        .limit(1);

    if (cError || !classrooms || classrooms.length === 0) {
        console.error('❌ No se encontraron salones');
        return;
    }

    const classroom = classrooms[0];
    console.log('✅ Salón de prueba:');
    console.log(`   ID: ${classroom.id}`);
    console.log(`   Nombre: ${classroom.name}\n`);

    // 3. Simular lo que hace el sistema de asistencia:
    // Crear un registro en course_assignments con user_id
    console.log('📝 Simulando asignación del sistema de asistencia...');
    console.log(`   Creando registro: user_id=${profile.id}, classroom_id=${classroom.id}\n`);

    const { data: newAssignment, error: aError } = await supabase
        .from('course_assignments')
        .insert({
            user_id: profile.id,
            classroom_id: classroom.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (aError) {
        console.error('❌ Error al crear asignación:', aError);
        return;
    }

    console.log('✅ Asignación creada exitosamente');
    console.log(`   Assignment ID: ${newAssignment.id}\n`);

    // 4. Verificar que se puede leer correctamente
    console.log('🔍 Verificando lectura de asignaciones...\n');

    const { data: assignments, error: readError } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('user_id', profile.id);

    if (readError) {
        console.error('❌ Error al leer asignaciones:', readError);
        return;
    }

    console.log(`✅ Asignaciones encontradas: ${assignments.length}`);
    assignments.forEach(a => {
        console.log(`   - user_id: ${a.user_id}, classroom_id: ${a.classroom_id}`);
    });

    // 5. Limpiar (eliminar el registro de prueba)
    console.log('\n🧹 Limpiando registro de prueba...');
    const { error: deleteError } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', newAssignment.id);

    if (deleteError) {
        console.error('❌ Error al eliminar:', deleteError);
    } else {
        console.log('✅ Registro de prueba eliminado');
    }
}

testSync().then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
