const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function findJacky() {
    console.log('🔍 Buscando perfiles con "jacky"...\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', '%jacky%');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`Encontrados: ${profiles.length} perfiles\n`);

    profiles.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Nombre: ${p.full_name}`);
        console.log(`Email: ${p.email}`);
        console.log(`Rol: ${p.role}`);
        console.log('---');
    });

    // También buscar por nombre
    const { data: byName } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%jacqueline%');

    if (byName && byName.length > 0) {
        console.log('\n📋 Perfiles con "jacqueline" en el nombre:\n');
        byName.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Nombre: ${p.full_name}`);
            console.log(`Email: ${p.email}`);
            console.log(`Rol: ${p.role}`);
            console.log('---');
        });
    }
}

findJacky().then(() => {
    console.log('\n✅ Búsqueda completada');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
