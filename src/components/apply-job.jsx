/* eslint-disable react/prop-types */

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch";
import { applyToJob } from "@/api/apiApplication";
import { getUserDetails } from "@/api/apiUserDetails";
import { BarLoader } from "react-spinners";
import { useAuth } from "@clerk/clerk-react";


export function ApplyJobDrawer({ user, job, fetchJob, applied = false }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const {
    loading: loadingApply,
    error: errorApply,
    fn: fnApply,
  } = useFetch(applyToJob);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("Failed to get authentication token");
        const details = await getUserDetails(token, { user_id: user.id });
        setUserDetails(details);
        setLoading(false);
        // If details are missing, flag to require profile completion (do not redirect here)
        if (!details || !details.first_name || !details.college_email || !details.college_id) {
          setNeedsProfile(true);
        } else {
          setNeedsProfile(false);
        }
      } catch (err) {
        setError("Failed to load user details");
        setLoading(false);
      }
    };
    if (user?.id) fetchDetails();
  }, [user, getToken, navigate]);

  const handleApply = async () => {
    setError(null);
    // Guard: prevent apply if profile is incomplete
    if (needsProfile) {
      return;
    }
    try {
      await fnApply({
        job_id: job.id,
        candidate_id: user.id,
        name: user.fullName,
        status: "applied",
      });
      fetchJob();
    } catch (err) {
      setError("Failed to apply to job");
    }
  };

  if (loading || loadingApply) {
    return <BarLoader width={"100%"} color="#36d7b7" />;
  }

  const editProfileUrl = `/user-details?edit=1&redirect=/job/${job?.id}`;

  // If already applied, show disabled button but allow editing profile
  if (applied) {
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        <Button size="lg" variant="destructive" disabled>
          Applied
        </Button>
        {!needsProfile && (
          <Button size="lg" variant="outline" onClick={() => navigate(editProfileUrl)}>
            Edit Profile
          </Button>
        )}
      </div>
    );
  }

  // If job closed
  if (!job?.isOpen) {
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        <Button size="lg" variant="destructive" disabled>
          Hiring Closed
        </Button>
        {!needsProfile && (
          <Button size="lg" variant="outline" onClick={() => navigate(editProfileUrl)}>
            Edit Profile
          </Button>
        )}
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="flex gap-2 justify-center">
        <Button size="lg" variant="secondary" onClick={() => navigate("/user-details") }>
          Complete Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      <Button size="lg" variant="blue" onClick={handleApply}>
        Apply
      </Button>
      <Button size="lg" variant="outline" onClick={() => navigate(editProfileUrl)}>
        Edit Profile
      </Button>
    </div>
  );
}
