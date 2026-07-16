import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";

export default function Contact() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Contact
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Let’s talk about hiring
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          This is a frontend-only contact interface. Messages are not sent yet—ready for API integration.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" name="name" placeholder="Your name" />
                <Input label="Email" name="email" type="email" placeholder="you@email.com" />
                <Input label="Subject" name="subject" placeholder="How can we help?" className="sm:col-span-2" />
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    className="min-h-32 w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                    placeholder="Write your message…"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="accent" onClick={() => alert("Placeholder: message not sent (UI only).")}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Reach us</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <FiMapPin aria-hidden="true" />
                  <span>PH • Enterprise Hiring Operations</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiMail aria-hidden="true" />
                  <span>talent@artms.example</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiPhone aria-hidden="true" />
                  <span>+63 000 000 0000</span>
                </li>
              </ul>

              <div className="mt-6 rounded-2xl border border-[var(--artms-border)] bg-[var(--artms-soft)] p-4">
                <p className="text-sm font-extrabold text-slate-900">
                  HR Login
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Department Heads, HR Admins, and Super Admins only.
                </p>
                <div className="mt-3">
                  <Button as="a" href="/login" variant="primary" className="w-full">
                    Go to login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

