import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/clerk-react"
import useFetch from "@/hooks/use-fetch"
import { upsertHrProfile, getHrProfileByRecruiter } from "@/api/apiHrProfiles"
import { BarLoader } from "react-spinners"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useAuth } from "@clerk/clerk-react"

export default function HrDetail() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [message, setMessage] = useState("");
  const { loading, error, fn } = useFetch(upsertHrProfile);
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({ shouldUnregister: false });
  const [existingProfile, setExistingProfile] = useState(null);

  // Load existing profile and prefill form
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const token = await getToken({ template: "supabase" });
      if (!token) return;
      const profile = await getHrProfileByRecruiter(token, { recruiter_id: user.id });
      setExistingProfile(profile);
      if (profile) {
        reset({
          fullName: profile.full_name || "",
          designation: profile.designation || "",
          officialEmail: profile.email || "",
          phoneNumber: profile.phone || "",
          linkedinProfile: profile.linkedin_url || "",
          companyName: profile.company_name || "",
          industryType: profile.industry_type || "",
          aboutCompany: profile.about_company || "",
          headquartersLocation: profile.hq_location || "",
          establishedYear: profile.established_year?.toString?.() || "",
          websiteLink: profile.website_url || "",
          companyLinkedin: profile.company_linkedin_url || "",
          companySize: profile.company_size || "",
          officeAddress: profile.office_address || "",
          city: profile.city || "",
          state: profile.state || "",
          country: profile.country || "",
          pincode: profile.pincode || "",
        });
      }
    };
    loadProfile();
  }, [user?.id, getToken, reset]);

  const onSubmit = (data) => {
    if (!user?.id) return;
    // Start with existing values; only overwrite with provided inputs
    const base = existingProfile || {};
    const profile = {
      id: base.id, // allow upsert to target the same row if present
      recruiter_id: user.id,
      // Personal
      ...(data.fullName !== undefined && data.fullName !== "" ? { full_name: data.fullName } : {}),
      ...(data.designation !== undefined && data.designation !== "" ? { designation: data.designation } : {}),
      // Contact
      ...(data.officialEmail !== undefined && data.officialEmail !== "" ? { email: data.officialEmail } : {}),
      ...(data.phoneNumber !== undefined && data.phoneNumber !== "" ? { phone: data.phoneNumber } : {}),
      ...(data.linkedinProfile !== undefined && data.linkedinProfile !== "" ? { linkedin_url: data.linkedinProfile } : {}),
      // Company
      ...(data.companyName !== undefined && data.companyName !== "" ? { company_name: data.companyName } : {}),
      ...(data.industryType !== undefined && data.industryType !== "" ? { industry_type: data.industryType } : {}),
      ...(data.aboutCompany !== undefined && data.aboutCompany !== "" ? { about_company: data.aboutCompany } : {}),
      ...(data.headquartersLocation !== undefined && data.headquartersLocation !== "" ? { hq_location: data.headquartersLocation } : {}),
      ...(data.establishedYear !== undefined && data.establishedYear !== "" ? { established_year: Number(data.establishedYear) } : {}),
      ...(data.websiteLink !== undefined && data.websiteLink !== "" ? { website_url: data.websiteLink } : {}),
      ...(data.companyLinkedin !== undefined && data.companyLinkedin !== "" ? { company_linkedin_url: data.companyLinkedin } : {}),
      ...(data.companySize !== undefined && data.companySize !== "" ? { company_size: data.companySize } : {}),
      // Office
      ...(data.officeAddress !== undefined && data.officeAddress !== "" ? { office_address: data.officeAddress } : {}),
      ...(data.city !== undefined && data.city !== "" ? { city: data.city } : {}),
      ...(data.state !== undefined && data.state !== "" ? { state: data.state } : {}),
      ...(data.country !== undefined && data.country !== "" ? { country: data.country } : {}),
      ...(data.pincode !== undefined && data.pincode !== "" ? { pincode: data.pincode } : {}),
    };

    fn(profile)
      .then(() => {
        setMessage("HR profile saved.");
        navigate("/post-job");
      })
      .catch(() => setMessage("Failed to save HR profile."));
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>  
        <CardTitle className="text-2xl font-bold text-center">HR Profile Structure</CardTitle>
      </CardHeader>
      <CardContent>
        {message && <p className="text-sm text-green-400 mb-2">{message}</p>}
        {error?.message && <p className="text-sm text-red-400 mb-2">{error.message}</p>}
        {loading && <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* Personal Information Section */}
          <AccordionItem value="personal-info" className="border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold">1. Personal Information</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Enter full name" {...register("fullName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" placeholder="Enter designation" {...register("designation")} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contact Information Section */}
          <AccordionItem value="contact-info" className="border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold">2. Contact Information</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="officialEmail">Official Email</Label>
                  <Input id="officialEmail" type="email" placeholder="Enter official email" {...register("officialEmail")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" type="tel" placeholder="Enter phone number" {...register("phoneNumber")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                  <Input id="linkedinProfile" type="url" placeholder="Enter LinkedIn profile URL" {...register("linkedinProfile")} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Company Information Section */}
          <AccordionItem value="company-info" className="border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold">3. Company Information</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" placeholder="Enter company name" {...register("companyName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industryType">Industry Type</Label>
                  <Input id="industryType" placeholder="Enter industry type" {...register("industryType")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="aboutCompany">About Company / Description</Label>
                  <Textarea id="aboutCompany" placeholder="Enter company description" rows={3} {...register("aboutCompany")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headquartersLocation">Headquarters Location</Label>
                  <Input id="headquartersLocation" placeholder="Enter headquarters location" {...register("headquartersLocation")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input id="establishedYear" type="number" placeholder="Enter established year" {...register("establishedYear")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteLink">Website Link</Label>
                  <Input id="websiteLink" type="url" placeholder="Enter website URL" {...register("websiteLink")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyLinkedin">LinkedIn Profile</Label>
                  <Input id="companyLinkedin" type="url" placeholder="Enter company LinkedIn URL" {...register("companyLinkedin")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companySize">Size / Number of Employees</Label>
                  <Input id="companySize" placeholder="Enter number of employees" {...register("companySize")} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Office Information Section */}
          <AccordionItem value="office-info" className="border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold">4. Office Information</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="officeAddress">Office Address / Venue</Label>
                  <Textarea id="officeAddress" placeholder="Enter office address" rows={2} {...register("officeAddress")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Enter city" {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Enter state" {...register("state")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" placeholder="Enter country" {...register("country")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" placeholder="Enter pincode" {...register("pincode")} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="blue">Save Profile</Button>
        </div>
        </form>
      </CardContent>
    </Card>
  )
}
