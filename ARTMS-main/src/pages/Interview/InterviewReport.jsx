/**
 * InterviewReport.jsx
 * ────────────────────
 * Route wrapper component for /admin/interviews/:id/report and /superadmin/interviews/:id/report.
 * Renders the InterviewReportModal overlay on top of the Interviews page.
 */
import { useParams, useNavigate } from "react-router-dom";
import InterviewReportModal from "../../modals/InterviewReportModal";
import Interviews from "../Admin/Interviews";

export default function InterviewReport() {
  const { id }   = useParams();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <Interviews />
      <InterviewReportModal
        isOpen={true}
        onClose={() => navigate("/admin/interviews")}
        interviewId={id}
      />
    </div>
  );
}
