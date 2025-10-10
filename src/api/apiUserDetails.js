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
    // Normalize empty date fields to null to satisfy DATE column types
    if (Object.prototype.hasOwnProperty.call(payload, "date_of_birth")) {
        const raw = typeof payload.date_of_birth === "string" ? payload.date_of_birth.trim() : payload.date_of_birth;
        if (raw === "" || raw === undefined) {
            payload.date_of_birth = null;
        } else if (typeof raw === "string") {
            // Accept dd-mm-yyyy or dd/mm/yyyy and convert to yyyy-mm-dd
            const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
            if (m) {
                const dd = m[1], mm = m[2], yyyy = m[3];
                payload.date_of_birth = `${yyyy}-${mm}-${dd}`; // yyyy-mm-dd
            } else {
                // If not ISO-ish, attempt Date parse and fallback to null on failure
                const d = new Date(raw);
                if (isNaN(d.getTime())) {
                    payload.date_of_birth = null;
                } else {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    payload.date_of_birth = `${yyyy}-${mm}-${dd}`;
                }
            }
        }
    }
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