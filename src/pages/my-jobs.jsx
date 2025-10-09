import CreatedApplications from "@/components/created-applications";
import CreatedJobs from "@/components/created-jobs";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";

const MyJobs = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div>
      <h1 className="font-extrabold text-5xl sm:text-7xl text-center pb-8 text-black dark:text-white">
        {user?.unsafeMetadata?.role === "recruiter" ? "My Jobs" : "My Applications"}
      </h1>
      {user?.unsafeMetadata?.role === "recruiter" ? (
        <CreatedJobs />
      ) : (
        <CreatedApplications />
      )}
    </div>
  );
};

export default MyJobs;
