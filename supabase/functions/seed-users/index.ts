
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
    console.log("Starting seed-users function");
    
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
        console.log(`Processing user: ${user.email}`);
        
        // Check if user exists by email
        const { data: existingUsers, error: queryError } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('email', user.email);
          
        if (queryError) {
          console.error(`Error querying for user ${user.email}:`, queryError);
        }
        
        if (existingUsers && existingUsers.length > 0) {
          // User exists, just update role
          const userId = existingUsers[0].id;
          console.log(`Found existing user: ${user.email} with ID: ${userId}`);
          
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: user.role })
            .eq('id', userId);
            
          if (updateError) {
            console.error(`Error updating role for user ${user.email}:`, updateError);
            return { message: `Error updating user ${user.email}: ${updateError.message}` };
          }
          
          return { message: `Updated existing user: ${user.email}` };
        } else {
          // Create new user
          console.log(`Creating new user: ${user.email}`);
          
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,  // Skip email verification
            user_metadata: { role: user.role },
          });
          
          if (error) {
            console.error(`Error creating user ${user.email}:`, error);
            return { message: `Error creating user ${user.email}: ${error.message}` };
          }
          
          // Update profile with correct role
          if (data.user) {
            console.log(`Created user ${user.email} with ID: ${data.user.id}, updating profile`);
            
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .update({ role: user.role })
              .eq('id', data.user.id);
              
            if (profileError) {
              console.error(`Error updating profile for ${user.email}:`, profileError);
              return { message: `Error updating profile for ${user.email}: ${profileError.message}` };
            }
          }
          
          return { message: `Created new user: ${user.email}` };
        }
      })
    );

    console.log("Seed users function completed successfully");
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in seed-users function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
