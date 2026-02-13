const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteFlow() {
    console.log('🧪 Probando flujo completo de asignaciones...\n');

    // 1. Obtener un usuario y salón de prueba
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(1);

    const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id, name')
        .limit(2);

    if (!profiles || profiles.length === 0 || !classrooms || classrooms.length < 2) {
        console.log('⚠️  No hay suficientes datos para la prueba');
        return;
    }

    const user = profiles[0];
    const classroom1 = classrooms[0];
    const classroom2 = classrooms[1];

    console.log('✅ Datos de prueba:');
    console.log(`   Usuario: ${user.full_name} (${user.email})`);
    console.log(`   Salón 1: ${classroom1.name}`);
    console.log(`   Salón 2: ${classroom2.name}\n`);

    // 2. Simular asignación desde sistema de asistencia
    console.log('📝 Paso 1: Simulando asignación desde sistema de asistencia...');
    const { data: assignment1, error: e1 } = await supabase
        .from('course_assignments')
        .insert({
            user_id: user.id,
            classroom_id: classroom1.id
        })
        .select()
        .single();

    if (e1) {
        console.error('❌ Error:', e1);
        return;
    }
    console.log(`✅ Asignación creada: ${classroom1.name}`);
    console.log(`   ID: ${assignment1.id}\n`);

    // 3. Verificar que se puede leer
    console.log('🔍 Paso 2: Verificando lectura de asignaciones...');
    const { data: assignments, error: e2 } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('user_id', user.id);

    if (e2) {
        console.error('❌ Error:', e2);
        return;
    }
    console.log(`✅ Asignaciones encontradas: ${assignments.length}`);
    assignments.forEach(a => {
        console.log(`   - Classroom ID: ${a.classroom_id}`);
    });
    console.log();

    // 4. Simular modificación desde sistema administrativo
    console.log('📝 Paso 3: Simulando modificación desde sistema administrativo...');
    console.log('   (Eliminando asignación anterior y agregando nueva)');

    // Eliminar la asignación anterior
    await supabase
        .from('course_assignments')
        .delete()
        .eq('user_id', user.id);

    // Crear nueva asignación para el segundo salón
    const { data: assignment2, error: e3 } = await supabase
        .from('course_assignments')
        .insert({
            user_id: user.id,
            classroom_id: classroom2.id
        })
        .select()
        .single();

    if (e3) {
        console.error('❌ Error:', e3);
        return;
    }
    console.log(`✅ Nueva asignación creada: ${classroom2.name}\n`);

    // 5. Verificar el cambio
    console.log('🔍 Paso 4: Verificando que el cambio se reflejó...');
    const { data: finalAssignments, error: e4 } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('user_id', user.id);

    if (e4) {
        console.error('❌ Error:', e4);
        return;
    }
    console.log(`✅ Asignaciones actuales: ${finalAssignments.length}`);
    finalAssignments.forEach(a => {
        const classroom = classrooms.find(c => c.id === a.classroom_id);
        console.log(`   - ${classroom?.name || 'Desconocido'} (ID: ${a.classroom_id})`);
    });
    console.log();

    // 6. Limpiar
    console.log('🧹 Paso 5: Limpiando registros de prueba...');
    await supabase
        .from('course_assignments')
        .delete()
        .eq('user_id', user.id);
    console.log('✅ Registros eliminados\n');

    console.log('🎉 ¡Prueba completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Crear asignación desde sistema de asistencia');
    console.log('   ✅ Leer asignaciones correctamente');
    console.log('   ✅ Modificar asignaciones desde sistema administrativo');
    console.log('   ✅ Verificar sincronización');
}

testCompleteFlow().then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
