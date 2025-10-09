function getExtFromFile(file) {
  const byType = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/svg+xml": "svg",
    "image/webp": "webp",
  };
  if (file?.type && byType[file.type]) return byType[file.type];
  if (typeof file?.name === "string" && file.name.includes(".")) {
    const ext = file.name.split(".").pop();
    return ext?.toLowerCase();
  }
  return "png";
}
import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// Fetch Companies
export async function getCompanies(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase.from("companies").select("*");

  if (error) {
    console.error("Error fetching Companies:", error);
    return null;
  }

  return data;
}

// Add Company
export async function addNewCompany(token, _, companyData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `logo-${random}-${companyData.name}`;

  const { error: storageError } = await supabase.storage
    .from("company-logo")
    .upload(fileName, companyData.logo);

  if (storageError) throw new Error("Error uploading Company Logo");

  const logo_url = `${supabaseUrl}/storage/v1/object/public/company-logo/${fileName}`;

  const { data, error } = await supabase
    .from("companies")
    .insert([
      {
        name: companyData.name,
        logo_url: logo_url,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Companys");
  }

  return data;
}

// Ensure a company exists by name (no logo upload). Returns the company row.
export async function ensureCompanyByName(token, { name }) {
  const supabase = await supabaseClient(token);

  // Try to find by exact name
  const { data: existingList, error: findError } = await supabase
    .from("companies")
    .select("*")
    .ilike("name", name) // case-insensitive match
    .order("created_at", { ascending: true })
    .limit(1);

  if (findError) {
    console.error("Error checking company existence:", findError);
  }
  const existing = Array.isArray(existingList) && existingList.length > 0 ? existingList[0] : null;
  if (existing) return existing;

  // Insert minimal company row (logo optional)
  const { data, error } = await supabase
    .from("companies")
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error("Error inserting company:", error);
    throw new Error("Error creating company");
  }

  return data;
}

// Update a company's logo by uploading to storage and setting logo_url
export async function updateCompanyLogo(token, { company_id }, file) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const ext = getExtFromFile(file);
  const fileName = `logo-${random}-${company_id}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from("company-logo")
    .upload(fileName, file, { upsert: true, contentType: file?.type || "image/png" });

  if (storageError) throw new Error("Error uploading Company Logo");

  const { data: publicUrlData } = supabase.storage
    .from("company-logo")
    .getPublicUrl(fileName);
  const logo_url = publicUrlData?.publicUrl;

  const { data, error } = await supabase
    .from("companies")
    .update({ logo_url })
    .eq("id", company_id)
    .select();

  if (error) {
    console.error("Error updating company logo:", error);
    throw new Error("Error updating company logo");
  }

  // If no rows were updated, return null instead of erroring
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

// Update logo for all companies matching a given name (case-insensitive)
export async function updateCompanyLogoByName(token, { name }, file) {
  const supabase = await supabaseClient(token);

  // Find all companies matching the name (case-insensitive)
  const { data: companies, error: findError } = await supabase
    .from("companies")
    .select("id,name")
    .ilike("name", name);

  if (findError) {
    console.error("Error finding companies by name:", findError);
    throw new Error("Error finding companies");
  }

  // Create if missing; otherwise pick the first matching company
  const targetCompany = (!companies || companies.length === 0)
    ? await ensureCompanyByName(token, { name })
    : companies[0];

  // Delegate to the single-company updater to avoid bulk updates
  const updated = await updateCompanyLogo(token, { company_id: targetCompany.id }, file);
  return updated ? [updated] : [];
}
