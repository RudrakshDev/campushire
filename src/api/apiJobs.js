import supabaseClient from "@/utils/supabase";

// Fetch Jobs
export async function getJobs(token, { location, company_id, searchQuery, recommended }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)");

  if (location) {
    query = query.eq("location", location);
  }

  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  if (searchQuery) {
    if (recommended) {
      // Split comma/space separated skills and OR-match across multiple columns
      const tokens = String(searchQuery)
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12); // cap to avoid overly long queries
      const cols = ["title", "description", "requirements"];
      if (tokens.length > 0) {
        const orParts = [];
        for (const t of tokens) {
          for (const c of cols) {
            orParts.push(`${c}.ilike.%${t}%`);
          }
        }
        if (orParts.length > 0) {
          query = query.or(orParts.join(","));
        }
      } else {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,requirements.ilike.%${searchQuery}%`);
      }
    } else {
      // Default: search by title only
      query = query.ilike("title", `%${searchQuery}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Read Saved Jobs
export async function getSavedJobs(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))");

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

// Read single job
export async function getSingleJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select(
      "*, company: companies(name,logo_url), applications: applications(*)"
    )
    .eq("id", job_id)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }

  return data;
}

// - Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = await supabaseClient(token);

  if (alreadySaved) {
    // If the job is already saved, remove it
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (deleteError) {
      console.error("Error removing saved job:", deleteError);
      return data;
    }

    return data;
  } else {
    // If the job is not saved, add it to saved jobs
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (insertError) {
      console.error("Error saving job:", insertError);
      return data;
    }

    return data;
  }
}

// - job isOpen toggle - (recruiter_id = auth.uid())
export async function updateHiringStatus(token, { job_id }, isOpen) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .select();

  if (error) {
    console.error("Error Updating Hiring Status:", error);
    return null;
  }

  return data;
}

// get my created jobs
export async function getMyJobs(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(id,name,logo_url), applications: applications(id)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  // Delete dependents first
  const { error: delAppsErr } = await supabase
    .from("applications")
    .delete()
    .eq("job_id", job_id);
  if (delAppsErr) {
    console.error("Error deleting applications for job:", delAppsErr);
  }

  const { error: delSavedErr } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("job_id", job_id);
  if (delSavedErr) {
    console.error("Error deleting saved_jobs for job:", delSavedErr);
  }

  const { data, error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    console.error("Error deleting job:", deleteError);
    return data;
  }

  return data;
}

// - post job
export async function addNewJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .insert([jobData])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Job");
  }

  return data;
}

// - update job
export async function updateJob(token, { job_id }, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .update(jobData)
    .eq("id", job_id)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Updating Job");
  }

  return data;
}

// Bulk delete all jobs for a recruiter under a specific company
export async function deleteJobsByCompany(token, { recruiter_id }, { company_id }) {
  const supabase = await supabaseClient(token);
  // 1) Fetch affected job ids
  const { data: jobsToDelete, error: fetchErr } = await supabase
    .from("jobs")
    .select("id")
    .eq("recruiter_id", recruiter_id)
    .eq("company_id", company_id);

  if (fetchErr) {
    console.error("Error fetching jobs to delete:", fetchErr);
    return null;
  }
  const jobIds = Array.isArray(jobsToDelete) ? jobsToDelete.map((j) => j.id) : [];
  if (jobIds.length === 0) return [];

  // 2) Delete dependent rows first to satisfy FKs
  const { error: delAppsErr } = await supabase
    .from("applications")
    .delete()
    .in("job_id", jobIds);
  if (delAppsErr) {
    console.error("Error deleting applications for jobs:", delAppsErr);
    return null;
  }

  const { error: delSavedErr } = await supabase
    .from("saved_jobs")
    .delete()
    .in("job_id", jobIds);
  if (delSavedErr) {
    console.error("Error deleting saved jobs for jobs:", delSavedErr);
    return null;
  }

  // 3) Delete jobs
  const { data, error } = await supabase
    .from("jobs")
    .delete()
    .in("id", jobIds)
    .select();

  if (error) {
    console.error("Error deleting jobs by company:", error);
    return null;
  }

  return data;
}
