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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Verify user's role from their profile to ensure they are an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: User is not an admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin user confirmed, now perform action
    const { action, userId, email, password, first_name, last_name, role, subscription_status, is_blocked } = await req.json();

    let responseData;

    switch (action) {
      case 'create': {
        if (!email || !password) {
          return new Response(JSON.stringify({ error: 'Email and password are required for new user.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { first_name, last_name },
        });
        if (createError) throw createError;

        const { error: insertProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: newUser.user.id,
            first_name,
            last_name,
            role: role || 'user',
            subscription_status: subscription_status || 'inactive',
          });
        if (insertProfileError) throw insertProfileError;
        responseData = { message: 'User created successfully', userId: newUser.user.id };
        break;
      }
      case 'update': {
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required for update.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const updateAuthData: { email?: string; password?: string; ban_duration?: string | null } = {};
        if (email) updateAuthData.email = email;
        if (password) updateAuthData.password = password;
        if (is_blocked !== undefined) updateAuthData.ban_duration = is_blocked ? '1000000h' : null;

        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateAuthData);
        if (updateAuthError) throw updateAuthError;

        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ first_name, last_name, role, subscription_status })
          .eq('id', userId);
        if (updateProfileError) throw updateProfileError;
        responseData = { message: 'User updated successfully', userId };
        break;
      }
      case 'delete': {
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required for delete.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;
        responseData = { message: 'User deleted successfully', userId };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in manage-user Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});