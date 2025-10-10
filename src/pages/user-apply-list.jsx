import { useEffect, useMemo, useState } from "react";
import { BarLoader } from "react-spinners";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch";
import { getApplicationsForRecruiter } from "@/api/apiApplication";
import { getMyJobs, deleteJobsByCompany, deleteJob } from "@/api/apiJobs";
import { deleteCompanyCascade } from "@/api/apiCompanies";
import { getUserDetails } from "@/api/apiUserDetails";
import { useAuth } from "@clerk/clerk-react";
import { Mail, X, User, Download, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const UserApplyList = () => {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [candidateDetailsMap, setCandidateDetailsMap] = useState({}); // candidate_id -> details
  const [expanded, setExpanded] = useState({}); // company name -> boolean
  const [selectedCandidate, setSelectedCandidate] = useState(null); // selected candidate for popup
  const { loading, data: applications, fn } = useFetch(getApplicationsForRecruiter, {
    recruiter_id: user?.id,
  });
  const { loading: loadingJobs, data: jobs, fn: fnJobs } = useFetch(getMyJobs, {
    recruiter_id: user?.id,
  });
  const { loading: loadingDeleteCompany, fn: fnDeleteCompany } = useFetch(deleteJobsByCompany, {
    recruiter_id: user?.id,
  });
  const { loading: loadingDeleteCascade, fn: fnDeleteCascade } = useFetch(deleteCompanyCascade);

  useEffect(() => {
    if (isLoaded && user?.id) { fn(); fnJobs(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  useEffect(() => {
    const load = async () => {
      const token = await getToken({ template: "supabase" });
      if (!token || !user?.id) return;
      const details = await getUserDetails(token, { user_id: user.id });
      setUserDetails(details);
    };
    if (isLoaded && user?.id) load();
  }, [isLoaded, user?.id, getToken]);

  const grouped = useMemo(() => {
    const byCompany = {};
    // Seed with jobs so companies with zero applications still appear
    if (Array.isArray(jobs)) {
      for (const job of jobs) {
        const company = job?.company?.name;
        if (!company) continue;
        if (!byCompany[company]) byCompany[company] = { jobs: [], applications: [] };
        byCompany[company].jobs.push(job);
      }
    }
    // Attach applications under their company
    if (Array.isArray(applications)) {
      for (const ap of applications) {
        const company = ap?.job?.company?.name;
        if (!company) continue;
        if (!byCompany[company]) byCompany[company] = { jobs: [], applications: [] };
        byCompany[company].applications.push(ap);
      }
    }
    return byCompany;
  }, [applications, jobs]);

  const toggle = (company) => {
    setExpanded((prev) => ({ ...prev, [company]: !prev[company] }));
  };

  const openCandidateDetails = (candidateDetails) => {
    // Derive education fields for display if top-level is missing
    const edu = Array.isArray(candidateDetails?.education) && candidateDetails.education.length > 0 ? candidateDetails.education[0] : {};
    const enhanced = {
      ...candidateDetails,
      college: candidateDetails?.college || edu?.institution || edu?.university,
      graduation_year: candidateDetails?.graduation_year || (edu?.end_date ? String(edu.end_date).slice(0,4) : undefined),
      branch: candidateDetails?.branch || edu?.field_of_study,
      cgpa: candidateDetails?.cgpa || edu?.academic_score_obtained,
    };
    setSelectedCandidate(enhanced);
  };

  const closeCandidateDetails = () => {
    setSelectedCandidate(null);
  };

  // Preload candidate details for all applications (cache by candidate_id)
  useEffect(() => {
    const loadAllCandidates = async () => {
      if (!applications || !applications.length) return;
      const token = await getToken({ template: "supabase" });
      if (!token) return;
      const uniqueIds = Array.from(
        new Set(applications.map((ap) => ap.candidate_id).filter(Boolean))
      ).filter((id) => !candidateDetailsMap[id]);
      if (uniqueIds.length === 0) return;
      const entries = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const details = await getUserDetails(token, { user_id: id });
            return [id, details];
          } catch (_) {
            return [id, null];
          }
        })
      );
      setCandidateDetailsMap((prev) => {
        const next = { ...prev };
        for (const [id, details] of entries) next[id] = details;
        return next;
      });
    };
    loadAllCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications]);

  const exportCompanyToExcel = (company, items) => {
    // Build rows with application + candidate details
    const rows = items.map((ap) => {
      const cand = candidateDetailsMap[ap.candidate_id] || {};
      const edu = Array.isArray(cand.education) && cand.education.length > 0 ? cand.education[0] : {};
      const college = cand.college || edu?.institution || edu?.university || "";
      const graduationYear = cand.graduation_year || (edu?.end_date ? String(edu.end_date).slice(0, 4) : "");
      const branch = cand.branch || edu?.field_of_study || "";
      const cgpa = cand.cgpa || edu?.academic_score_obtained || "";
      return {
        Company: ap.job?.company?.name || company,
        JobTitle: ap.job?.title || "",
        ApplicationId: ap.id,
        Status: ap.status || "",
        AppliedDate: ap.created_at ? new Date(ap.created_at).toLocaleString?.() : "",
        CandidateId: ap.candidate_id || "",
        CandidateFirstName: cand.first_name || "",
        CandidateLastName: cand.last_name || "",
        EmailPersonal: cand.personal_email || "",
        EmailCollege: cand.college_email || "",
        Phone: cand.phone_number || "",
        DateOfBirth: cand.date_of_birth || "",
        City: cand.city || "",
        State: cand.state || "",
        Country: cand.country || "",
        Pincode: cand.pincode || "",
        College: college,
        GraduationYear: graduationYear,
        Branch: branch,
        CGPA: cgpa,
        LinkedIn: cand.linkedin_url || "",
        GitHub: cand.github_url || "",
        Portfolio: cand.portfolio_url || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const filenameSafe = company.replace(/[^a-z0-9]+/gi, "_");
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${filenameSafe}_applications.xlsx`);
  };

  const deleteOneJob = async (jobId) => {
    if (!jobId) return;
    const confirmed = window.confirm("Delete this role and all its applications/saves?");
    if (!confirmed) return;
    try {
      const token = await getToken({ template: "supabase" });
      await deleteJob(token, { job_id: jobId });
      // refresh data
      fn();
      fnJobs();
    } catch (_) {}
  };

  const handleEmailCandidate = (candidateDetails, jobTitle) => {
    const email = candidateDetails?.personal_email || candidateDetails?.college_email;
    if (!email) {
      alert("No email address available for this candidate");
      return;
    }
    
    const subject = `Regarding your application for ${jobTitle}`;
    const body = `Dear ${candidateDetails?.first_name || 'Candidate'},

I hope this email finds you well. I am reaching out regarding your application for the ${jobTitle} position.

Best regards,
${userDetails?.first_name || 'Recruiter'}`;

    // Gmail compose URL with pre-filled email, subject, and body
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  if (!isLoaded || loading || loadingJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="mt-6">
<h1 className="text-black dark:gradient-title font-extrabold text-3xl sm:text-5xl text-center pb-4">
My Applicants
      </h1>
      {Object.keys(grouped).length ? (
        <div className="grid gap-4">
          {Object.entries(grouped).map(([company, entry]) => {
            const items = entry.applications || [];
            const companyJobs = entry.jobs || [];
            const total = items.length; // total applications across company
            return (
            <div key={company} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="w-full px-4 py-3 font-semibold flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="text-left flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md px-2 py-1 transition-colors text-gray-900 dark:text-white"
                  onClick={() => toggle(company)}
                >
                  <span>{company}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{total} application{total!==1?"s":""}</span>
                </button>
                <div className="flex items-center gap-2">
                  {/* <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm"
                    title="Edit company"
                    onClick={() => window.location.assign(`/hr-details?company=${encodeURIComponent(company)}`)}
                  >
                    <Pencil size={16} /> What
                  </button> */}
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                    title="Delete all jobs for this company"
                    onClick={async () => {
                      if (!companyJobs.length) return;
                      const companyId = companyJobs[0]?.company?.id || companyJobs[0]?.company_id;
                      if (!companyId) return;
                      const confirmed = window.confirm(`Delete company "${company}" and ${companyJobs.length} job(s)? This will remove the company from listings for everyone.`);
                      if (!confirmed) return;
                      await fnDeleteCascade({ company_id: companyId, name: company });
                      // refresh both lists
                      fn();
                      fnJobs();
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => exportCompanyToExcel(company, items)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-md text-sm"
                    title="Download Excel for this company"
                  >
                    <Download size={16} />
                    Export Excel
                  </button>
                </div>
              </div>
              {expanded[company] && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Render each job under this company; show 0 when none */}
                  {companyJobs.map((job) => {
                    const jobApplications = items.filter((ap) => ap.job_id === job.id);
                    if (jobApplications.length === 0) {
                      return (
                        <div key={`job-${job.id}`} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-white">{job.title}</div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => window.location.assign(`/post-job?edit=${job.id}`)}
                                title="Edit Role"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs"
                                onClick={() => deleteOneJob(job.id)}
                                title="Delete Role"
                              >
                                Delete
                              </button>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">0 applications</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return jobApplications.map((ap, idx) => (
                    <div key={ap.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800 shadow-sm">
                      {/* Job controls (shown on first card for this job) */}
                      {idx === 0 && (
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-900 dark:text-white">{ap.job?.title || job.title}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => window.location.assign(`/post-job?edit=${job.id}`)}
                              title="Edit Role"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs"
                              onClick={() => deleteOneJob(job.id)}
                              title="Delete Role"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div className="space-y-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Job Title</span>
                          <div className="font-medium text-gray-900 dark:text-white">{ap.job?.title || "-"}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                          <div className="font-medium text-gray-900 dark:text-white">{ap.status || "-"}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Applied Date</span>
                          <div className="font-medium text-gray-900 dark:text-white">{new Date(ap.created_at).toLocaleDateString?.() || "-"}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Application ID</span>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{ap.id}</div>
                        </div>
                      </div>
                      
                      {candidateDetailsMap[ap.candidate_id] && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                            <div className="space-y-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Candidate Name</span>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {candidateDetailsMap[ap.candidate_id]?.first_name && candidateDetailsMap[ap.candidate_id]?.last_name 
                                  ? `${candidateDetailsMap[ap.candidate_id].first_name} ${candidateDetailsMap[ap.candidate_id].last_name}`
                                  : ap.name || "N/A"
                                }
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {candidateDetailsMap[ap.candidate_id]?.personal_email || candidateDetailsMap[ap.candidate_id]?.college_email || "-"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {candidateDetailsMap[ap.candidate_id]?.phone_number || "-"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCandidateDetails(candidateDetailsMap[ap.candidate_id])}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                            >
                              <User size={16} />
                              More Details
                            </button>
                            <button
                              onClick={() => handleEmailCandidate(candidateDetailsMap[ap.candidate_id], ap.job?.title)}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-md transition-colors text-sm"
                              title="Send email to candidate"
                            >
                              <Mail size={16} />
                              Send Email
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    ));
                  })}
                </div>
              )}
            </div>
          );})}
        </div>
      ) : (
        <div className="text-center">No applicants yet.</div>
      )}

      {/* Candidate Details Popup */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Candidate Details</h2>
              <button
                onClick={closeCandidateDetails}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">First Name</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.first_name || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Name</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.last_name || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Personal Email</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.personal_email || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">College Email</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.college_email || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Phone Number</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.phone_number || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.date_of_birth || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">City</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.city || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">State</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.state || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Country</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.country || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Pincode</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.pincode || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Education Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Education Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">College/University</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.college || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Graduation Year</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.graduation_year || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Branch/Stream</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.branch || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">CGPA</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedCandidate?.cgpa || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedCandidate?.linkedin_url || selectedCandidate?.github_url || selectedCandidate?.portfolio_url) && (
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Professional Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCandidate?.linkedin_url && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">LinkedIn</span>
                        <div className="font-medium">
                          <a 
                            href={selectedCandidate.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedCandidate?.github_url && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">GitHub</span>
                        <div className="font-medium">
                          <a 
                            href={selectedCandidate.github_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedCandidate?.portfolio_url && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Portfolio</span>
                        <div className="font-medium">
                          <a 
                            href={selectedCandidate.portfolio_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeCandidateDetails}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApplyList;


