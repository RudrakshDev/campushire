import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/clerk-react"
import useFetch from "@/hooks/use-fetch"
import { upsertHrProfile } from "@/api/apiHrProfiles"
import { BarLoader } from "react-spinners"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"

export default function HrDetail() {
  const { user, isLoaded } = useUser();
  const [message, setMessage] = useState("");
  const { loading, error, fn } = useFetch(upsertHrProfile);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({ shouldUnregister: false });

  const onSubmit = (data) => {
    if (!user?.id) return;
    const profile = {
      recruiter_id: user.id,
      // Personal
      full_name: data.fullName || null,
      designation: data.designation || null,
      // Contact
      email: data.officialEmail || null,
      phone: data.phoneNumber || null,
      linkedin_url: data.linkedinProfile || null,
      // Company
      company_name: data.companyName || null,
      industry_type: data.industryType || null,
      about_company: data.aboutCompany || null,
      hq_location: data.headquartersLocation || null,
      established_year: data.establishedYear ? Number(data.establishedYear) : null,
      website_url: data.websiteLink || null,
      company_linkedin_url: data.companyLinkedin || null,
      company_size: data.companySize || null,
      // Office
      office_address: data.officeAddress || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      pincode: data.pincode || null,
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
