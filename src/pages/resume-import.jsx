import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";

const cdnPdfJs = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

function toDirectGoogleUrl(raw) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    // Handle common drive formats
    // 1) https://drive.google.com/file/d/{id}/view?usp=sharing
    const parts = u.pathname.split("/");
    const fileIndex = parts.indexOf("file");
    if (u.hostname.includes("drive.google.com") && fileIndex !== -1) {
      const id = parts[fileIndex + 2];
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    // 2) https://docs.google.com/document/d/{id}/edit ... → export as pdf
    const docIndex = parts.indexOf("document");
    if (u.hostname.includes("docs.google.com") && docIndex !== -1) {
      const id = parts[docIndex + 2];
      if (id) return `https://docs.google.com/document/d/${id}/export?format=pdf`;
    }
  } catch (_) {}
  return raw;
}

function toReaderProxyUrl(raw) {
  try {
    const s = String(raw).replace(/^https?:\/\//i, "");
    // Use read-only content proxy that returns extracted text for many formats (incl. PDFs)
    return `https://r.jina.ai/http://${s}`;
  } catch (_) {
    return raw;
  }
}

function normalize(text) {
  if (!text) return "";
  let t = String(text);
  t = t.replace(/\u00ad/g, "");
  t = t.replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/g, "$1$2");
  t = t.replace(/\u00a0/g, " ");
  t = t.replace(/\ufb00/g, "ff").replace(/\ufb01/g, "fi").replace(/\ufb02/g, "fl").replace(/\ufb03/g, "ffi").replace(/\ufb04/g, "ffl");
  t = t.replace(/[\t\v\f]+/g, " ").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n");
  return t;
}

