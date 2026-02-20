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
        // 1. Create Admin Client (Service Role) - For performing the action
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

        // 2. Check Authorization Header manually (Alternative to verify_jwt=true)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // 3. Verify the User (Optional but recommended: Check if requester is Admin)
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Invalid User Token" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // Check if user is admin (using public.profiles table)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'subdirector') { // Allow subdirector too if needed
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

            if (authError) {
                console.error("Edge Function: Auth error", authError);
                throw authError;
            }

            // Sanitize userData
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

            if (profileError) {
                console.error("Edge Function: DB error", profileError);
                throw profileError;
            }

            return new Response(JSON.stringify({ user: authData.user, profile: profileData }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "update_password") {
            const { profile_id, password } = body;
            console.log(`Edge Function: Updating password for ${profile_id}`);
            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                profile_id,
                { password }
            );

            if (updateError) {
                console.error("Edge Function: Password update error", updateError);
                throw updateError;
            }

            return new Response(JSON.stringify({ message: "Password updated successfully", data: updateData }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (action === "delete_user") {
            const { profile_id } = body; // Destructure from body
            console.log(`Edge Function: Deleting user ${profile_id}`);
            const { data, error } = await supabaseAdmin.auth.admin.deleteUser(
                profile_id
            );

            if (error) {
                console.error("Edge Function: Delete user error", error);
                throw error;
            }

            return new Response(JSON.stringify({ message: "User deleted successfully", data }), {
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
