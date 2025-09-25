import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const HrDetail = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Individual state for each field to avoid complex object updates
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [designation, setDesignation] = useState("");
    const [officialEmail, setOfficialEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [linkedinProfileHr, setLinkedinProfileHr] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [aboutCompany, setAboutCompany] = useState("");
    const [industryType, setIndustryType] = useState("");
    const [headquartersLocation, setHeadquartersLocation] = useState("");
    const [websiteLink, setWebsiteLink] = useState("");
    const [companyLinkedinProfile, setCompanyLinkedinProfile] = useState("");
    const [establishedYear, setEstablishedYear] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [officeAddress, setOfficeAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("");
    const [pincode, setPincode] = useState("");

    const validateForm = () => {
        const errors = [];
        if (!firstName.trim()) errors.push("First name is required");
        if (!lastName.trim()) errors.push("Last name is required");
        if (!officialEmail.trim()) errors.push("Official email is required");
        if (!phoneNumber.trim()) errors.push("Phone number is required");
        if (!companyName.trim()) errors.push("Company name is required");
        return errors;
    };

    const handleSubmit = async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(", "));
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const formData = {
                firstName, middleName, lastName, designation,
                officialEmail, phoneNumber, linkedinProfileHr,
                companyName, aboutCompany, industryType, headquartersLocation,
                websiteLink, companyLinkedinProfile, establishedYear, companySize,
                officeAddress, city, state, country, pincode
            };
            
            // TODO: Send to backend
            await new Promise((r) => setTimeout(r, 800));
            alert("Form submitted successfully!");
        } catch (err) {
            setError("Failed to save details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const baseInputClasses = "w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-black py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-8">
                    <h2 className="flex flex-col items-center justify-center font-extrabold text-4xl sm:text-6xl text-black dark:text-white">
                        HR Profile Form
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">Provide your and company details</p>
                    <div className="mt-4 flex justify-center">
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"></div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg mb-6 shadow-sm dark:bg-red-900/30 dark:border-red-600 dark:text-red-300">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <Accordion type="single" collapsible className="space-y-4">
                        {/* 1. Personal Information */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <AccordionItem value="personal">
                                <AccordionTrigger className="w-full px-8 py-5 text-left bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 text-xl">
                                    1. Personal Information
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                First Name <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="Enter first name"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                value={middleName}
                                                onChange={(e) => setMiddleName(e.target.value)}
                                                placeholder="Enter middle name"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Last Name <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Enter last name"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={designation}
                                                onChange={(e) => setDesignation(e.target.value)}
                                                placeholder="Enter designation"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </div>

                        {/* 2. Contact Information */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <AccordionItem value="contact">
                                <AccordionTrigger className="w-full px-8 py-5 text-left bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 text-xl">
                                    2. Contact Information
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Official Email <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={officialEmail}
                                                onChange={(e) => setOfficialEmail(e.target.value)}
                                                placeholder="Enter official email"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Phone Number <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="Enter phone number"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                LinkedIn Profile
                                            </label>
                                            <input
                                                type="url"
                                                value={linkedinProfileHr}
                                                onChange={(e) => setLinkedinProfileHr(e.target.value)}
                                                placeholder="Enter LinkedIn profile URL"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </div>

                        {/* 3. Company Information */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <AccordionItem value="company">
                                <AccordionTrigger className="w-full px-8 py-5 text-left bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 text-xl">
                                    3. Company Information
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Company Name <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="Enter company name"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                About Company / Description
                                            </label>
                                            <textarea
                                                value={aboutCompany}
                                                onChange={(e) => setAboutCompany(e.target.value)}
                                                rows={4}
                                                placeholder="Enter company description"
                                                className={`${baseInputClasses} resize-none`}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Industry Type
                                            </label>
                                            <input
                                                type="text"
                                                value={industryType}
                                                onChange={(e) => setIndustryType(e.target.value)}
                                                placeholder="Enter industry type"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Headquarters Location
                                            </label>
                                            <input
                                                type="text"
                                                value={headquartersLocation}
                                                onChange={(e) => setHeadquartersLocation(e.target.value)}
                                                placeholder="Enter headquarters location"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Website Link
                                            </label>
                                            <input
                                                type="url"
                                                value={websiteLink}
                                                onChange={(e) => setWebsiteLink(e.target.value)}
                                                placeholder="Enter website URL"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                LinkedIn Profile
                                            </label>
                                            <input
                                                type="url"
                                                value={companyLinkedinProfile}
                                                onChange={(e) => setCompanyLinkedinProfile(e.target.value)}
                                                placeholder="Enter LinkedIn page URL"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Established Year
                                            </label>
                                            <input
                                                type="number"
                                                value={establishedYear}
                                                onChange={(e) => setEstablishedYear(e.target.value)}
                                                placeholder="Enter established year"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Size / Number of Employees
                                            </label>
                                            <input
                                                type="text"
                                                value={companySize}
                                                onChange={(e) => setCompanySize(e.target.value)}
                                                placeholder="Enter company size"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </div>

                        {/* 4. Office Information */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <AccordionItem value="office">
                                <AccordionTrigger className="w-full px-8 py-5 text-left bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 text-xl">
                                    4. Office Information
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Office Address / Venue
                                            </label>
                                            <input
                                                type="text"
                                                value={officeAddress}
                                                onChange={(e) => setOfficeAddress(e.target.value)}
                                                placeholder="Enter office address or venue"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="Enter city"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                placeholder="Enter state"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                placeholder="Enter country"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Pincode
                                            </label>
                                            <input
                                                type="text"
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value)}
                                                placeholder="Enter pincode"
                                                className={baseInputClasses}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </div>
                    </Accordion>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                        <Button
                            onClick={handleSubmit}
                            className="w-full text-xl h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                    Saving...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <span>Save</span>
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                {loading && (
                    <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{width: '45%'}}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HrDetail;