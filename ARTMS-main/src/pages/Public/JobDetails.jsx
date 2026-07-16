import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiBriefcase, FiCalendar, FiMapPin } from "react-icons/fi";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { mockJobs } from "../../utils/mockData";

export default function JobDetails() {
  const { id } = useParams();
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-4xl px-6 py-14 lg:px-10">
          <EmptyState
            title="Job not found"
            description="The job posting you’re looking for doesn’t exist (placeholder data)."
            actionLabel="Back to jobs"
            onAction={() => (window.location.href = "/jobs")}
          />
        </section>
      </div>
    );
  }

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
              {job.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <FiBriefcase aria-hidden="true" />
                {job.department}
              </span>
              <span className="inline-flex items-center gap-1">
                <FiMapPin aria-hidden="true" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <FiCalendar aria-hidden="true" />
                Posted {job.postedAt}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{job.employmentType}</Badge>
            <Badge tone="info">{job.level}</Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600">
                {job.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.tags.map((t) => (
                  <Badge key={t} tone="default">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {job.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Qualifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {job.qualifications.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  Preferred skills
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.preferredSkills.map((s) => (
                    <Badge key={s} tone="info">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

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

