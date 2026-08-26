import { useEffect, useState, useMemo } from "react";
import { FiBookOpen, FiCheckCircle, FiXCircle, FiAlertTriangle, FiClock, FiActivity } from "react-icons/fi";
import { Card, CardContent } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/skeleton";
import notificationService from "../../services/notificationService";

export default function DepartmentHeadNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = () => {
    notificationService
      .getAll()
      .then(({ data }) => setNotifications(data.notifications || []))
      .catch((err) => console.warn("Failed to load notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute History Stats
  const stats = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    let revised = 0;

    notifications.forEach((n) => {
      const title = n.title?.toLowerCase() || "";
      if (title.includes("approve") || title.includes("success")) approved++;
      else if (title.includes("reject") || title.includes("decline")) rejected++;
      else if (title.includes("revis")) revised++;
    });

    return { approved, rejected, revised, total: notifications.length };
  }, [notifications]);

  const getIcon = (title) => {
    const t = title?.toLowerCase() || "";
    if (t.includes("approve") || t.includes("success")) return <FiCheckCircle className="text-emerald-500" size={20} />;
    if (t.includes("reject") || t.includes("decline")) return <FiXCircle className="text-red-500" size={20} />;
    if (t.includes("revis")) return <FiAlertTriangle className="text-amber-500" size={20} />;
    return <FiActivity className="text-[#111A62]" size={20} />;
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Department Updates
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Notifications & Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Alerts for PRF approvals, status updates, and hiring activities.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-slate-50/50 border-slate-200">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-slate-800">{stats.total}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Logs</span>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-emerald-600">{stats.approved}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mt-1">Approvals</span>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-amber-600">{stats.revised}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mt-1">Revisions</span>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-red-600">{stats.rejected}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-1">Rejected</span>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-slate-200 overflow-hidden rounded-3xl">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBookOpen className="text-[#111A62]" size={18} />
            <h3 className="text-sm font-extrabold text-[#111A62]">Activity Timeline</h3>
          </div>
          <Badge tone="info">{notifications.filter(n => !n.read).length} New</Badge>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                    <Skeleton className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] h-24 rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <div className="rounded-full bg-slate-100 p-4">
                <FiCheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">No history logs found.</p>
              <p className="text-xs text-slate-400">Your recent updates and notifications will appear here.</p>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="space-y-8">
                {notifications.map((n) => (
                  <div key={n.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon Marker */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {getIcon(n.title)}
                    </div>
                    {/* Card */}
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md ${n.read ? 'bg-white border-slate-200' : 'bg-[#111A62]/5 border-[#111A62]/20 ring-1 ring-[#111A62]/10'}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{n.title}</h4>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <FiClock size={10} />
                          {n.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
