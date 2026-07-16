import Button from "../../components/ui/Button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          The page you’re looking for doesn’t exist. Use the navigation or go back home.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button as={Link} to="/" variant="primary">
            Go to Home
          </Button>
          <Button as={Link} to="/jobs" variant="outline">
            Browse Jobs
          </Button>
        </div>
      </section>
    </div>
  );
}

