import { useState, useEffect } from "react";
import { FileText, Building2, User, Calendar, Plus, Trash2, RefreshCw, XCircle, AlertTriangle, CheckCircle, FileCheck } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const URGENCY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/**
 * ManpowerEditModal - HR Edit & Resubmit Modal for PRFs marked for revision
 */
export default function ManpowerEditModal({ open, request, onClose, onSave, saving = false }) {
  const [form, setForm] = useState({
    position_needed: "",
    headcount: 1,
    urgency: "medium",
    needed_by: "",
    justification: "",
    qualifications: [],
    responsibilities: [],
  });

  useEffect(() => {
    if (request) {
      const normalizeBlocks = (blocks) => {
        if (!Array.isArray(blocks)) return [];
        return blocks.map((b, i) => ({
          id: b.id || Date.now() + i,
          title: typeof b === "string" ? b : (b.title || ""),
          details: Array.isArray(b.details)
            ? b.details.map((d, j) => ({
                id: typeof d === "object" && d !== null && d.id ? d.id : Date.now() + i * 100 + j,
                value: typeof d === "object" && d !== null ? (d.value ?? d.title ?? "") : String(d ?? ""),
              }))
            : typeof b.details === "string" && b.details
            ? [{ id: Date.now() + i * 100, value: b.details }]
            : [],
        }));
      };

      setForm({
        position_needed: request.position_needed ?? "",
        headcount: request.headcount ?? 1,
        urgency: request.urgency ?? "medium",
        needed_by: request.needed_by ? request.needed_by.substring(0, 10) : "",
        justification: request.justification ?? "",
        qualifications: normalizeBlocks(request.qualifications),
        responsibilities: normalizeBlocks(request.responsibilities),
      });
    }
  }, [request]);

  if (!open || !request) return null;

  const remarksText = request.approval_remarks || request.remarks;

  const addBlock = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], { id: Date.now(), title: "", details: [{ id: Date.now() + 1, value: "" }] }],
    }));
  };

  const removeBlock = (field, blockId) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((b) => b.id !== blockId),
    }));
  };

  const updateBlockTitle = (field, blockId, title) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b) => (b.id === blockId ? { ...b, title } : b)),
    }));
  };

  const addDetail = (field, blockId) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b) =>
        b.id === blockId
          ? { ...b, details: [...b.details, { id: Date.now() + Math.random(), value: "" }] }
          : b
      ),
    }));
  };

  const updateDetailValue = (field, blockId, detailId, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b) =>
        b.id === blockId
          ? {
              ...b,
              details: b.details.map((d) => (d.id === detailId ? { ...d, value } : d)),
            }
          : b
      ),
    }));
  };

  const removeDetail = (field, blockId, detailId) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((b) =>
        b.id === blockId
          ? { ...b, details: b.details.filter((d) => d.id !== detailId) }
          : b
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-4xl"
      title={`Revise PRF-${String(request.id).padStart(3, "0")}`}
      description="Edit personnel requisition form and resubmit to COO for approval"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 font-bold"
          >
            {saving ? "Resubmitting..." : "Resubmit PRF to COO"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* COO Feedback Banner */}
        {remarksText && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                <RefreshCw size={18} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  COO Revision Instructions & Remarks
                </h4>
                <p className="mt-1 text-sm font-medium text-amber-900 whitespace-pre-wrap leading-relaxed">
                  "{remarksText}"
                </p>
                <p className="mt-2 text-xs font-semibold text-amber-800">
                  💡 Make the requested adjustments below and click "Resubmit PRF to COO".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Position Needed <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.position_needed}
                onChange={(e) => setForm({ ...form, position_needed: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Headcount <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={form.headcount}
                onChange={(e) => setForm({ ...form, headcount: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Urgency</label>
              <Select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                options={URGENCY_OPTIONS}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date Needed By</label>
              <Input
                type="date"
                value={form.needed_by}
                onChange={(e) => setForm({ ...form, needed_by: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Justification & Details
            </label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              value={form.justification}
              onChange={(e) => setForm({ ...form, justification: e.target.value })}
              placeholder="Provide reason for this request..."
            />
          </div>
        </div>

        {/* Qualifications Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Qualifications & Requirements
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addBlock("qualifications")}
              className="gap-1 text-xs"
            >
              <Plus size={14} /> Add Category Block
            </Button>
          </div>

          {form.qualifications.map((block) => (
            <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Category title (e.g., Technical Skills)..."
                  value={block.title}
                  onChange={(e) => updateBlockTitle("qualifications", block.id, e.target.value)}
                  className="flex-1 font-bold text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBlock("qualifications", block.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="pl-4 space-y-2 border-l-2 border-slate-100">
                {block.details.map((detail) => (
                  <div key={detail.id} className="flex gap-2">
                    <Input
                      placeholder="Requirement detail..."
                      value={detail.value}
                      onChange={(e) => updateDetailValue("qualifications", block.id, detail.id, e.target.value)}
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDetail("qualifications", block.id, detail.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 p-1"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDetail("qualifications", block.id)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus size={12} /> Add Requirement Item
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Responsibilities Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Key Responsibilities
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addBlock("responsibilities")}
              className="gap-1 text-xs"
            >
              <Plus size={14} /> Add Category Block
            </Button>
          </div>

          {form.responsibilities.map((block) => (
            <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Category title (e.g., Daily Operations)..."
                  value={block.title}
                  onChange={(e) => updateBlockTitle("responsibilities", block.id, e.target.value)}
                  className="flex-1 font-bold text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBlock("responsibilities", block.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="pl-4 space-y-2 border-l-2 border-slate-100">
                {block.details.map((detail) => (
                  <div key={detail.id} className="flex gap-2">
                    <Input
                      placeholder="Responsibility detail..."
                      value={detail.value}
                      onChange={(e) => updateDetailValue("responsibilities", block.id, detail.id, e.target.value)}
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDetail("responsibilities", block.id, detail.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 p-1"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDetail("responsibilities", block.id)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus size={12} /> Add Responsibility Item
                </button>
              </div>
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}
