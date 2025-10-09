import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { getUserDetails, upsertUserDetails } from "../api/apiUserDetails";
import { ChevronDown, ChevronRight } from "lucide-react";

const UserDetails = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isEditMode = searchParams.get("edit") === "1";
    const redirectTo = searchParams.get("redirect") || "/jobs";

    const [form, setForm] = useState({
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
        target_title: "",
        professional_summary: "",
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
        education: [{
            university: "",
            institution: "",
            location: "",
            degree: "",
            field_of_study: "",
            academic_score_type: "",
            academic_score_total: "",
            academic_score_obtained: "",
            start_date: "",
            end_date: "",
            total_backlogs: "",
            active_backlogs: "",
            optional_subjects: "",
            additional_info: ""
        }],
        skills_interests: [{
            category: "",
            skills: ""
        }],
        certifications: [{
            name: "",
            issuing_organization: "",
            start_date: "",
            end_date: "",
            no_expiry: false
        }],
        awards_scholarships: [{
            name: "",
            issuing_organization: "",
            date_earned: ""
        }],
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
        publications_research: [{
            title: "",
            type: "",
            publisher: "",
            date: "",
            co_authors: "",
            additional_info: ""
        }],
        languages: [{
            language: "",
            proficiency_level: ""
        }],
        extracurricular: [{
            name: "",
            description: "",
            date: ""
        }],
        references_list: [{
            name: "",
            designation: "",
            organization: "",
            email: "",
            phone: ""
        }],
        patents_ip: [{
            title: "",
            patent_number: "",
            issuing_authority: "",
            date_filed_granted: "",
            additional_info: ""
        }],
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
    const [debugDraft, setDebugDraft] = useState(null);
    const hasAppliedResumeDataRef = useRef(false);

    // Helper to merge values only into empty fields
    const fillOnlyMissing = (current, draft) => {
        const result = { ...current };
        Object.keys(draft || {}).forEach((key) => {
            const dVal = draft[key];
            const cVal = result[key];
            const isEmptyString = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === "");
            if (Array.isArray(dVal)) {
                const hasMeaningful = Array.isArray(cVal) && cVal.some((it) => it && Object.values(it).some((v) => String(v || "").trim() !== ""));
                if (!hasMeaningful) result[key] = dVal;
            } else if (isEmptyString(cVal) && !isEmptyString(dVal)) {
                result[key] = dVal;
            }
        });
        return result;
    };

    // Apply resume data from router state when component mounts
    useEffect(() => {
        const from = searchParams.get("from");
        if (from === "resume" && location.state?.resumeData && !hasAppliedResumeDataRef.current) {
            const resumeData = location.state.resumeData;
            setForm(prev => fillOnlyMissing(prev, resumeData));
            setDebugDraft(resumeData);
            hasAppliedResumeDataRef.current = true;
        }
    }, [location.state, searchParams]);

    // Fetch user details from server
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
                    // If coming from resume import and server has data, merge them intelligently
                    let merged = data;
                    if (isEditMode && location.state?.resumeData) {
                        const resumeData = location.state.resumeData;
                        const nonEmpty = (v) => typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null;
                        const next = { ...data };
                        Object.keys(resumeData).forEach((k) => {
                            const v = resumeData[k];
                            if (Array.isArray(v)) {
                                const hasMeaningful = v.some((it) => it && Object.values(it).some((vv) => (typeof vv === 'string' ? vv.trim() !== '' : Boolean(vv))));
                                const serverMeaningful = Array.isArray(next[k]) && next[k].some((it) => it && Object.values(it).some((vv) => (typeof vv === 'string' ? vv.trim() !== '' : Boolean(vv))));
                                if (hasMeaningful && !serverMeaningful) next[k] = v;
                            } else if (nonEmpty(v)) {
                                if (!nonEmpty(next[k])) next[k] = v;
                            }
                        });
                        merged = next;
                    }
                    setForm(prev => ({ ...prev, ...merged }));
                    if (!isEditMode && data.first_name && data.college_email) {
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
    }, [isLoaded, user, navigate, getToken, isEditMode, location.state]);

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
                academic_score_type: "", academic_score_total: "", academic_score_obtained: "",
                start_date: "", end_date: "", total_backlogs: "", active_backlogs: "",
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
            references_list: { name: "", designation: "", organization: "", email: "", phone: "" },
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
            navigate(redirectTo);
        } catch (err) {
            console.error("Error saving user details:", err);
            setError(err.message || "Failed to save details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field, name, value, disabledOverride = false) => {
        const baseInputClasses = "w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

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
                        disabled={loading || disabledOverride}
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
                        disabled={loading || disabledOverride}
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
                                    disabled={loading || disabledOverride}
                                />
                                <span className="text-gray-700 dark:text-gray-200 group-hover:text-blue-600 transition-colors">{option}</span>
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
                            disabled={loading || disabledOverride}
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-200">Yes</span>
                    </div>
                );
            case "select":
                return (
                    <select
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading || disabledOverride}
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
                    <div className="relative">
                        {!value && (
                            <span className="pointer-events-none select-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                {`Select ${field.label.toLowerCase()}`}
                            </span>
                        )}
                        <input
                            type="month"
                            name={name}
                            value={value || ""}
                            onChange={handleChange}
                            className={`${baseInputClasses} month-input ${!value ? "text-transparent" : "text-current"}`}
                            data-has-value={!!value}
                            disabled={loading || disabledOverride}
                            required={field.required}
                        />
                    </div>
                );
            case "number":
                return (
                    <input
                        type="number"
                        name={name}
                        value={value || ""}
                        onChange={handleChange}
                        className={baseInputClasses}
                        disabled={loading || disabledOverride}
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
                        disabled={loading || disabledOverride}
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
                { name: "academic_score_type", label: "Academic Score", type: "select", options: ["CGPA", "GPA", "Percentage"], required: false },
                { name: "academic_score_total", label: "Total", type: "number", min: "0", required: false },
                { name: "academic_score_obtained", label: "Obtained", type: "number", min: "0", required: false },
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
                { name: "type", label: "Project Type", type: "text", required: false },
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
                { name: "type", label: "Publication Type", type: "text", required: false },
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
            arrayField: "references_list",
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-black py-8">
            <style>{`
                /* Hide native placeholder dashes for empty month inputs */
                input.month-input[data-has-value="false"]::-webkit-datetime-edit-year-field,
                input.month-input[data-has-value="false"]::-webkit-datetime-edit-month-field,
                input.month-input[data-has-value="false"]::-webkit-datetime-edit-text {
                    color: transparent;
                }
                input.month-input[data-has-value="false"]::-webkit-calendar-picker-indicator {
                    opacity: 0.8; /* keep icon visible */
                }
            `}</style>
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-8">
                    <h2 className="flex flex-col items-center justify-center font-extrabold sm:text-6xl text-black dark:text-white">
                        Student Details Form
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">{isEditMode ? "Update your profile details" : "Complete your profile to get started"}</p>
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

                {isEditMode && debugDraft && (
                    <div className="mb-6 text-xs border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
                        <div className="font-semibold mb-2">Debug: parsed resume data detected</div>
                        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugDraft, null, 2)}</pre>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <button
                                type="button"
                                onClick={() => toggleSection(sectionIndex)}
                                className="w-full px-8 py-5 text-left bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 group"
                            >
                                <span className="text-xl group-hover:text-blue-700 transition-colors">{section.title}</span>
                                {expandedSections.has(sectionIndex) ? (
                                    <ChevronDown className="h-7 w-7 text-blue-600 transform transition-transform duration-200" />
                                ) : (
                                    <ChevronRight className="h-7 w-7 text-blue-600 transform transition-transform duration-200 group-hover:scale-110" />
                                )}
                            </button>

                            {expandedSections.has(sectionIndex) && (
                                <div className="p-8 space-y-6 bg-white dark:bg-gray-900 animate-in slide-in-from-top-2 duration-300">
                                    {section.type === "array" ? (
                                        <div className="space-y-6">
                                            {form[section.arrayField].map((item, itemIndex) => (
                                                <div key={itemIndex} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md dark:shadow-none hover:shadow-lg transition-all duration-200">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg flex items-center">
                                                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                                                {itemIndex + 1}
                                                            </span>
                                                            {section.title}
                                                        </h4>
                                                        {form[section.arrayField].length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem(section.arrayField, itemIndex)}
                                                                className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-300 hover:scale-105"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {section.fields.map((field, fieldIndex) => (
                                                            <div key={fieldIndex} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                                    {field.label}
                                                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                                                </label>
                                                                {renderField(
                                                                    field,
                                                                    `${section.arrayField}.${itemIndex}.${field.name}`,
                                                                    item[field.name],
                                                                    section.arrayField === "work_experience" && field.name === "end_date" && item.currently_working
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addArrayItem(section.arrayField)}
                                                className="w-full py-4 px-6 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-medium text-lg hover:scale-[1.02] transform"
                                            >
                                                + Add {section.title}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {section.fields.map((field, fieldIndex) => (
                                                <div key={fieldIndex} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
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

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
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
                    <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none p-6 border border-gray-200 dark:border-gray-700">
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