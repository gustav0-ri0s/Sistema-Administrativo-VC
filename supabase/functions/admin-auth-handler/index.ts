// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS preflight
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
        const { action, email, password, profile_id, userData } = body;

        console.log(`Edge Function: Processing ${action} from user ${user.email}`);

        if (action === "create_user") {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: userData?.full_name },
            });

            if (authError) throw authError;

            // Sanitize
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

            console.log(`Edge Function: Attempting to delete user ${profile_id}`);

            // 1. First, delete DB Profile (This will fail if FK violation exists)
            const { error: dbError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', profile_id);

            if (dbError) {
                console.error("Edge Function: DB Delete Error", dbError);
                return new Response(JSON.stringify({ error: `DB Delete Failed: ${dbError.message || dbError.details || JSON.stringify(dbError)}` }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            // 2. Then, delete Auth User
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
                profile_id
            );

            if (authError) {
                console.error("Edge Function: Auth Delete Error", authError);
                return new Response(JSON.stringify({ error: `Auth Delete Failed: ${authError.message}` }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
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
        return new Response(JSON.stringify({ error: error.message || "Unknown error", stack: error.stack }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
