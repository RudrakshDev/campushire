// import { createClient } from "@supabase/supabase-js";

// export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// const supabaseClient = async (supabaseAccessToken) => {
//   const supabase = createClient(supabaseUrl, supabaseKey, {
//     global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
//   });
//   return supabase;
// };

// export default supabaseClient;


import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default client (anon key) - works only if RLS disabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to create a client with a Clerk JWT
const supabaseClient = async (supabaseAccessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
      },
    },
  });
};

export default supabaseClient;
