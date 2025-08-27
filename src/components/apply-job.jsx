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
        // If details are missing, redirect
        if (!details || !details.full_name || !details.cgpa || !details.sgpa || !details.resume) {
          navigate("/user-details");
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

  // If already applied, show disabled button
  if (applied) {
    return (
      <Button size="lg" variant="destructive" disabled>
        Applied
      </Button>
    );
  }

  // If job closed
  if (!job?.isOpen) {
    return (
      <Button size="lg" variant="destructive" disabled>
        Hiring Closed
      </Button>
    );
  }

  return (
    <Button size="lg" variant="blue" onClick={handleApply}>
      Apply
    </Button>
  );
}
