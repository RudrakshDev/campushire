import supabaseClient from "@/utils/supabase";

// - Get user details
export async function getUserDetails(token, { user_id }) {
    const supabase = await supabaseClient(token);
    const { data, error } = await supabase
        .from("user_details")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();

    if (error) {
        console.error("Error fetching user details:", error);
        return null;
    }

    return data;
}

// - Upsert user details
export async function upsertUserDetails(token, userDetails) {
    const supabase = await supabaseClient(token);
    // Sanitize legacy/reserved field name if present in drafts/localStorage
    const payload = { ...userDetails };
    if (Object.prototype.hasOwnProperty.call(payload, "references")) {
        delete payload.references;
    }
    const { data, error } = await supabase
        .from("user_details")
        .upsert([payload], { onConflict: "user_id" })
        .select();

    if (error) {
        console.error("Error saving user details:", error);
        throw new Error("Error saving user details");
    }

    return data?.[0];
}
