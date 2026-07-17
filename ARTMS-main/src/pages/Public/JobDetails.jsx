import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiBriefcase, FiCalendar, FiMapPin, FiCheckCircle, FiAlertCircle, FiClock, FiDollarSign, FiUsers } from "react-icons/fi";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AlertModal from "../../components/ui/AlertModal";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, variant: "info", title: "", message: "" });

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/public/job-postings/${id}`);
      setJob(response.data.posting || response.data);
    } catch (error) {
      console.error("Error fetching job:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Failed to Load Job",
        message: "Unable to fetch job details. Please try again later.",
      });
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmApply = () => {
    navigate(`/apply/${job.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <section className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#111A62]"></div>
            <p className="text-sm font-medium text-slate-600">Loading job details...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <section className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
          <EmptyState
            title="Job Not Found"
            description="The job posting you're looking for doesn't exist or has been closed."
            actionLabel="Back to Jobs"
            onAction={() => navigate("/jobs")}
          />
        </section>
      </div>
    );
  }

  const jobLibrary = job.job_library || {};
  const department = job.department || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header Section */}
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          <Link
            to="/jobs"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#111A62]"
          >
            <FiArrowLeft className="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            Back to Job Listings
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#111A62]/5 px-4 py-1.5">
                <FiBriefcase className="text-[#111A62]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#111A62]">
                  {department.name || "N/A"}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#111A62] sm:text-4xl lg:text-5xl">
                {jobLibrary.job_title || "Untitled Position"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                {job.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiMapPin className="text-[#F97316]" aria-hidden="true" />
                    <span className="font-medium">{job.location}</span>
                  </span>
                )}
                {job.posting_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar className="text-slate-400" aria-hidden="true" />
                    <span>Posted {new Date(job.posting_date).toLocaleDateString()}</span>
                  </span>
                )}
                {job.closing_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiClock className="text-slate-400" aria-hidden="true" />
                    <span>Closes {new Date(job.closing_date).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 lg:items-end">
              <Badge 
                tone="accent" 
                className="bg-[#F97316] text-white ring-1 ring-[#F97316]/20"
              >
                <FiUsers className="mr-1" />
                {job.vacancies_count} {job.vacancies_count > 1 ? "Openings" : "Opening"}
              </Badge>
              <Button 
                onClick={handleApplyClick}
                variant="primary"
                className="bg-[#F97316] px-8 py-3 text-base font-bold hover:bg-[#ea6a0a]"
              >
                Apply for This Position
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#111A62]">
                  <FiBriefcase className="text-[#F97316]" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none pt-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {job.description || jobLibrary.job_description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Responsibilities & Qualifications */}
            {(jobLibrary.responsibilities || jobLibrary.qualifications) && (
              <div className="grid gap-6">
                {jobLibrary.responsibilities && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#111A62]">
                        <FiCheckCircle className="text-[#F97316]" />
                        Key Responsibilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none pt-6">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {jobLibrary.responsibilities}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {jobLibrary.qualifications && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#111A62]">
                        <FiAlertCircle className="text-[#F97316]" />
                        Required Qualifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none pt-6">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {jobLibrary.qualifications}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <Card className="sticky top-6 border-[#111A62]/20 bg-gradient-to-br from-[#111A62] to-[#1a2575] text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Position Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <FiBriefcase className="text-[#F97316]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70">Department</p>
                    <p className="text-sm font-bold">{department.name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <FiMapPin className="text-[#F97316]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70">Location</p>
                    <p className="text-sm font-bold">{job.location || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <FiUsers className="text-[#F97316]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70">Openings</p>
                    <p className="text-sm font-bold">{job.vacancies_count} Position{job.vacancies_count > 1 ? "s" : ""}</p>
                  </div>
                </div>
                {job.closing_date && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/10 p-2">
                      <FiClock className="text-[#F97316]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">Application Deadline</p>
                      <p className="text-sm font-bold">{new Date(job.closing_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call to Action Card */}
            <Card className="border-[#F97316]/20 bg-gradient-to-br from-orange-50 to-white shadow-sm">
              <CardContent className="space-y-4 py-6">
                <div className="text-center">
                  <h3 className="text-lg font-extrabold text-[#111A62]">Ready to Join Us?</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Take the next step in your career. Apply now and our team will review your application.
                  </p>
                </div>
                <Button 
                  onClick={handleApplyClick}
                  variant="primary"
                  className="w-full bg-[#F97316] py-3 font-bold hover:bg-[#ea6a0a]"
                >
                  Start Application
                </Button>
                <p className="text-center text-xs text-slate-500">
                  No account required • Takes ~5 minutes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Ready to Apply?"
        description={`You're about to start the application process for ${jobLibrary.job_title || "this position"}. Make sure you have your resume and relevant documents ready.`}
        confirmLabel="Continue to Application"
        cancelLabel="Not Yet"
        tone="primary"
        onConfirm={handleConfirmApply}
        onClose={() => setShowConfirm(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
      />
    </div>
  );
}
