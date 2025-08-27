import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function HrDetail() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>  
        <CardTitle className="text-2xl font-bold text-center">HR Profile Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* Personal Information Section */}
          <AccordionItem value="personal-info" className="border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold">1. Personal Information</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" placeholder="Enter middle name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter last name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" placeholder="Enter designation" />
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
                  <Input id="officialEmail" type="email" placeholder="Enter official email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" type="tel" placeholder="Enter phone number" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                  <Input id="linkedinProfile" type="url" placeholder="Enter LinkedIn profile URL" />
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
                  <Input id="companyName" placeholder="Enter company name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industryType">Industry Type</Label>
                  <Input id="industryType" placeholder="Enter industry type" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="aboutCompany">About Company / Description</Label>
                  <Textarea id="aboutCompany" placeholder="Enter company description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headquartersLocation">Headquarters Location</Label>
                  <Input id="headquartersLocation" placeholder="Enter headquarters location" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input id="establishedYear" type="number" placeholder="Enter established year" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteLink">Website Link</Label>
                  <Input id="websiteLink" type="url" placeholder="Enter website URL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyLinkedin">LinkedIn Profile</Label>
                  <Input id="companyLinkedin" type="url" placeholder="Enter company LinkedIn URL" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companySize">Size / Number of Employees</Label>
                  <Input id="companySize" placeholder="Enter number of employees" />
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
                  <Textarea id="officeAddress" placeholder="Enter office address" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Enter city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Enter state" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" placeholder="Enter country" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" placeholder="Enter pincode" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
