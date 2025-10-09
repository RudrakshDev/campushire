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

// - Get all user details (admin)
export async function getAllUserDetails(token) {
    const supabase = await supabaseClient(token);
    const { data, error } = await supabase
        .from("user_details")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching all user details:", error);
        throw new Error("Error fetching user details");
    }

    return data || [];
}

// - Upsert user details
export async function upsertUserDetails(token, userDetails) {
    const supabase = await supabaseClient(token);
    // Sanitize legacy/reserved field name if present in drafts/localStorage
    const payload = { ...userDetails };
    // Normalize legacy `references` -> `references_list` and always remove `references`
    if (Object.prototype.hasOwnProperty.call(payload, "references") && !Object.prototype.hasOwnProperty.call(payload, "references_list")) {
        payload.references_list = payload.references;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "references")) {
        delete payload.references;
    }
    // Never send identity/system columns back
    if (Object.prototype.hasOwnProperty.call(payload, "id")) delete payload.id;
    if (Object.prototype.hasOwnProperty.call(payload, "created_at")) delete payload.created_at;
    if (Object.prototype.hasOwnProperty.call(payload, "updated_at")) delete payload.updated_at;
    const { data, error } = await supabase
        .from("user_details")
        .upsert([payload], { onConflict: "user_id", returning: "minimal" });

    if (error) {
        console.error("Error saving user details:", error);
        throw new Error("Error saving user details");
    }

    // When select is omitted, data may be null; return the payload as a best-effort echo
    return Array.isArray(data) ? data?.[0] : payload;
}