import { useUser } from "@clerk/clerk-react";
import ApplicationCard from "./application-card";
import { useEffect } from "react";
import { getApplications } from "@/api/apiApplication";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

const CreatedApplications = () => {
  const { user, isLoaded } = useUser();

  const {
    loading: loadingApplications,
    data: applications,
    fn: fnApplications,
  } = useFetch(getApplications, {
    user_id: user.id,
  });

  useEffect(() => {
    if (isLoaded && user?.id) {
      fnApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  if (loadingApplications) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (!applications || applications.length === 0) {
    return <div className="text-center">No applications yet.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          isCandidate={true}
          onAction={fnApplications}
        />
      ))}
    </div>
  );
};

export default CreatedApplications;
