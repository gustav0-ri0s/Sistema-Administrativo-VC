
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { dni } = await req.json()

        if (!dni) {
            return new Response(JSON.stringify({ error: 'DNI es requerido' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Get API Token (Hardcoded for immediate use as requested)
        const API_TOKEN = 'apis-token-3044.Rm2oeHHqQLKzmpt-H5D0JjuFDgMsyuhr'; // Deno.env.get('APIS_NET_TOKEN')

        if (!API_TOKEN) {
            return new Response(JSON.stringify({ error: 'Falta configurar APIS_NET_TOKEN' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        console.log(`Consultando DNI: ${dni} en ApisNet...`)

        const response = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Referer': 'https://apis.net.pe/consulta-dni-api',
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error ApisNet:', errorText);
            return new Response(JSON.stringify({ error: `Error ApisNet (${response.status}): ${errorText}` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status, // Pass through status
            });
        }

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
