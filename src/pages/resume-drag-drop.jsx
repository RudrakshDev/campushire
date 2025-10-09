import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";

const cdnPdfJs = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

function normalize(text) {
    if (!text) return "";
    let t = String(text);
    // Remove soft hyphens and fix hyphenation across line breaks
    t = t.replace(/\u00ad/g, "");
    t = t.replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/g, "$1$2");
    // Replace non-breaking spaces with regular spaces
    t = t.replace(/\u00a0/g, " ");
    // Fix common ligatures
    t = t.replace(/\ufb00/g, "ff").replace(/\ufb01/g, "fi").replace(/\ufb02/g, "fl").replace(/\ufb03/g, "ffi").replace(/\ufb04/g, "ffl");
    // Collapse spaces
    t = t.replace(/[\t\v\f]+/g, " ").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n");
    return t;
}

function parseFieldsFromText(text) {
    text = normalize(text);
    const result = {};
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) result.personal_email = emailMatch[0];

    const phoneMatch = text.match(/(?:\+?\d[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/);
    if (phoneMatch) result.phone_number = phoneMatch[0];

    const linkedin = text.match(/https?:\/\/[^\s]*linkedin[^\s]*/i);
    if (linkedin) result.linkedin_profile = linkedin[0];
    const github = text.match(/https?:\/\/[^\s]*github[^\s]*/i);
    if (github) result.github_profile = github[0];
    const portfolio = text.match(/https?:\/\/[^\s]*(?:portfolio|behance|vercel|netlify|my\-site|about|folio|site|github\.io)[^\s]*/i);
    if (portfolio) result.personal_website = portfolio[0];

    const explicitTitle = lines.find((l) => /^title\s*[:\-]/i.test(l));
    if (explicitTitle) {
        result.target_title = explicitTitle.replace(/^title\s*[:\-]\s*/i, "").trim();
    } else {
        const titleLine = lines.find((l) => /(developer|engineer|designer|analyst|manager|devops|data|frontend|backend)/i.test(l) && !/:/.test(l));
        if (titleLine) result.target_title = titleLine;
    }

    const isLikelyName = (l) => {
        if (/:/.test(l)) return false;
        const tokens = l.split(/\s+/);
        if (tokens.length < 1 || tokens.length > 4) return false;
        const bad = /(skills|experience|education|projects|summary|objective|profile|contact|technical|languages)/i.test(l);
        if (bad) return false;
        const alphaRatio = l.replace(/[^A-Za-z\s]/g, "").length / Math.max(1, l.length);
        return alphaRatio > 0.7;
    };
    const nameLine = lines.find(isLikelyName);
    if (nameLine) {
        const parts = nameLine.split(/\s+/);
        result.first_name = parts[0];
        if (parts.length > 1) result.last_name = parts.slice(1).join(" ");
    }

    let skillsText = "";
    const skillsHeaderIndex = lines.findIndex((l) => /skills/i.test(l));
    if (skillsHeaderIndex !== -1) {
        const tail = lines.slice(skillsHeaderIndex + 1);
        const stopAt = tail.findIndex((l) => /(experience|education|projects|work history|certifications|summary)/i.test(l));
        const chosen = stopAt === -1 ? tail : tail.slice(0, stopAt);
        const slice = [lines[skillsHeaderIndex], ...chosen].join(" ");
        const afterColon = slice.split(/skills\s*[:\-]/i)[1] || slice;
        skillsText = afterColon;
    } else {
        const commaList = text.match(/([A-Za-z][A-Za-z0-9+#\.\- ]+,\s*){3,}[A-Za-z0-9+#\.\- ]+/);
        if (commaList) skillsText = commaList[0];
    }
    if (skillsText) {
        skillsText = skillsText.replace(/\b(TECHNICAL\s+SKILLS|SKILLS|EXPERIENCE)\b/gi, "");
        result.skills_interests = [
            { category: "Technical Skills", skills: skillsText.replace(/\s+/g, " ").trim() },
        ];
    }

    const sumIdx = lines.findIndex((l) => /(summary|objective|profile)/i.test(l));
    if (sumIdx !== -1) {
        const para = lines.slice(sumIdx + 1, sumIdx + 6).join(" ");
        if (para) result.professional_summary = para;
    }

    return result;
}

async function extractPdfText(arrayBuffer) {
    if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = cdnPdfJs;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }
    const pdfjsLib = window.pdfjsLib;
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = cdnPdfJs.replace("pdf.min.js", "pdf.worker.min.js");
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str);
        fullText += strings.join("\n") + "\n";
    }
    return fullText;
}

const ResumeDragDrop = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const saveDraftToLocalStorage = (payload) => {
        const specificKey = `userDetailsDraft${user?.id ? `:${user.id}` : ""}`;
        const genericKey = "userDetailsDraft";
        try {
            const existingSpecific = JSON.parse(localStorage.getItem(specificKey) || "{}");
            const mergedSpecific = { ...existingSpecific, ...payload };
            localStorage.setItem(specificKey, JSON.stringify(mergedSpecific));
        } catch (_) {}
        try {
            const existingGeneric = JSON.parse(localStorage.getItem(genericKey) || "{}");
            const mergedGeneric = { ...existingGeneric, ...payload };
            localStorage.setItem(genericKey, JSON.stringify(mergedGeneric));
        } catch (_) {}
    };

    const handleFile = async (file) => {
        setError(null);
        if (!file) return;
        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file");
            return;
        }
        setLoading(true);
        try {
            const buf = await file.arrayBuffer();
            const text = await extractPdfText(buf);
            if (!text || /sign in|need permission|access denied/i.test(text)) {
                throw new Error("Could not read text from PDF. Ensure it contains selectable text (not scanned).");
            }
            const fields = parseFieldsFromText(text || "");
            const hasMeaningful = (() => {
                const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
                if (nonEmpty(fields.first_name) || nonEmpty(fields.last_name)) return true;
                if (nonEmpty(fields.personal_email) || nonEmpty(fields.phone_number)) return true;
                if (nonEmpty(fields.target_title) || nonEmpty(fields.professional_summary)) return true;
                if (Array.isArray(fields.skills_interests)) {
                    const anySkill = fields.skills_interests.some((it) => it && (nonEmpty(it.skills) || nonEmpty(it.category)));
                    if (anySkill) return true;
                }
                return false;
            })();
            if (!hasMeaningful) {
                setError("Couldn't extract data. Try a different resume PDF with selectable text.");
                return;
            }
            saveDraftToLocalStorage(fields);
            try { sessionStorage.setItem("resumeImportDraft", JSON.stringify(fields)); } catch (_) {}
            const nonce = Date.now();
            navigate(`/user-details?edit=1&from=resume&n=${nonce}`);
        } catch (e) {
            setError(e.message || "Failed to process PDF");
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };

    const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
    const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };

    if (!isLoaded) {
        return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="font-extrabold text-4xl sm:text-6xl text-center pb-6 text-black dark:text-white">
                Import From Resume (Upload)
            </h1>
            <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-gray-300 dark:border-gray-700"}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
            >
                <p className="text-gray-700 dark:text-gray-300 mb-4">Drag & drop your resume PDF here</p>
                <p className="text-gray-500 dark:text-gray-400 mb-6">or</p>
                <input id="resume-file" type="file" accept="application/pdf" onChange={onInputChange} className="hidden" />
                <label htmlFor="resume-file">
                    <Button variant="blue" disabled={loading}>Choose PDF</Button>
                </label>
                {loading && <BarLoader className="mt-6" width={"100%"} color="#36d7b7" />}
                {error && (
                    <div className="mt-4 text-red-500 text-sm border border-red-400 rounded-md p-3 bg-red-50 dark:bg-red-900/20">
                        {error}
                    </div>
                )}
                <div className="mt-6">
                    <Button variant="outline" onClick={() => navigate("/user-details?edit=1")}>Open User Details</Button>
                </div>
            </div>
        </div>
    );
};

export default ResumeDragDrop;


