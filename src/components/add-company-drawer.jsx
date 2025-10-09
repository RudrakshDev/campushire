/* eslint-disable react/prop-types */
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useFetch from "@/hooks/use-fetch";
import { ensureCompanyByName, updateCompanyLogo } from "@/api/apiCompanies";
import { BarLoader } from "react-spinners";
import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { getHrProfileByRecruiter } from "@/api/apiHrProfiles";

const schema = z.object({
  logo: z
    .any()
    .refine(
      (file) => file?.[0] && (file[0].type === "image/png" || file[0].type === "image/jpeg"),
      { message: "Only Images are allowed" }
    ),
});

const AddCompanyDrawer = ({ fetchCompanies }) => {
  const { user } = useUser();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { loading: loadingHr, data: hrProfile, fn: fnHr } = useFetch(getHrProfileByRecruiter, { recruiter_id: user?.id });
  const { loading: loadingEnsure, data: ensuredCompany, fn: fnEnsure } = useFetch(ensureCompanyByName, {});
  const { loading: loadingLogo, error: errorLogo, data: dataLogo, fn: fnUpdateLogo } = useFetch(updateCompanyLogo);

  useEffect(() => {
    if (user?.id) fnHr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const companyName = useMemo(() => (hrProfile?.company_name || "").trim(), [hrProfile]);

  const onSubmit = async (data) => {
    const file = data.logo?.[0];
    if (!file || !companyName) return;
    // Ensure we have a single company id, then update by id
    const ensured = await fnEnsure({ name: companyName });
    const company_id = ensured?.id || ensuredCompany?.id;
    if (!company_id) return;
    await fnUpdateLogo({ company_id }, file);
  };

  useEffect(() => {
    if (dataLogo) {
      fetchCompanies();
    }
  }, [dataLogo, fetchCompanies]);

  return (
    <Drawer>
      <DrawerTrigger>
        <Button type="button" size="sm" variant="secondary">
          Add Company Logo
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Upload Company Logo</DrawerTitle>
        </DrawerHeader>
        <form className="flex gap-2 p-4 pb-0">
          {/* Company Logo */}
          <Input
            type="file"
            accept="image/*"
            className=" file:text-gray-500"
            {...register("logo")}
          />

          {/* Add Button */}
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            variant="destructive"
            className="w-40"
          >
            Add
          </Button>
        </form>
        <DrawerFooter>
          {errors.logo && <p className="text-red-500">{errors.logo.message}</p>}
          {errorLogo?.message && (
            <p className="text-red-500">{errorLogo?.message}</p>
          )}
          {(loadingHr || loadingEnsure || loadingLogo) && <BarLoader width={"100%"} color="#36d7b7" />}
          <DrawerClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddCompanyDrawer;
