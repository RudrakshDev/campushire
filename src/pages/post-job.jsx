import { getCompanies, ensureCompanyByName } from "@/api/apiCompanies";
  import { addNewJob, getSingleJob, updateJob } from "@/api/apiJobs";
import AddCompanyDrawer from "@/components/add-company-drawer";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { State } from "country-state-city";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import { getHrProfileByRecruiter } from "@/api/apiHrProfiles";
import { useAuth } from "@clerk/clerk-react";

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  location: z.string().min(1, { message: "Select a location" }),
  company_id: z.string().min(1, { message: "Select or Add a new Company" }),
  requirements: z.string().min(1, { message: "Requirements are required" }),
});

const PostJob = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { title: "", description: "", location: "", company_id: "", requirements: "" },
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = async (data) => {
    if (editJobId) {
      const token = await getToken({ template: "supabase" });
      try {
        await updateJob(token, { job_id: Number(editJobId) }, {
          ...data,
          recruiter_id: user.id,
        });
        navigate("/jobs");
      } catch (e) {
        // no-op: errors surfaced by hook in create flow; for update keep simple
      }
      return;
    }
    fnCreateJob({
      ...data,
      recruiter_id: user.id,
      isOpen: true,
    });
  };

  useEffect(() => {
    if (dataCreateJob?.length > 0) navigate("/jobs");
  }, [loadingCreateJob]);

  const {
    loading: loadingCompanies,
    data: companies,
    fn: fnCompanies,
  } = useFetch(getCompanies);

  // Load existing job details when editing
  const {
    loading: loadingExisting,
    data: existingJob,
    fn: fnGetJob,
  } = useFetch(getSingleJob, { job_id: Number(editJobId) });

  // Gate: ensure HR profile exists before allowing posting
  const {
    loading: loadingHr,
    data: hrProfile,
    fn: fnHr,
  } = useFetch(getHrProfileByRecruiter, { recruiter_id: user?.id });

  useEffect(() => {
    if (isLoaded && user?.id) {
      fnCompanies();
      fnHr();
      if (editJobId) {
        fnGetJob();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && !loadingHr && hrProfile === null) {
      navigate("/hr-details");
    }
  }, [isLoaded, loadingHr, hrProfile]);

  // Prefill company from HR profile if available
  useEffect(() => {
    if (!isLoaded || loadingCompanies || loadingHr) return;
    // If editing, do not override values from existing job
    if (editJobId) return;
    if (!companies || !hrProfile) return;
    const currentCompanyId = watch("company_id");
    const currentLocation = watch("location");

    // Company prefill
    const setCompanyByName = async (name) => {
      const token = await getToken({ template: "supabase" });
      if (!token || !name) return;
      try {
        const ensured = await ensureCompanyByName(token, { name });
        if (ensured?.id != null) {
          // Refresh companies list so the new company appears
          await fnCompanies();
          setValue("company_id", String(ensured.id), { shouldValidate: true, shouldDirty: true });
        }
      } catch (_) {}
    };

    if (!currentCompanyId) {
      const rawName = hrProfile?.company_name || "";
      const hrCompanyName = rawName.trim();
      if (hrCompanyName) {
        const match = companies.find((c) => (c?.name || "").trim().toLowerCase() === hrCompanyName.toLowerCase());
        if (match?.id != null) {
          setValue("company_id", String(match.id), { shouldValidate: true, shouldDirty: true });
        } else {
          // Create it if not present
          setCompanyByName(hrCompanyName);
        }
      }
    }

    // Location prefill (use saved state if it matches IN states)
    if (!currentLocation) {
      const states = State.getStatesOfCountry("IN");
      const hrState = (hrProfile?.state || "").trim().toLowerCase();
      if (hrState && Array.isArray(states)) {
        const stateMatch = states.find((s) => (s?.name || "").trim().toLowerCase() === hrState);
        if (stateMatch?.name) {
          setValue("location", stateMatch.name, { shouldValidate: true, shouldDirty: true });
        }
      }
    }
  }, [isLoaded, loadingCompanies, loadingHr, companies, hrProfile, setValue, watch, getToken, fnCompanies]);

  // When existing job is loaded, populate the form
  useEffect(() => {
    if (!existingJob) return;
    setValue("title", existingJob.title ?? "", { shouldValidate: true });
    setValue("description", existingJob.description ?? "", { shouldValidate: true });
    setValue("location", existingJob.location ?? "", { shouldValidate: true });
    setValue("company_id", existingJob.company_id != null ? String(existingJob.company_id) : "", { shouldValidate: true });
    setValue("requirements", existingJob.requirements ?? "", { shouldValidate: true });
  }, [existingJob, setValue]);

  if (!isLoaded || loadingCompanies || loadingHr || (!!editJobId && loadingExisting)) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to="/jobs" />;
  }

  return (
    <div>
<h1 className="text-black dark:gradient-title font-extrabold text-3xl sm:text-5xl text-center pb-4">
{editJobId ? "Edit Job" : "Post a Job"}
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4 pb-0"
      >
        <Input placeholder="Job Title" {...register("title")} />
        {errors.title && <p className="text-red-500">{errors.title.message}</p>}

        <Textarea placeholder="Job Description" {...register("description")} />
        {errors.description && (
          <p className="text-red-500">{errors.description.message}</p>
        )}

        <div className="flex gap-4 items-center">
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {State.getStatesOfCountry("IN").map(({ name }) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Company">
                    {field.value
                      ? companies?.find((com) => com.id === Number(field.value))
                          ?.name
                      : "Company"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {companies?.map(({ name, id }) => (
                      <SelectItem key={id ?? name} value={String(id)}>
                        {name ?? "Unnamed Company"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <AddCompanyDrawer fetchCompanies={fnCompanies} />
        </div>
        {errors.location && (
          <p className="text-red-500">{errors.location.message}</p>
        )}
        {errors.company_id && (
          <p className="text-red-500">{errors.company_id.message}</p>
        )}

        <Controller
          name="requirements"
          control={control}
          render={({ field }) => (
            <MDEditor
              value={field.value}
              onChange={field.onChange}
              data-color-mode="light"
              className="bg-white text-black"
              style={{ backgroundColor: "#ffffff", color: "#000000" }}
            />
          )}
        />
        {errors.requirements && (
          <p className="text-red-500">{errors.requirements.message}</p>
        )}
        {errors.errorCreateJob && (
          <p className="text-red-500">{errors?.errorCreateJob?.message}</p>
        )}
        {errorCreateJob?.message && (
          <p className="text-red-500">{errorCreateJob?.message}</p>
        )}
        {loadingCreateJob && <BarLoader width={"100%"} color="#36d7b7" />}
        <Button type="submit" variant="blue" size="lg" className="mt-2">
          {editJobId ? "Update" : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
