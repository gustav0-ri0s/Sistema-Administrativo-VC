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

        const { action, email, password, profile_id, userData } = await req.json();

        if (action === "create_user") {
            // 1. Create user in Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: userData.full_name },
            });

            if (authError) throw authError;

            // 2. Profile row is usually created via trigger or manually. 
            // In this case, we'll return the auth ID so the client can create the profile row with that ID.
            // Or we can create it here to ensure atomicity.
            const { data: profileData, error: profileError } = await supabaseAdmin
                .from("profiles")
                .insert([
                    {
                        id: authData.user.id,
                        email,
                        ...userData,
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
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                profile_id,
                { password }
            );

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ message: "Password updated successfully" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
