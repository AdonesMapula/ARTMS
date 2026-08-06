import { useState, useEffect } from "react";
import { Briefcase, Building2, Calendar, MapPin, DollarSign, FileText, CheckCircle, X, Save, Loader, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const STATUS_TONE = {
  published: "success",
  pending_approval: "warning",
  draft: "info",
  closed: "default",
  cancelled: "danger",
};

export default function JobPostingEditPanel({ postingId, initialPosting, onClose, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(!initialPosting);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(initialPosting || null);
  const [formData, setFormData] = useState({
    title: "",
    department_id: "",
    employment_type: "full_time",
    location: "",
    min_salary: "",
    max_salary: "",
    closing_date: "",
    status: "published",
    qualifications: "",
    responsibilities: "",
  });

  const populateForm = (data) => {
    if (!data) return;
    setPosting(data);

    const formatBlocks = (items) => {
      if (Array.isArray(items)) {
        return items.map(item => {
          if (typeof item === 'string') return item;
          const title = item.title || "";
          let detailsStr = "";
          if (Array.isArray(item.details)) {
            detailsStr = item.details.map(d => typeof d === 'object' && d !== null ? (d.value || d.title || "") : String(d)).join("\n");
          } else if (typeof item.details === 'string') {
            detailsStr = item.details;
          }
          return title ? `${title}:\n${detailsStr}` : detailsStr;
        }).filter(Boolean).join("\n\n");
      }
      return typeof items === "string" ? items : "";
    };

    const quals = formatBlocks(data.qualifications || data.job_library?.qualifications);
    const resps = formatBlocks(data.responsibilities || data.job_library?.responsibilities);

    setFormData({
      title: data.job_library?.job_title || data.title || "Job Specification",
      department_id: data.department_id || "",
      employment_type: data.job_library?.employment_type || data.employment_type || "full_time",
      location: data.location || "Cebu City, Philippines",
      min_salary: data.job_library?.salary_min ?? data.min_salary ?? "",
      max_salary: data.job_library?.salary_max ?? data.max_salary ?? "",
      closing_date: data.closing_date ? data.closing_date.slice(0, 10) : "",
      vacancies_count: data.vacancies_count ?? 1,
      status: data.status || "published",
      qualifications: quals,
      responsibilities: resps,
    });
  };

  useEffect(() => {
    if (initialPosting) {
      populateForm(initialPosting);
      setLoading(false);
    }
    if (postingId) {
      loadPosting();
    }
  }, [postingId, initialPosting]);

  const loadPosting = async () => {
    try {
      const res = await api.get(`/job-postings/${postingId}`);
      const data = res.data?.posting || res.data?.data || res.data;
      if (data && typeof data === 'object') {
        populateForm(data);
      }
    } catch (err) {
      console.error("Failed to load job posting details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/job-postings/${postingId}`, formData);
      toast.success("Job Posting Updated", "Changes to job requirements and specification saved.");
      await loadPosting();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update job posting.");
    } finally {
      setSaving(false);
    }
  };

  if (!posting && !loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Job Posting not found.
      </div>
    );
  }

  const jobTitle = posting?.job_library?.job_title || posting?.title || formData.title || "Job Specification";
  const deptName = posting?.department?.department_name || posting?.department?.name || "General";
  const postingIdStr = posting?.id ? `JP-${String(posting.id).padStart(3, "0")}` : `JOB #${postingId || ""}`;
  const vacanciesCount = posting?.vacancies_count ?? formData.vacancies_count ?? 1;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="shrink-0 bg-gradient-to-r from-[#111A62] via-[#1a257c] to-[#0d1550] px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wide text-white">
                {postingIdStr}
              </span>
              <Badge tone={STATUS_TONE[posting?.status] || "default"} className="capitalize">
                {posting?.status || "Published"}
              </Badge>
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-300/30">
                {vacanciesCount} {vacanciesCount === 1 ? "position needed" : "positions needed"}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white truncate">{jobTitle}</h2>
            <p className="text-xs text-slate-300">
              Department: <strong className="text-white">{deptName}</strong> • Applicants: <strong className="text-emerald-300">{posting?.applicants_count || 0} candidate(s)</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                title="Close Job Panel"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Panel Body Form ──────────────────────────────────────────── */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto bg-slate-50/50 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader size={32} className="animate-spin text-[#111A62]" />
            <p className="text-xs font-semibold">Loading Job Specification & Form...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Quick Controls Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="published">Published / Active</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="revised">Needs Revision</option>
                  <option value="closed">Closed / Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Location / Setup</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Cebu City, Philippines"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Salary (₱)</label>
                <input
                  type="number"
                  value={formData.min_salary}
                  onChange={e => setFormData({ ...formData, min_salary: e.target.value })}
                  placeholder="30000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Salary (₱)</label>
                <input
                  type="number"
                  value={formData.max_salary}
                  onChange={e => setFormData({ ...formData, max_salary: e.target.value })}
                  placeholder="50000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Application Closing Date</label>
                <input
                  type="date"
                  value={formData.closing_date}
                  onChange={e => setFormData({ ...formData, closing_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Positions Needed (Vacancies)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.vacancies_count}
                  onChange={e => setFormData({ ...formData, vacancies_count: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-bold text-blue-900"
                />
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications & Requirements</label>
              <textarea
                rows={5}
                value={formData.qualifications}
                onChange={e => setFormData({ ...formData, qualifications: e.target.value })}
                placeholder="Enter qualifications & requirements..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 font-medium leading-relaxed"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Core Key Responsibilities</label>
              <textarea
                rows={5}
                value={formData.responsibilities}
                onChange={e => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="Enter key responsibilities..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 font-medium leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving} className="bg-[#111A62] text-white gap-1 cursor-pointer">
                {saving ? "Saving Changes..." : <><Save size={14} /> Save Job Specifications</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
