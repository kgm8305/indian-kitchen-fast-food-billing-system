
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Define demo users
    const demoUsers = [
      { email: 'admin@gmail.com', password: '123456', role: 'admin' },
      { email: 'manager@gmail.com', password: '123456', role: 'manager' },
      { email: 'cashier@gmail.com', password: '123456', role: 'cashier' },
    ];

    // Create or update each demo user
    const results = await Promise.all(
      demoUsers.map(async (user) => {
        // Check if user exists
        const { data: existingUsers } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('email', user.email);
          
        if (existingUsers && existingUsers.length > 0) {
          // Update existing user's role
          await supabaseAdmin
            .from('profiles')
            .update({ role: user.role })
            .eq('email', user.email);
            
          return { message: `Updated existing user: ${user.email}` };
        } else {
          // Create new user
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { role: user.role },
          });
          
          if (error) throw error;
          
          // Update profile with correct role
          if (data.user) {
            await supabaseAdmin
              .from('profiles')
              .update({ role: user.role })
              .eq('id', data.user.id);
          }
          
          return { message: `Created new user: ${user.email}` };
        }
      })
    );

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
