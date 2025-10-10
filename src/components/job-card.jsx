/* eslint-disable react/prop-types */
import { Heart, MapPinIcon, Trash2Icon, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/use-fetch";
import { deleteJob, saveJob } from "@/api/apiJobs";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

const JobCard = ({
  job,
  savedInit = false,
  onJobAction = () => {},
  isMyJob = false,
}) => {
  const [saved, setSaved] = useState(savedInit);

  const { user } = useUser();

  const { loading: loadingDeleteJob, fn: fnDeleteJob } = useFetch(deleteJob, {
    job_id: job.id,
  });

  const {
    loading: loadingSavedJob,
    data: savedJob,
    fn: fnSavedJob,
  } = useFetch(saveJob);

  const handleSaveJob = async () => {
    await fnSavedJob({
      user_id: user.id,
      job_id: job.id,
    });
    onJobAction();
  };

  const handleDeleteJob = async () => {
    await fnDeleteJob();
    onJobAction();
  };

  useEffect(() => {
    if (savedJob !== undefined) setSaved(savedJob?.length > 0);
  }, [savedJob]);

  return (
    <Card className="flex flex-col">
      {loadingDeleteJob && (
        <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
      )}
      <CardHeader className="flex">
        <CardTitle className="flex justify-between font-bold">
          {job.title}
          {isMyJob && null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex justify-between items-center">
          {/* Company visual: logo if present, else fallback to name */}
          {job.company?.logo_url ? (
            (() => {
              const isAmazon = /amazon/i.test(
                (job.company.name || job.company.logo_url || "")
              );
              const logoClass = isAmazon
                ? "h-6 filter brightness-0 dark:filter-none dark:brightness-100"
                : "h-6";
              const src = `${job.company.logo_url}?_=${job.id}`;
              return (
                <img
                  src={src}
                  className={logoClass}
                  alt={job.company.name}
                  loading="lazy"
                />
              );
            })()
          ) : (
            <div className="text-sm text-gray-400 font-semibold">
              {job.company?.name || "Unnamed Company"}
            </div>
          )}
          <div className="flex gap-3 items-center">
            {isMyJob && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {(Array.isArray(job.applications) ? job.applications.length : 0)} Applicants
              </span>
            )}
            <div className="flex gap-2 items-center">
              <MapPinIcon size={15} /> {job.location}
            </div>
          </div>
        </div>
        <hr />
        {(() => {
          const firstDot = job.description.indexOf(".");
          if (firstDot > 0) return job.description.substring(0, firstDot + 1);
          const snippet = (job.description || "").trim();
          return snippet.length > 140 ? snippet.substring(0, 140) + "…" : snippet;
        })()}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link to={`/job/${job.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            More Details
          </Button>
        </Link>
        {isMyJob && (
          <div className="flex items-center px-3 text-sm text-gray-400">
            {(Array.isArray(job.applications) ? job.applications.length : 0)} Applicants
          </div>
        )}
        {!isMyJob && (
          <Button
            variant="outline"
            className="w-15"
            onClick={handleSaveJob}
            disabled={loadingSavedJob}
          >
            {saved ? (
              <Heart size={20} fill="red" stroke="red" />
            ) : (
              <Heart size={20} />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;