function parseFieldsFromText(text) {
  text = normalize(text);
  const result = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Email
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) result.personal_email = emailMatch[0];

  // Phone (very permissive)
  const phoneMatch = text.match(/(?:\+?\d[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/);
  if (phoneMatch) result.phone_number = phoneMatch[0];

  // Links
  const linkedin = text.match(/https?:\/\/[^\s]*linkedin[^\s]*/i);
  if (linkedin) result.linkedin_profile = linkedin[0];
  const github = text.match(/https?:\/\/[^\s]*github[^\s]*/i);
  if (github) result.github_profile = github[0];
  const portfolio = text.match(/https?:\/\/[^\s]*(?:portfolio|behance|vercel|netlify|my\-site|about|folio|site|github\.io)[^\s]*/i);
  if (portfolio) result.personal_website = portfolio[0];

  // Target title: if there is an explicit Title: line, capture it
  const explicitTitle = lines.find((l) => /^title\s*[:\-]/i.test(l));
  if (explicitTitle) {
    result.target_title = explicitTitle.replace(/^title\s*[:\-]\s*/i, "").trim();
  } else {
    const titleLine = lines.find((l) => /(developer|engineer|designer|analyst|manager|devops|data|frontend|backend)/i.test(l) && !/:/.test(l));
    if (titleLine) result.target_title = titleLine;
  }

  // Name: choose the first candidate-looking line (2-4 words, letters), ignore section headers and lines with ':'
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

  // Skills section
  let skillsText = "";
  const skillsHeaderIndex = lines.findIndex((l) => /skills/i.test(l));
  if (skillsHeaderIndex !== -1) {
    // Take next lines until a new section header (e.g., EXPERIENCE/EDUCATION)
    const tail = lines.slice(skillsHeaderIndex + 1);
    const stopAt = tail.findIndex((l) => /(experience|education|projects|work history|certifications|summary)/i.test(l));
    const chosen = stopAt === -1 ? tail : tail.slice(0, stopAt);
    const slice = [lines[skillsHeaderIndex], ...chosen].join(" ");
    const afterColon = slice.split(/skills\s*[:\-]/i)[1] || slice;
    skillsText = afterColon;
  } else {
    // fallback: look for comma separated tech list anywhere
    const commaList = text.match(/([A-Za-z][A-Za-z0-9+#\.\- ]+,\s*){3,}[A-Za-z0-9+#\.\- ]+/);
    if (commaList) skillsText = commaList[0];
  }
  if (skillsText) {
    // Remove common headings that slipped in
    skillsText = skillsText.replace(/\b(TECHNICAL\s+SKILLS|SKILLS|EXPERIENCE)\b/gi, "");
    result.skills_interests = [
      { category: "Technical Skills", skills: skillsText.replace(/\s+/g, " ").trim() },
    ];
  }

  // Professional summary: grab paragraph after Summary/Objective header
  const sumIdx = lines.findIndex((l) => /(summary|objective|profile)/i.test(l));
  if (sumIdx !== -1) {
    const para = lines.slice(sumIdx + 1, sumIdx + 6).join(" ");
    if (para) result.professional_summary = para;
  }

  return result;
}

async function extractPdfText(arrayBuffer) {
  // Load PDF.js from CDN if not present
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
    // Try to set a worker; many CDNs co-host the worker at the same path
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

const ResumeImport = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const saveDraftToLocalStorage = (payload) => {
    const specificKey = `userDetailsDraft${user?.id ? `:${user.id}` : ""}`;
    const genericKey = "userDetailsDraft";
    try {
      const existingSpecific = JSON.parse(localStorage.getItem(specificKey) || "{}");
      const mergedSpecific = { ...existingSpecific, ...payload };
      localStorage.setItem(specificKey, JSON.stringify(mergedSpecific));
    } catch (_) {}
    try {
      // Also write generic draft as a fallback if user id wasn't available when the form loads
      const existingGeneric = JSON.parse(localStorage.getItem(genericKey) || "{}");
      const mergedGeneric = { ...existingGeneric, ...payload };
      localStorage.setItem(genericKey, JSON.stringify(mergedGeneric));
    } catch (_) {}
  };

  const handleParse = async () => {
    setError(null);
    setPreview(null);
    if (!url) {
      setError("Please paste a public Google Drive PDF link");
      return;
    }
    setLoading(true);
    try {
      const direct = toDirectGoogleUrl(url);
      let text = null;
      // Prefer CORS-free text proxy first (Drive can be public yet block CORS)
      try {
        const proxy = toReaderProxyUrl(direct);
        const res2 = await fetch(proxy);
        if (!res2.ok) throw new Error("proxy bad status");
        text = await res2.text();
      } catch (_) {
        // Fallback: try loading via PDF.js if proxy failed
        const res = await fetch(direct, { mode: "cors" });
        if (!res.ok) throw new Error("bad status");
        const buf = await res.arrayBuffer();
        text = await extractPdfText(buf);
      }
      // Guard: detect non-public Drive pages returning sign-in/placeholder content
      if (!text || /sign in|you need permission|access denied/i.test(text)) {
        throw new Error("The provided link isn't publicly accessible. In Google Drive, set sharing to 'Anyone with the link (Viewer)'.");
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
        setError("Couldn't extract data from this file. Ensure it's a resume PDF with visible text (not scanned images) and link sharing is public.");
        setPreview(null);
        return;
      }
      // Persist to both localStorage and sessionStorage for immediate handoff
      saveDraftToLocalStorage(fields);
      try { sessionStorage.setItem("resumeImportDraft", JSON.stringify(fields)); } catch (_) {}
      setPreview(fields);
      // Auto-open the user details form in edit mode and force a cache-busting param
      const nonce = Date.now();
      navigate(`/user-details?edit=1&from=resume&n=${nonce}`);
    } catch (e) {
      setError(e.message || "Could not process the PDF");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-extrabold text-4xl sm:text-6xl text-center pb-6 text-black dark:text-white">
        Import From Resume (Link)
      </h1>
      <div className="flex flex-col gap-3">
        <input
          type="url"
          placeholder="Paste public Google Drive PDF link"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="blue" onClick={handleParse} disabled={loading}>
            Parse & Fill
          </Button>
          <Button variant="outline" onClick={() => navigate("/user-details?edit=1")}>
            Open User Details
          </Button>
        </div>
        {loading && <BarLoader className="mt-2" width={"100%"} color="#36d7b7" />}
        {error && (
          <div className="text-red-500 text-sm border border-red-400 rounded-md p-3 bg-red-50 dark:bg-red-900/20">
            {error}
          </div>
        )}
        {preview && (
          <div className="mt-4 text-sm border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
            <div className="font-semibold mb-2">Extracted preview (saved to draft):</div>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(preview, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeImport;


