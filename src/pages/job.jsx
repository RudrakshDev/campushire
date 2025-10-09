import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";

import {  
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplyJobDrawer } from "@/components/apply-job";
import ApplicationCard from "@/components/application-card";

import useFetch from "@/hooks/use-fetch";
import { getSingleJob, updateHiringStatus } from "@/api/apiJobs";
import { getHrProfileByRecruiter } from "@/api/apiHrProfiles";

const JobPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  const {
    loading: loadingJob,
    data: job,
    fn: fnJob,
  } = useFetch(getSingleJob, {
    job_id: id,
  });

  useEffect(() => {
    if (isLoaded) fnJob();
  }, [isLoaded]);

  const {
    loading: loadingHr,
    data: hr,
    fn: fnHr,
  } = useFetch(getHrProfileByRecruiter, { recruiter_id: job?.recruiter_id });

  useEffect(() => {
    if (job?.recruiter_id) fnHr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.recruiter_id]);

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(
    updateHiringStatus,
    {
      job_id: id,
    }
  );

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus(isOpen).then(() => fnJob());
  };

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="flex flex-col gap-8 mt-5">
      <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
        <h1 className="font-extrabold pb-3 text-4xl sm:text-6xl text-black dark:gradient-title">
          {job?.title}
        </h1>
        {job?.company?.logo_url && (
          <img src={`${job.company.logo_url}?_=${job.id}`} className="h-12" alt={job?.title} />
        )}
      </div>

      <div className="flex justify-between ">
        <div className="flex gap-2">
          <MapPinIcon /> {job?.location}
        </div>
        <div className="flex gap-2">
          <Briefcase /> {job?.applications?.length} Applicants
        </div>
        <div className="flex gap-2">
          {job?.isOpen ? (
            <>
              <DoorOpen /> Open
            </>
          ) : (
            <>
              <DoorClosed /> Closed
            </>
          )}
        </div>
      </div>

      {job?.recruiter_id === user?.id && (
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-full ${job?.isOpen ? "bg-green-950" : "bg-red-950"}`}
          >
            <SelectValue
              placeholder={
                "Hiring Status " + (job?.isOpen ? "( Open )" : "( Closed )")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold">About the job</h2>
      <p className="sm:text-lg">{job?.description}</p>

      <h2 className="text-2xl sm:text-3xl font-bold">
        What we are looking for
      </h2>
      <MDEditor.Markdown
        source={job?.requirements}
        className="bg-transparent sm:text-lg text-gray-900 dark:text-gray-100"
      />

      {hr && (
        <div className="border rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-2">HR Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Name:</span> {hr.full_name || "-"}</div>
            <div><span className="font-medium">Designation:</span> {hr.designation || "-"}</div>
            <div><span className="font-medium">Email:</span> {hr.email || "-"}</div>
            <div><span className="font-medium">Phone:</span> {hr.phone || "-"}</div>
            <div className="md:col-span-2"><span className="font-medium">LinkedIn:</span> {hr.linkedin_url ? <a className="underline" href={hr.linkedin_url} target="_blank" rel="noreferrer">{hr.linkedin_url}</a> : "-"}</div>
            <div className="md:col-span-2"><span className="font-medium">Office Address:</span> {hr.office_address || "-"}</div>
            <div><span className="font-medium">City:</span> {hr.city || "-"}</div>
            <div><span className="font-medium">State:</span> {hr.state || "-"}</div>
            <div><span className="font-medium">Country:</span> {hr.country || "-"}</div>
            <div><span className="font-medium">Pincode:</span> {hr.pincode || "-"}</div>
          </div>
        </div>
      )}
      {job?.recruiter_id !== user?.id && (
        <ApplyJobDrawer
          job={job}
          user={user}
          fetchJob={fnJob}
          applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
        />
      )}
      {loadingHiringStatus && <BarLoader width={"100%"} color="#36d7b7" />}
      {job?.applications?.length > 0 && job?.recruiter_id === user?.id && (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold mb-4 text-xl ml-1">Applications</h2>
          {job?.applications.map((application) => {
            return (
              <ApplicationCard key={application.id} application={application} />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobPage;
