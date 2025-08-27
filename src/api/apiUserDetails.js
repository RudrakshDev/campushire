import supabaseClient from "@/utils/supabase";

// - Get user details
export async function getUserDetails(token, { user_id }) {
    const supabase = await supabaseClient(token);
    const { data, error } = await supabase
        .from("user_details")
        .select("*")
        .eq("user_id", user_id)
        .single();

    if (error) {
        console.error("Error fetching user details:", error);
        return null;
    }

    return data;
}

// - Upsert user details
export async function upsertUserDetails(token, userDetails) {
    const supabase = await supabaseClient(token);
    const { data, error } = await supabase
        .from("user_details")
        .upsert([userDetails])
        .select();

    if (error) {
        console.error("Error saving user details:", error);
        throw new Error("Error saving user details");
    }

    return data?.[0];
}
