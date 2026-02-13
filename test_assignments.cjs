const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testAssignments() {
    console.log('🔍 Buscando asignaciones para miss.jacky@muivc.com...\n');

    // 1. Buscar el perfil
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'miss.jacky@muivc.com');

    if (profileError || !profiles || profiles.length === 0) {
        console.error('❌ Error buscando perfil:', profileError || 'No se encontró el perfil');
        return;
    }

    const profile = profiles[0];
    console.log('✅ Perfil encontrado:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nombre: ${profile.full_name}`);
    console.log(`   Email: ${profile.email}\n`);

    // 2. Buscar asignaciones en course_assignments
    const { data: assignments, error: assignError } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('profile_id', profile.id);

    if (assignError) {
        console.error('❌ Error buscando asignaciones:', assignError);
        return;
    }

    console.log(`📋 Asignaciones encontradas: ${assignments.length}\n`);

    if (assignments.length > 0) {
        console.log('Detalles de las asignaciones:');
        for (const assignment of assignments) {
            console.log(`\n   Assignment ID: ${assignment.id}`);
            console.log(`   Profile ID: ${assignment.profile_id} (tipo: ${typeof assignment.profile_id})`);
            console.log(`   Classroom ID: ${assignment.classroom_id} (tipo: ${typeof assignment.classroom_id})`);
            console.log(`   Area ID: ${assignment.area_id}`);
            console.log(`   Created: ${assignment.created_at}`);

            // Buscar el salón
            const { data: classroom } = await supabase
                .from('classrooms')
                .select('*')
                .eq('id', assignment.classroom_id)
                .single();

            if (classroom) {
                console.log(`   Salón: ${classroom.name} (${classroom.level} - ${classroom.grade}${classroom.section})`);
            }
        }
    } else {
        console.log('⚠️  No se encontraron asignaciones para este usuario');
    }

    // 3. Verificar todos los salones
    const { data: allClassrooms } = await supabase
        .from('classrooms')
        .select('*')
        .order('name');

    console.log(`\n📚 Total de salones en la base de datos: ${allClassrooms.length}`);
    console.log('\nPrimeros 5 salones (para verificar tipos de ID):');
    allClassrooms.slice(0, 5).forEach(c => {
        console.log(`   ID: ${c.id} (tipo: ${typeof c.id}) - ${c.name}`);
    });
}

testAssignments().then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
