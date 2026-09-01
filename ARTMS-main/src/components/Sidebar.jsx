import { useState, useEffect, useCallback, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronDown, FiChevronRight, FiChevronLeft, FiMenu } from "react-icons/fi";
import ConfirmDialog from "./ui/ConfirmDialog";
import { cn } from "../utils/cn";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import artmsLogo from "../assets/Logo/LOGO_ARTMS_BLUE.png";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { preloadRoute } from "../utils/preloadRoute";

const ROLE_LABELS = {
  super_admin:     "Super Admin",
  developer:       "Developer",
  hr_admin:        "Human Resources Admin",
  coo:             "Chief Operating Officer",
  department_head: "Department Head",
  employee:        "Employee",
};

const getRoleLabel = (role) =>
  ROLE_LABELS[role] ?? (role ? role.replace(/_/g, " ") : "");

/**
 * NavItem renders either:
 *   - a plain NavLink  (no `children` array)
 *   - a collapsible group with child NavLinks  (has `children` array)
 *   - a section label (type: "label")
 */
function NavGroupItem({ it, isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  // Auto-expand when any child is active
  const anyChildActive = it.children.some((c) =>
    location.pathname.startsWith(c.to)
  );
  const [open, setOpen] = useState(anyChildActive);

  const handleOpenChange = (val) => {
    setOpen(val);
    if (val && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const triggerContent = (
    <button
      type="button"
      className={cn(
        "flex items-center rounded-xl font-semibold transition-all duration-200 focus:outline-none",
        isCollapsed ? "justify-center w-10 h-10 mx-auto px-0" : "w-full px-3 py-2.5 gap-2 text-sm",
        anyChildActive
          ? "border-l-[3px] border-l-[#111A62] dark:border-l-[#F97316] bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white [&_.nav-icon]:text-[#111A62] dark:[&_.nav-icon]:text-[#F97316]"
          : "border-l-[3px] border-l-transparent text-slate-700 dark:text-slate-300 hover:bg-[#111A62]/5 dark:hover:bg-white/5 hover:text-[#111A62] dark:hover:text-white [&_.nav-icon]:text-[#4D569E] dark:[&_.nav-icon]:text-slate-400 hover:[&_.nav-icon]:text-[#111A62] dark:hover:[&_.nav-icon]:text-white"
      )}
    >
      {it.icon && (
        <span className="nav-icon text-base transition-colors shrink-0">{it.icon}</span>
      )}
      
      <div className={cn("flex items-center justify-between overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0 ml-0" : "flex-1 opacity-100 ml-2")}>
        <span className="truncate text-left">{it.label}</span>
        <div className="flex items-center shrink-0">
          {it.badge && (
            <span className="rounded-full bg-[#FD761A]/15 px-2 py-0.5 text-[11px] font-bold text-[#FD761A]">
              {it.badge}
            </span>
          )}
          <span className="text-slate-400 transition-transform duration-200 ml-2">
            {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </span>
        </div>
      </div>
    </button>
  );

  if (isCollapsed) {
    // In collapsed mode, render a Popover flyout instead of expanding the sidebar inline
    return (
      <li className="flex justify-center">
        <Popover>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                {triggerContent}
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="bg-[#111A62] text-white font-semibold">
              <div className="flex items-center">
                {it.label}
                {it.badge && (
                  <span className="ml-2 rounded-full bg-[#FD761A] px-1.5 py-0.5 text-[9px] text-white">
                    {it.badge}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="right" sideOffset={12} className="w-56 p-2 rounded-xl border border-[var(--artms-border)] shadow-xl z-[200]">
            <div className="px-2 py-1.5 mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{it.label}</p>
            </div>
            <ul className="space-y-1">
              {it.children.map((child) => (
                <li key={child.to}>
                  <NavLink
                    to={child.to}
                    end={child.end}
                    onMouseEnter={() => preloadRoute(child.to)}
                    onFocus={() => preloadRoute(child.to)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg px-2 py-2 gap-2 text-sm font-semibold transition-all duration-200 focus:outline-none group",
                        isActive
                          ? "bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#111A62] dark:hover:text-white"
                      )
                    }
                  >
                    {child.icon && (
                      <span className="nav-icon text-sm transition-colors shrink-0 group-hover:text-[#111A62]">
                        {child.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{child.label}</span>
                    {child.badge && (
                      <span className="rounded-full bg-[#FD761A]/15 px-2 py-0.5 text-[10px] font-bold text-[#FD761A]">
                        {child.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </li>
    );
  }

  // In expanded mode, render the normal inline Collapsible
  return (
    <li>
      <Collapsible open={open} onOpenChange={handleOpenChange} className="w-full">
        <CollapsibleTrigger asChild>
          {triggerContent}
        </CollapsibleTrigger>

        {/* Children — indented */}
        <CollapsibleContent className="sidebar-collapsible-content overflow-hidden">
          <ul className="mt-0.5 space-y-0.5 transition-all duration-300 pl-4">
          {it.children.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end={child.end}
                onMouseEnter={() => preloadRoute(child.to)}
                onFocus={() => preloadRoute(child.to)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-xl font-semibold transition-all duration-200 group focus:outline-none px-3 py-2 gap-2 text-sm",
                    isActive
                      ? "border-l-[3px] border-l-[#111A62] dark:border-l-[#F97316] bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white [&_.nav-icon]:text-[#111A62] dark:[&_.nav-icon]:text-[#F97316]"
                      : "border-l-[3px] border-l-transparent text-slate-600 dark:text-slate-400 hover:bg-[#111A62]/5 dark:hover:bg-white/5 hover:text-[#111A62] dark:hover:text-white [&_.nav-icon]:text-[#4D569E] dark:[&_.nav-icon]:text-slate-400 hover:[&_.nav-icon]:text-[#111A62] dark:hover:[&_.nav-icon]:text-white"
                  )
                }
              >
                {child.icon && (
                  <span className="nav-icon text-sm transition-colors shrink-0">{child.icon}</span>
                )}
                <div className="flex flex-1 items-center justify-between overflow-hidden transition-all duration-300">
                  <span className="truncate">{child.label}</span>
                  {child.badge && (
                    <span className="rounded-full bg-[#FD761A]/15 px-2 py-0.5 text-[11px] font-bold text-[#FD761A] ml-2">
                      {child.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            </li>
          ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function NavItem({ it, isCollapsed, setIsCollapsed }) {
  // Section label
  if (it.type === "label") {
    if (isCollapsed) {
      return (
        <li className="pt-6 first:pt-2 flex justify-center">
          <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
        </li>
      );
    }
    return (
      <li className="pt-6 first:pt-2 overflow-hidden transition-all duration-300">
        <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {it.label}
        </p>
      </li>
    );
  }

  // A group item has children but no `to`
  if (it.children?.length) {
    return (
      <NavGroupItem
        it={it}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
    );
  }

  // Plain link item
  const linkContent = (
    <NavLink
      to={it.to}
      end={it.end}
      onMouseEnter={() => preloadRoute(it.to)}
      onFocus={() => preloadRoute(it.to)}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-xl font-semibold transition-all duration-200 focus:outline-none",
          isCollapsed ? "justify-center w-10 h-10 mx-auto px-0" : "w-full px-3 py-2.5 gap-2 text-sm",
          isActive
            ? "border-l-[3px] border-l-[#111A62] dark:border-l-[#F97316] bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white [&_.nav-icon]:text-[#111A62] dark:[&_.nav-icon]:text-[#F97316]"
            : "border-l-[3px] border-l-transparent text-slate-700 dark:text-slate-300 hover:bg-[#111A62]/5 dark:hover:bg-white/5 hover:text-[#111A62] dark:hover:text-white [&_.nav-icon]:text-[#4D569E] dark:[&_.nav-icon]:text-slate-400 hover:[&_.nav-icon]:text-[#111A62] dark:hover:[&_.nav-icon]:text-white"
        )
      }
    >
      {it.icon && (
        <span className="nav-icon text-base transition-colors shrink-0">{it.icon}</span>
      )}
      <div className={cn("flex items-center justify-between overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0 ml-0" : "flex-1 opacity-100 ml-2")}>
        <span className="truncate">{it.label}</span>
        {it.badge && (
          <span className="rounded-full bg-[#FD761A]/15 px-2 py-0.5 text-[11px] font-bold text-[#FD761A] ml-2">
            {it.badge}
          </span>
        )}
      </div>
    </NavLink>
  );

  return (
    <li className={isCollapsed ? "flex justify-center" : ""}>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="bg-[#111A62] text-white font-semibold">
            <div className="flex items-center">
              {it.label}
              {it.badge && (
                <span className="ml-2 rounded-full bg-[#FD761A] px-1.5 py-0.5 text-[9px] text-white">
                  {it.badge}
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        linkContent
      )}
    </li>
  );
}

export default function Sidebar({ brand = "ARTMS", items = [] }) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [counts, setCounts] = useState({
    manpower_requests: null,
    job_requests: null,
    job_postings: null,
    job_library: null,
    applicants: null,
    notifications: null,
    interviews: null,
  });

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/sidebar-counts");
      if (data) setCounts(data);
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    const handleRefresh = () => fetchCounts();

    window.addEventListener("artms-refresh-sidebar", handleRefresh);
    window.addEventListener("artms-refresh-notifications", handleRefresh);

    const handleCountUpdate = (e) => {
      if (e.detail) {
        setCounts(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("artms-sidebar-count-update", handleCountUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("artms-refresh-sidebar", handleRefresh);
      window.removeEventListener("artms-refresh-notifications", handleRefresh);
      window.removeEventListener("artms-sidebar-count-update", handleCountUpdate);
    };
  }, [fetchCounts]);

  const formattedItems = useMemo(() => {
    const processItem = (it) => {
      if (it.type === "label") return it;

      let dynamicBadge = it.badge;
      const lowerTo = (it.to || "").toLowerCase();
      const lowerLabel = (it.label || "").toLowerCase();
      let badgeNum = 0;

      if (lowerTo.includes("manpower") || lowerLabel.includes("manpower") || lowerLabel.includes("prf")) {
        if (counts.manpower_requests !== null) badgeNum += counts.manpower_requests;
      } else if (lowerTo.includes("job-library") || lowerLabel.includes("job library")) {
        if (counts.job_library !== null && counts.job_library !== undefined) badgeNum += counts.job_library;
      } else if (lowerTo.includes("job-request") || lowerLabel.includes("job request")) {
        if (counts.job_requests !== null && counts.job_requests !== undefined) badgeNum += counts.job_requests;
      } else if (lowerTo.includes("job-posting") || lowerLabel.includes("job posting")) {
        if (counts.job_postings !== null && counts.job_postings !== undefined) badgeNum += counts.job_postings;
      } else if (lowerTo.includes("applicant") || lowerLabel.includes("applicant")) {
        if (counts.applicants !== null) badgeNum += counts.applicants;
      } else if (lowerTo.includes("notification") || lowerLabel.includes("notification")) {
        if (counts.notifications !== null) badgeNum += counts.notifications;
      } else if (lowerTo.includes("interview") || lowerLabel.includes("interview")) {
        if (counts.interviews !== null) badgeNum += counts.interviews;
      }

      let processedChildren = undefined;
      if (it.children) {
        processedChildren = it.children.map(processItem);
        // Sum up children's badge numbers to show on the parent group
        const childrenBadgeSum = processedChildren.reduce((sum, child) => sum + (parseInt(child.badge) || 0), 0);
        badgeNum += childrenBadgeSum;
      }

      dynamicBadge = badgeNum > 0 ? String(badgeNum) : null;

      return { ...it, badge: dynamicBadge, children: processedChildren };
    };

    return items.map(processItem);
  }, [items, counts]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const logoutButtonContent = (
    <button
      onClick={() => setShowLogoutConfirm(true)}
      className={cn(
        "group relative flex shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none",
        isCollapsed ? "h-10 w-10 bg-slate-200/50" : "h-8 w-8"
      )}
      aria-label="Sign out"
    >
      <FiLogOut size={isCollapsed ? 18 : 16} />
    </button>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "hidden border-r border-[var(--artms-border)] bg-[#F3F0F1] dark:bg-[#0B0F2E] lg:block transition-all duration-300 ease-in-out z-40 shrink-0",
        isCollapsed ? "w-[72px]" : "w-72"
      )}>
        <div className="sticky top-0 h-screen flex flex-col relative w-full overflow-hidden">
          {/* Shadcn-style Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--artms-border)] bg-white dark:bg-[#0F163D] text-slate-500 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#111A62] dark:hover:text-white z-50 focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
          </button>

          {/* Brand */}
          <div className={cn(
            "border-b border-[var(--artms-border)] py-5 flex items-center transition-all duration-300",
            isCollapsed ? "px-0 justify-center h-[81px]" : "px-5 justify-start h-[81px]"
          )}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={artmsLogo}
                alt="ARTMS Logo"
                className={cn("shrink-0 rounded-lg object-contain transition-all duration-300", isCollapsed ? "h-8 w-8" : "h-10 w-10")}
              />
              <div className={cn("flex flex-col leading-tight overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-[160px] opacity-100")}>
                <span className="font-logo text-[1.35rem] font-extrabold tracking-[-0.03em] leading-none text-[#111A62] dark:text-white whitespace-nowrap transition-colors">
                  {brand}
                </span>
                <span className="font-sans text-[10px] font-normal tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  AI Recruitment System
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 overflow-x-hidden custom-scrollbar">
            <ul className="space-y-1">
              {formattedItems.map((it, idx) => (
                <NavItem 
                  key={it.to ?? (it.type === "label" ? `label-${idx}` : `group-${idx}`)} 
                  it={it} 
                  isCollapsed={isCollapsed} 
                  setIsCollapsed={setIsCollapsed} 
                />
              ))}
            </ul>
          </nav>

          {/* User info + logout */}
          <div className="border-t border-[var(--artms-border)] px-4 py-4 mt-auto">
            <div className={cn("flex items-center transition-all duration-300", isCollapsed ? "flex-col gap-3 justify-center" : "gap-3")}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--artms-primary)] text-sm font-bold text-white">
                  {initials}
                </span>
              )}
              <div className={cn("flex flex-col overflow-hidden transition-all duration-300", isCollapsed ? "w-0 h-0 opacity-0" : "flex-1 opacity-100")}>
                <p className="truncate text-sm font-extrabold text-[#111A62] dark:text-white transition-colors">{user?.name ?? "User"}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {getRoleLabel(user?.role)}
                </p>
              </div>
              
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    {logoutButtonContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="bg-[#111A62] text-white font-semibold z-[200]">
                    Sign out
                  </TooltipContent>
                </Tooltip>
              ) : (
                logoutButtonContent
              )}
            </div>
          </div>

          <ConfirmDialog
            open={showLogoutConfirm}
            title="Confirm Logout"
            description="Are you sure you want to log out of your account?"
            confirmLabel="Yes, Log out"
            cancelLabel="No, Cancel"
            tone="danger"
            onConfirm={handleConfirmLogout}
            onClose={() => setShowLogoutConfirm(false)}
          />
        </div>
      </aside>
    </TooltipProvider>
  );
}
