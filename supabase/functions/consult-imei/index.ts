import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imei } = await req.json();

    if (!imei || typeof imei !== 'string' || !/^\d{14,16}$/.test(imei)) {
      return new Response(JSON.stringify({ error: 'IMEI inválido. Deve conter 14 a 16 dígitos numéricos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- INTEGRAÇÃO COM API EXTERNA DE CONSULTA DE IMEI ---
    // ESTE É UM EXEMPLO CONCEITUAL. VOCÊ PRECISARÁ SUBSTITUIR ESTA LÓGICA
    // PELA CHAMADA REAL À API DO SERVIÇO DE CONSULTA DE IMEI QUE VOCÊ ESCOLHER.
    //
    // Exemplo de como você obteria uma chave de API de um segredo do Supabase:
    // const IMEI_API_KEY = Deno.env.get('IMEI_CONSULTATION_API_KEY');
    // if (!IMEI_API_KEY) {
    //   throw new Error('IMEI_CONSULTATION_API_KEY não está configurada nos segredos do Supabase.');
    // }
    //
    // Exemplo de chamada fetch (substitua pela URL e método da sua API):
    // const externalApiResponse = await fetch(`https://api.imeiconsultation.com/v1/check?imei=${imei}&api_key=${IMEI_API_KEY}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    // });
    //
    // if (!externalApiResponse.ok) {
    //   const errorData = await externalApiResponse.json();
    //   throw new Error(`Erro da API externa: ${errorData.message || externalApiResponse.statusText}`);
    // }
    //
    // const externalApiResult = await externalApiResponse.json();
    //
    // // Mapeie a resposta da API externa para o formato esperado pelo seu frontend
    // let status: 'clean' | 'restricted' | 'stolen' | 'unknown' = 'unknown';
    // let details = 'Não foi possível determinar o status.';
    //
    // if (externalApiResult.status === 'CLEAN') {
    //   status = 'clean';
    //   details = 'O IMEI está livre de restrições.';
    // } else if (externalApiResult.status === 'RESTRICTED') {
    //   status = 'restricted';
    //   details = 'O IMEI possui alguma restrição (ex: bloqueio parcial).';
    // } else if (externalApiResult.status === 'STOLEN_LOST') {
    //   status = 'stolen';
    //   details = 'O IMEI está registrado como roubado ou perdido.';
    // }
    //
    // const responseData = {
    //   status: status,
    //   details: details,
    //   last_updated: externalApiResult.last_updated || new Date().toISOString(),
    //   // Passe outros dados relevantes da API externa
    // };

    // --- RESPOSTA MOCK PARA TESTE (REMOVA APÓS INTEGRAR A API REAL) ---
    let mockStatus: 'clean' | 'restricted' | 'stolen' | 'unknown';
    let mockDetails: string;

    if (imei.endsWith('123')) {
      mockStatus = 'stolen';
      mockDetails = 'Este IMEI está registrado como roubado na base de dados da ANATEL.';
    } else if (imei.endsWith('456')) {
      mockStatus = 'restricted';
      mockDetails = 'Este IMEI possui restrições de uso em algumas operadoras devido a pendências.';
    } else {
      mockStatus = 'clean';
      mockDetails = 'Este IMEI está livre de restrições e pode ser utilizado normalmente.';
    }

    const responseData = {
      status: mockStatus,
      details: mockDetails,
      last_updated: new Date().toLocaleString('pt-BR'),
    };
    // --- FIM DA RESPOSTA MOCK ---

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro na Edge Function consult-imei:", error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno do servidor ao consultar IMEI.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});