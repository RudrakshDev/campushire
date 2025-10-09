import supabaseClient from "@/utils/supabase";

// Get HR Profile by recruiter and company
export async function getHrProfileByRecruiterAndCompany(
  token,
  { recruiter_id, company_id }
) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("hr_profiles")
    .select("*")
    .eq("recruiter_id", recruiter_id)
    .eq("company_id", company_id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching HR profile:", error);
    return null;
  }

  return data;
}

// Upsert HR Profile
export async function upsertHrProfile(token, _, profileData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("hr_profiles")
    .upsert([profileData])
    .select()
    .single();

  if (error) {
    console.error("Error saving HR profile:", error);
    throw new Error("Error saving HR profile");
  }

  return data;
}

// Get HR Profile by recruiter only
export async function getHrProfileByRecruiter(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("hr_profiles")
    .select("*")
    .eq("recruiter_id", recruiter_id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching HR profile by recruiter:", error);
    return null;
  }

  return data;
}

// Get all HR profiles (admin)
export async function getAllHrProfiles(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("hr_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching HR profiles:", error);
    throw new Error("Error fetching HR profiles");
  }

  return data || [];
}


