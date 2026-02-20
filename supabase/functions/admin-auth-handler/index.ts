// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Authorization Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Invalid User Token" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'subdirector') {
            return new Response(JSON.stringify({ error: "Unauthorized: Insufficient permissions" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        const body = await req.json();
        const { action, email, password, profile_id, userData, force_delete } = body;

        console.log(`Edge Function: Processing ${action} from user ${user.email}`);

        // --- CHEQUEAR DEPENDENCIAS ---
        if (action === "check_dependencies") {
            if (!profile_id) {
                return new Response(JSON.stringify({ error: "Missing profile_id" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            const results = {
                incidents: 0,
                incident_logs: 0,
                attendance: 0,
                assignments: 0
            };

            // Ejecutar conteos en paralelo
            // Usamos count: 'exact', head: true para solo obtener el número
            const [incidents, logs, attendance, assignments] = await Promise.all([
                supabaseAdmin.from('incidents').select('*', { count: 'exact', head: true }).eq('teacher_id', profile_id),
                supabaseAdmin.from('incident_logs').select('*', { count: 'exact', head: true }).eq('created_by', profile_id),
                supabaseAdmin.from('attendance').select('*', { count: 'exact', head: true }).eq('created_by', profile_id),
                supabaseAdmin.from('course_assignments').select('*', { count: 'exact', head: true }).eq('profile_id', profile_id)
            ]);

            results.incidents = incidents.count || 0;
            results.incident_logs = logs.count || 0;
            results.attendance = attendance.count || 0;
            results.assignments = assignments.count || 0;

            console.log(`Dependencies for ${profile_id}:`, results);

            return new Response(JSON.stringify(results), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "create_user") {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: userData?.full_name },
            });

            if (authError) throw authError;

            const sanitizedData = { ...userData };
            Object.keys(sanitizedData).forEach(key => {
                if (sanitizedData[key] === "") sanitizedData[key] = null;
            });

            const { data: profileData, error: profileError } = await supabaseAdmin
                .from("profiles")
                .upsert([
                    {
                        id: authData.user.id,
                        email,
                        ...sanitizedData,
                    },
                ])
                .select()
                .single();

            if (profileError) throw profileError;

            return new Response(JSON.stringify({ user: authData.user, profile: profileData }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "update_password") {
            const { profile_id, password } = body;
            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                profile_id,
                { password }
            );

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ message: "Password updated successfully", data: updateData }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "delete_user") {
            if (!profile_id) {
                return new Response(JSON.stringify({ error: "Missing profile_id" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            console.log(`Edge Function: Attempting to delete user ${profile_id}. Force Delete: ${force_delete}`);

            // Si force_delete es true, borramos dependencias manualmente
            if (force_delete) {
                console.log("Force delete enabled: cleaning up dependencies...");
                // 1. Incidents (Cascade/Delete)
                await supabaseAdmin.from('incidents').delete().eq('teacher_id', profile_id);

                // 2. Incident Logs
                await supabaseAdmin.from('incident_logs').delete().eq('created_by', profile_id);

                // 3. Attendance (Set to NULL to preserve history if possible, or delete if constrained)
                // Assuming created_by is nullable. If not, this might fail, but usually metadata columns are nullable.
                // Or simplified: Just delete if they are logs created by this user that are not critical.
                // But attendance is critical. Let's try to NULLIFY first.
                const { error: updateError } = await supabaseAdmin
                    .from('attendance')
                    .update({ created_by: null })
                    .eq('created_by', profile_id);

                if (updateError) {
                    console.log("Could not nullify attendance, trying delete...", updateError);
                    await supabaseAdmin.from('attendance').delete().eq('created_by', profile_id);
                }

                // 4. Assignments
                await supabaseAdmin.from('course_assignments').delete().eq('profile_id', profile_id);
            }

            // 1. Delete from Profiles
            const { error: dbError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', profile_id);

            if (dbError) {
                console.error("Edge Function: DB Delete Error", dbError);
                return new Response(JSON.stringify({
                    error: `No se puede eliminar: ${dbError.message}. El usuario tiene registros vinculados.`
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            // 2. Delete from Auth
            // We do this AFTER DB delete succeeds.
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
                profile_id
            );

            if (authError) {
                console.error("Edge Function: Auth Delete Error", authError);
                // We don't throw here because the main goal (removing from system view) is done.
            }

            return new Response(JSON.stringify({ message: "User deleted successfully" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });

    } catch (error: any) {
        console.error("Edge Function: Global error", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
