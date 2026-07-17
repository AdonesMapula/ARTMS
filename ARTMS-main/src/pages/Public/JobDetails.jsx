import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiBriefcase, FiCalendar, FiMapPin } from "react-icons/fi";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-4xl px-6 py-14 lg:px-10">
          <div className="flex h-64 items-center justify-center">
            <p className="text-slate-500">Loading job details...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-4xl px-6 py-14 lg:px-10">
          <EmptyState
            title="Job not found"
            description="The job posting you're looking for doesn't exist or has been closed."
            actionLabel="Back to jobs"
            onAction={() => (window.location.href = "/jobs")}
          />
        </section>
      </div>
    );
  }

  const jobLibrary = job.job_library || {};
  const department = job.department || {};

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to job listings
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {jobLibrary.job_title || "Untitled Position"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <FiBriefcase aria-hidden="true" />
                {department.name || "N/A"}
              </span>
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin aria-hidden="true" />
                  {job.location}
                </span>
              )}
              {job.posting_date && (
                <span className="inline-flex items-center gap-1">
                  <FiCalendar aria-hidden="true" />
                  Posted {new Date(job.posting_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{job.vacancies_count} {job.vacancies_count > 1 ? "openings" : "opening"}</Badge>
            {job.closing_date && (
              <Badge tone="info">
                Closes {new Date(job.closing_date).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {job.description || jobLibrary.job_description || "No description available."}
              </p>
            </CardContent>
          </Card>

          {(jobLibrary.responsibilities || jobLibrary.qualifications) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {jobLibrary.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                      {jobLibrary.responsibilities}
                    </p>
                  </CardContent>
                </Card>
              )}
              {jobLibrary.qualifications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                      {jobLibrary.qualifications}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card className="border-blue-100 bg-blue-50/40">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  Ready to apply?
                </p>
                <p className="text-sm text-slate-600">
                  Complete the application form and upload your resume—no account required.
                </p>
              </div>
              <Button as={Link} to={`/apply/${job.id}`} variant="accent">
                Apply now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
