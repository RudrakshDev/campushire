import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { getUserDetails, upsertUserDetails } from "../api/apiUserDetails";
import { supabase } from "../utils/supabase";
import { ChevronDown, ChevronRight } from "lucide-react";

const UserDetails = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        // 1. Contact Information
        first_name: "",
        middle_name: "",
        last_name: "",
        college_email: "",
        college_id: "",
        personal_email: "",
        phone_number: "",
        linkedin_profile: "",
        github_profile: "",
        personal_website: "",
        address: "",
        city: "",
        district: "",
        taluka: "",
        state: "",
        country: "",
        pincode: "",

        // 2. Target Title
        target_title: "",

        // 3. Professional Summary
        professional_summary: "",

        // 4. Work Experience
        work_experience: [{
            company_name: "",
            company_description: "",
            position: "",
            role_responsibilities: "",
            location: "",
            employment_type: "",
            start_date: "",
            end_date: "",
            currently_working: false
        }],

        // 5. Education
        education: [{
            university: "",
            institution: "",
            location: "",
            degree: "",
            field_of_study: "",
            gpa_percentage: "",
            start_date: "",
            end_date: "",
            total_backlogs: "",
            active_backlogs: "",
            optional_subjects: "",
            additional_info: ""
        }],

        // 6. Skills & Interests
        skills_interests: [{
            category: "",
            skills: ""
        }],

        // 7. Certifications
        certifications: [{
            name: "",
            issuing_organization: "",
            start_date: "",
            end_date: "",
            no_expiry: false
        }],

        // 8. Awards & Scholarships
        awards_scholarships: [{
            name: "",
            issuing_organization: "",
            date_earned: ""
        }],

        // 9. Projects
        projects: [{
            title: "",
            type: "",
            associated_organization: "",
            start_date: "",
            end_date: "",
            present: false,
            role_contributions: "",
            tools_technologies: "",
            description: ""
        }],

        // 10. Volunteering & Leadership
        volunteering_leadership: [{
            organization_name: "",
            role_involvement: "",
            city: "",
            state: "",
            start_date: "",
            end_date: "",
            currently_active: false,
            additional_info: ""
        }],

        // 11. Publications & Research Papers
        publications_research: [{
            title: "",
            type: "",
            publisher: "",
            date: "",
            co_authors: "",
            additional_info: ""
        }],

        // 12. Languages Known
        languages: [{
            language: "",
            proficiency_level: ""
        }],

        // 13. Extracurricular Activities
        extracurricular: [{
            name: "",
            description: "",
            date: ""
        }],

        // 14. References
        references: [{
            name: "",
            designation: "",
            organization: "",
            email: "",
            phone: ""
        }],

        // 15. Patents & IP
        patents_ip: [{
            title: "",
            patent_number: "",
            issuing_authority: "",
            date_filed_granted: "",
            additional_info: ""
        }],

        // 16. Memberships & Affiliations
        memberships: [{
            organization_name: "",
            membership_type: "",
            start_date: "",
            end_date: "",
            additional_info: ""
        }]
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [expandedSections, setExpandedSections] = useState(new Set([0]));

    useEffect(() => {
        const fetchDetails = async () => {
            if (!user?.id) return;

            setLoading(true);
            setError(null);

            try {
                const token = await getToken({ template: "supabase" });
                if (!token) {
                    throw new Error("Failed to get authentication token");
                }

                const data = await getUserDetails(token, { user_id: user.id });
                if (data) {
                    setForm(prev => ({ ...prev, ...data }));
                    if (data.first_name && data.college_email) {
                        navigate("/jobs");
                    }
                }
            } catch (err) {
                console.error("Error fetching user details:", err);
                setError("Failed to load user details. Please try again.");
            } finally {
                setLoading(false);
                setInitialLoad(false);
            }
        };

        if (isLoaded && user) {
            fetchDetails();
        }
    }, [isLoaded, user, navigate, getToken]);

    const toggleSection = (sectionIndex) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionIndex)) {
            newExpanded.delete(sectionIndex);
        } else {
            newExpanded.add(sectionIndex);
        }
        setExpandedSections(newExpanded);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [section, index, field] = name.split('.');
            setForm(prev => ({
                ...prev,
                [section]: prev[section].map((item, i) =>
                    i === parseInt(index) ? { ...item, [field]: type === 'checkbox' ? checked : value } : item
                )
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }

        if (error) setError(null);
    };

    const addArrayItem = (section) => {
        const defaultItem = getDefaultItem(section);
        setForm(prev => ({
            ...prev,
            [section]: [...prev[section], defaultItem]
        }));
    };

    const removeArrayItem = (section, index) => {
        setForm(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    const getDefaultItem = (section) => {
        const defaults = {
            work_experience: {
                company_name: "", company_description: "", position: "", role_responsibilities: "",
                location: "", employment_type: "", start_date: "", end_date: "", currently_working: false
            },
            education: {
                university: "", institution: "", location: "", degree: "", field_of_study: "",
                gpa_percentage: "", start_date: "", end_date: "", total_backlogs: "", active_backlogs: "",
                optional_subjects: "", additional_info: ""
            },
            skills_interests: { category: "", skills: "" },
            certifications: { name: "", issuing_organization: "", start_date: "", end_date: "", no_expiry: false },
            awards_scholarships: { name: "", issuing_organization: "", date_earned: "" },
            projects: {
                title: "", type: "", associated_organization: "", start_date: "", end_date: "",
                present: false, role_contributions: "", tools_technologies: "", description: ""
            },
            volunteering_leadership: {
                organization_name: "", role_involvement: "", city: "", state: "", start_date: "",
                end_date: "", currently_active: false, additional_info: ""
            },
            publications_research: { title: "", type: "", publisher: "", date: "", co_authors: "", additional_info: "" },
            languages: { language: "", proficiency_level: "" },
            extracurricular: { name: "", description: "", date: "" },
            references: { name: "", designation: "", organization: "", email: "", phone: "" },
            patents_ip: { title: "", patent_number: "", issuing_authority: "", date_filed_granted: "", additional_info: "" },
            memberships: { organization_name: "", membership_type: "", start_date: "", end_date: "", additional_info: "" }
        };
        return defaults[section] || {};
    };

    const validateForm = () => {
        const errors = [];
        if (!form.first_name.trim()) errors.push("First name is required");
        if (!form.college_email.trim()) errors.push("College email is required");
        if (!form.college_id.trim()) errors.push("College ID is required");
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(", "));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getToken({ template: "supabase" });
            if (!token) {
                throw new Error("Failed to get authentication token");
            }

            const result = await upsertUserDetails(token, {
                user_id: user.id,
                ...form
            });

            console.log("User details saved successfully:", result);
            navigate("/jobs");
        } catch (err) {
            console.error("Error saving user details:", err);
            setError(err.message || "Failed to save details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field, name, value) => {
        const baseInputClasses = "w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md";

        switch (field.type) {
            case "text":
            case "email":
            case "tel":
            case "url":
                return (
                    <input
                        type={field.type}
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
            case "textarea":
                return (
                    <textarea
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={`${baseInputClasses} resize-none`}
                        rows={4}
                        disabled={loading}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
            case "radio":
                return (
                    <div className="flex flex-wrap gap-4">
                        {field.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center cursor-pointer group">
                                <input
                                    type="radio"
                                    name={name}
                                    value={option}
                                    checked={value === option}
                                    onChange={handleChange}
                                    className="mr-2 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    disabled={loading}
                                />
                                <span className="text-gray-700 group-hover:text-blue-600 transition-colors">{option}</span>
                            </label>
                        ))}
                    </div>
                );
            case "checkbox":
                return (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name={name}
                            checked={value}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            disabled={loading}
                        />
                        <span className="ml-2 text-gray-700">Yes</span>
                    </div>
                );
            case "select":
                return (
                    <select
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading}
                        required={field.required}
                    >
                        <option value="">Select an option</option>
                        {field.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            case "month":
                return (
                    <input
                        type="month"
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading}
                        required={field.required}
                    />
                );
            case "number":
                return (
                    <input
                        type="number"
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
        }
    };

    const sections = [
        {
            title: "1. Contact Information",
            fields: [
                { name: "first_name", label: "First Name", type: "text", required: true },
                { name: "middle_name", label: "Middle Name", type: "text", required: false },
                { name: "last_name", label: "Last Name", type: "text", required: true },
                { name: "college_email", label: "College Email", type: "email", required: true },
                { name: "college_id", label: "College ID", type: "text", required: true },
                { name: "personal_email", label: "Personal Email", type: "email", required: false },
                { name: "phone_number", label: "Phone Number", type: "tel", required: false },
                { name: "linkedin_profile", label: "LinkedIn Profile Link", type: "url", required: false },
                { name: "github_profile", label: "GitHub Profile Link", type: "url", required: false },
                { name: "personal_website", label: "Personal Website/Portfolio Link", type: "url", required: false },
                { name: "address", label: "Address", type: "text", required: false },
                { name: "city", label: "City", type: "text", required: false },
                { name: "district", label: "District", type: "text", required: false },
                { name: "taluka", label: "Taluka", type: "text", required: false },
                { name: "state", label: "State", type: "text", required: false },
                { name: "country", label: "Country", type: "text", required: false },
                { name: "pincode", label: "Pincode", type: "text", required: false }
            ]
        },
        {
            title: "2. Target Title",
            fields: [
                { name: "target_title", label: "Target Title", type: "text", required: false }
            ]
        },
        {
            title: "3. Professional Summary",
            fields: [
                { name: "professional_summary", label: "Professional Summary", type: "textarea", required: false }
            ]
        },
        {
            title: "4. Work Experience",
            type: "array",
            arrayField: "work_experience",

            fields: [
                { name: "company_name", label: "Company/Organization Name", type: "text", required: false },
                { name: "company_description", label: "Company/Organization Description", type: "textarea", required: false },
                { name: "position", label: "Position/Job Title", type: "text", required: false },
                { name: "role_responsibilities", label: "Role & Responsibilities", type: "textarea", required: false },
                { name: "location", label: "Location", type: "text", required: false },
                { name: "employment_type", label: "Employment Type", type: "radio", options: ["Internship", "Full-time", "Part-time"], required: false },
                { name: "start_date", label: "Start Date", type: "month", required: false },
                { name: "end_date", label: "End Date", type: "month", required: false },
                { name: "currently_working", label: "Currently Working in this Role", type: "checkbox", required: false }
            ]
        },
        {
            title: "5. Education",
            type: "array",
            arrayField: "education",
            fields: [
                { name: "university", label: "University/Board", type: "text", required: false },
                { name: "institution", label: "Institution/College Name", type: "text", required: false },
                { name: "location", label: "Location", type: "text", required: false },
                { name: "degree", label: "Degree", type: "text", required: false },
                { name: "field_of_study", label: "Field of Study/Department", type: "text", required: false },
                { name: "gpa_percentage", label: "GPA/Percentage", type: "text", required: false },
                { name: "start_date", label: "Start Date", type: "month", required: false },
                { name: "end_date", label: "End Date", type: "month", required: false },
                { name: "total_backlogs", label: "Total Backlogs", type: "number", min: "0", required: false },
                { name: "active_backlogs", label: "Active Backlogs", type: "number", min: "0", required: false },
                { name: "optional_subjects", label: "Optional Subjects", type: "text", required: false },
                { name: "additional_info", label: "Additional Information", type: "textarea", required: false }
            ]
        },
        {
            title: "6. Skills & Interests",
            type: "array",
            arrayField: "skills_interests",
            fields: [
                { name: "category", label: "Category", type: "select", options: ["Technical Skills", "Soft Skills", "Languages"], required: false },
                { name: "skills", label: "Skills & Interests", type: "text", required: false }
            ]
        },
        {
            title: "7. Certifications",
            type: "array",
            arrayField: "certifications",
            fields: [
                { name: "name", label: "Certification Name", type: "text", required: false },
                { name: "issuing_organization", label: "Issuing Organization/Provider", type: "text", required: false },
                { name: "start_date", label: "Start Date", type: "month", required: false },
                { name: "end_date", label: "End Date", type: "month", required: false },
                { name: "no_expiry", label: "No Expiry", type: "checkbox", required: false }
            ]
        },
        {
            title: "8. Awards & Scholarships",
            type: "array",
            arrayField: "awards_scholarships",
            fields: [
                { name: "name", label: "Award/Scholarship Name", type: "text", required: false },
                { name: "issuing_organization", label: "Issuing Organization", type: "text", required: false },
                { name: "date_earned", label: "Date Earned", type: "month", required: false }
            ]
        },
        {
            title: "9. Projects",
            type: "array",
            arrayField: "projects",
            fields: [
                { name: "title", label: "Project Title", type: "text", required: false },
                { name: "type", label: "Project Type", type: "select", options: ["Academic", "Professional", "Personal"], required: false },
                { name: "associated_organization", label: "Associated Organization", type: "text", required: false },
                { name: "start_date", label: "Start Date", type: "month", required: false },
                { name: "end_date", label: "End Date", type: "month", required: false },
                { name: "present", label: "Present", type: "checkbox", required: false },
                { name: "role_contributions", label: "Role/Contributions", type: "text", required: false },
                { name: "tools_technologies", label: "Tools/Technologies/Skills Used", type: "text", required: false },
                { name: "description", label: "Description/Achievements", type: "textarea", required: false }
            ]
        },
        {
            title: "10. Volunteering & Leadership",
            type: "array",
            arrayField: "volunteering_leadership",
            fields: [
                { name: "organization_name", label: "Organization Name", type: "text", required: false },
                { name: "role_involvement", label: "Role/Involvement", type: "text", required: false },
                { name: "city", label: "City", type: "text", required: false },
                { name: "state", label: "State", type: "text", required: false },
                { name: "start_date", label: "Start Date", type: "month", required: false },
                { name: "end_date", label: "End Date", type: "month", required: false },
                { name: "currently_active", label: "Currently Active in this Role", type: "checkbox", required: false },
                { name: "additional_info", label: "Additional Information", type: "textarea", required: false }
            ]
        },
        {
            title: "11. Publications & Research Papers",
            type: "array",
            arrayField: "publications_research",
            fields: [
                { name: "title", label: "Title of Publication/Research Paper", type: "text", required: false },
                { name: "type", label: "Type", type: "select", options: ["Journal Article", "Conference Paper"], required: false },
                { name: "publisher", label: "Publisher/Journal/Conference Name", type: "text", required: false },
                { name: "date", label: "Date of Publication", type: "month", required: false },
                { name: "co_authors", label: "Co-Authors", type: "text", required: false },
                { name: "additional_info", label: "Additional Information", type: "textarea", required: false }
            ]
        },
        {
            title: "12. Languages Known",
            type: "array",
            arrayField: "languages",
            fields: [
                { name: "language", label: "Language", type: "text", required: false },
                { name: "proficiency_level", label: "Proficiency Level", type: "select", options: ["Fluent", "Intermediate", "Beginner"], required: false }
            ]
        },
        {
            title: "13. Extracurricular Activities/Achievements",
            type: "array",
            arrayField: "extracurricular",
            fields: [
                { name: "name", label: "Activity/Achievement Name", type: "text", required: false },
                { name: "description", label: "Description", type: "textarea", required: false },
                { name: "date", label: "Date", type: "month", required: false }
            ]
        },
        {
            title: "14. References",
            type: "array",
            arrayField: "references",
            fields: [
                { name: "name", label: "Reference Name", type: "text", required: false },
                { name: "designation", label: "Designation", type: "text", required: false },
                { name: "organization", label: "Organization", type: "text", required: false },
                { name: "email", label: "Email", type: "email", required: false },
                { name: "phone", label: "Phone", type: "tel", required: false }
            ]
        },
        {
            title: "15. Patents/Intellectual Property",
            type: "array",
            arrayField: "patents_ip",
            fields: [
                { name: "title", label: "Patent/IP Title", type: "text", required: false },
                { name: "patent_number", label: "Patent Number/Registration", type: "text", required: false },
                { name: "issuing_authority", label: "Issuing Authority", type: "text", required: false },
                { name: "date_filed_granted", label: "Date Filed/Granted", type: "text", required: false },
                { name: "additional_info", label: "Additional Information", type: "textarea", required: false }
            ]
        },
        {
            title: "16. Memberships/Affiliations",
            type: "array",
            arrayField: "memberships",
            fields: [
                { name: "organization_name", label: "Organization Name", type: "text", required: false },
                { name: "membership_type", label: "Membership Type/Role", type: "text", required: false },
                { name: "start_date", label: "Start Date", type: "month", required: false },
                { name: "end_date", label: "End Date", type: "month", required: false },
                { name: "additional_info", label: "Additional Information", type: "textarea", required: false }
            ]
        }
    ];

    if (!isLoaded || initialLoad) {
        return (
            <div className="flex justify-center items-center mt-40">
                <BarLoader width={"100%"} color="#36d7b7" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 animate-pulse">
                        Student Details Form
                    </h2>
                    <p className="text-gray-600 text-lg">Complete your profile to get started</p>
                    <div className="mt-4 flex justify-center">
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"></div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg mb-6 shadow-sm">
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <button
                                type="button"
                                onClick={() => toggleSection(sectionIndex)}
                                className="w-full px-8 py-5 text-left bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 flex items-center justify-between font-semibold text-gray-800 border-b border-gray-200 transition-all duration-200 group"
                            >
                                <span className="text-xl group-hover:text-blue-700 transition-colors">{section.title}</span>
                                {expandedSections.has(sectionIndex) ? (
                                    <ChevronDown className="h-7 w-7 text-blue-600 transform transition-transform duration-200" />
                                ) : (
                                    <ChevronRight className="h-7 w-7 text-blue-600 transform transition-transform duration-200 group-hover:scale-110" />
                                )}
                            </button>

                            {expandedSections.has(sectionIndex) && (
                                <div className="p-8 space-y-6 bg-white animate-in slide-in-from-top-2 duration-300">
                                    {section.type === "array" ? (
                                        // Array sections (Work Experience, Education, etc.)
                                        <div className="space-y-6">
                                            {form[section.arrayField].map((item, itemIndex) => (
                                                <div key={itemIndex} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-md hover:shadow-lg transition-all duration-200">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="font-bold text-gray-800 text-lg flex items-center">
                                                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                                                {itemIndex + 1}
                                                            </span>
                                                            {section.title}
                                                        </h4>
                                                        {form[section.arrayField].length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem(section.arrayField, itemIndex)}
                                                                className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300 hover:scale-105"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {section.fields.map((field, fieldIndex) => (
                                                            <div key={fieldIndex} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                                    {field.label}
                                                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                                                </label>
                                                                {renderField(field, `${section.arrayField}.${itemIndex}.${field.name}`, item[field.name])}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addArrayItem(section.arrayField)}
                                                className="w-full py-4 px-6 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium text-lg hover:scale-[1.02] transform"
                                            >
                                                + Add {section.title}
                                            </button>
                                        </div>
                                    ) : (
                                        // Regular sections (Contact Info, Target Title, etc.)
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {section.fields.map((field, fieldIndex) => (
                                                <div key={fieldIndex} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    {renderField(field, field.name, form[field.name])}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                        <Button
                            type="submit"
                            variant="blue"
                            className="w-full text-xl h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                    Saving...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <span>Save & Continue</span>
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            )}
                        </Button>
                    </div>
                </form>

                {loading && !initialLoad && (
                    <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-center space-x-3">
                            <BarLoader width={"100%"} color="#3b82f6" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetails;