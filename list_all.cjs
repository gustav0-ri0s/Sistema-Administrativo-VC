const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function listAll() {
    console.log('📋 Listando todos los perfiles y asignaciones...\n');

    // 1. Listar todos los perfiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

    if (pError) {
        console.error('❌ Error perfiles:', pError);
    } else {
        console.log(`✅ Total de perfiles: ${profiles.length}\n`);
        profiles.forEach((p, i) => {
            console.log(`${i + 1}. ${p.full_name} (${p.email}) - ${p.role}`);
        });
    }

    // 2. Listar todas las asignaciones
    const { data: assignments, error: aError } = await supabase
        .from('course_assignments')
        .select('*')
        .order('created_at', { ascending: false });

    if (aError) {
        console.error('\n❌ Error asignaciones:', aError);
    } else {
        console.log(`\n\n📚 Total de asignaciones: ${assignments.length}\n`);

        if (assignments.length > 0) {
            console.log('Últimas 10 asignaciones:');
            for (const a of assignments.slice(0, 10)) {
                // Buscar perfil
                const profile = profiles.find(p => p.id === a.profile_id);

                // Buscar salón
                const { data: classroom } = await supabase
                    .from('classrooms')
                    .select('*')
                    .eq('id', a.classroom_id)
                    .single();

                console.log(`\n  Profile ID: ${a.profile_id} (${typeof a.profile_id})`);
                if (profile) {
                    console.log(`  Usuario: ${profile.full_name} (${profile.email})`);
                }
                console.log(`  Classroom ID: ${a.classroom_id} (${typeof a.classroom_id})`);
                if (classroom) {
                    console.log(`  Salón: ${classroom.name}`);
                }
                console.log(`  Creado: ${a.created_at}`);
            }
        }
    }

    // 3. Listar salones
    const { data: classrooms } = await supabase
        .from('classrooms')
        .select('*')
        .order('name');

    console.log(`\n\n🏫 Total de salones: ${classrooms.length}\n`);
    console.log('Primeros 5 salones:');
    classrooms.slice(0, 5).forEach(c => {
        console.log(`  ID: ${c.id} (${typeof c.id}) - ${c.name}`);
    });
}

listAll().then(() => {
    console.log('\n✅ Listado completado');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
