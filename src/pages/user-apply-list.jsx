import { useEffect, useMemo, useState } from "react";
import { BarLoader } from "react-spinners";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch";
import { getApplicationsForRecruiter } from "@/api/apiApplication";
import { getUserDetails } from "@/api/apiUserDetails";
import { useAuth } from "@clerk/clerk-react";
import { Mail, X, User } from "lucide-react";

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

  useEffect(() => {
    if (isLoaded && user?.id) fn();
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
    if (!applications) return {};
    return applications.reduce((acc, ap) => {
      const company = ap.job?.company?.name;
      if (!company) return acc; // skip unknown company
      if (!acc[company]) acc[company] = [];
      acc[company].push(ap);
      return acc;
    }, {});
  }, [applications]);

  const toggle = (company) => {
    setExpanded((prev) => ({ ...prev, [company]: !prev[company] }));
  };

  const openCandidateDetails = (candidateDetails) => {
    setSelectedCandidate(candidateDetails);
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

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="mt-6">
      <h1 className="gradient-title font-extrabold text-3xl sm:text-5xl text-center pb-4">
        My Applicants
      </h1>
      {applications?.length ? (
        <div className="grid gap-4">
          {Object.entries(grouped).map(([company, items]) => (
            <div key={company} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <button
                type="button"
                className="w-full text-left px-4 py-3 font-semibold flex justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                onClick={() => toggle(company)}
              >
                <span>{company}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} application{items.length>1?"s":""}</span>
              </button>
              {expanded[company] && (
                <div className="px-4 pb-4 space-y-3">
                  {items.map((ap) => (
                    <div key={ap.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800 shadow-sm">
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
                  ))}
                </div>
              )}
            </div>
          ))}
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


