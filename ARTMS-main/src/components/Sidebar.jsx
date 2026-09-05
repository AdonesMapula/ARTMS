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
  super_admin: "Super Admin",
  developer: "Developer",
  hr_admin: "Human Resources Admin",
  coo: "Chief Operating Officer",
  department_head: "Department Head",
  employee: "Employee",
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
        "flex items-center rounded-md font-semibold transition-all duration-150 focus:outline-none select-none",
        isCollapsed ? "justify-center w-9 h-9 mx-auto px-0" : "w-full px-2.5 py-2 gap-2 text-xs",
        anyChildActive
          ? "border-l-[3px] border-l-[#111A62] dark:border-l-[#F97316] bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white [&_.nav-icon]:text-[#111A62] dark:[&_.nav-icon]:text-[#F97316] font-bold"
          : "border-l-[3px] border-l-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white [&_.nav-icon]:text-slate-500 dark:[&_.nav-icon]:text-slate-400 hover:[&_.nav-icon]:text-slate-900 dark:hover:[&_.nav-icon]:text-white"
      )}
    >
      {it.icon && (
        <span className="nav-icon text-sm transition-colors shrink-0">{it.icon}</span>
      )}

      <div className={cn("flex items-center justify-between overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0 ml-0" : "flex-1 opacity-100 ml-2")}>
        <span className="truncate text-left">{it.label}</span>
        <div className="flex items-center shrink-0">
          {it.badge && (
            <span className="rounded-[3px] font-mono bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              {it.badge}
            </span>
          )}
          <span className="text-slate-400 transition-transform duration-200 ml-1.5">
            {open ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
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
            <TooltipContent side="right" sideOffset={12} className="bg-[#111A62] text-white font-semibold rounded-md text-xs">
              <div className="flex items-center">
                {it.label}
                {it.badge && (
                  <span className="ml-2 rounded-[3px] font-mono bg-amber-500 px-1.5 py-0.2 text-[9px] text-white font-bold">
                    {it.badge}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="right" sideOffset={12} className="w-56 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F163D] shadow-xl z-[200]">
            <div className="px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{it.label}</p>
            </div>
            <ul className="space-y-0.5">
              {it.children.map((child) => (
                <li key={child.to}>
                  <NavLink
                    to={child.to}
                    end={child.end}
                    onMouseEnter={() => preloadRoute(child.to)}
                    onFocus={() => preloadRoute(child.to)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-md px-2 py-1.5 gap-2 text-xs font-semibold transition-all duration-150 focus:outline-none group",
                        isActive
                          ? "bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      )
                    }
                  >
                    {child.icon && (
                      <span className="nav-icon text-xs transition-colors shrink-0 group-hover:text-[#111A62]">
                        {child.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{child.label}</span>
                    {child.badge && (
                      <span className="rounded-[3px] font-mono bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
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
          <ul className="mt-0.5 space-y-0.5 transition-all duration-300 pl-3">
            {it.children.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  end={child.end}
                  onMouseEnter={() => preloadRoute(child.to)}
                  onFocus={() => preloadRoute(child.to)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-md font-semibold transition-all duration-150 group focus:outline-none px-2.5 py-1.5 gap-2 text-xs",
                      isActive
                        ? "border-l-[3px] border-l-[#111A62] dark:border-l-[#F97316] bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white font-bold [&_.nav-icon]:text-[#111A62] dark:[&_.nav-icon]:text-[#F97316]"
                        : "border-l-[3px] border-l-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white [&_.nav-icon]:text-slate-500 dark:[&_.nav-icon]:text-slate-400 hover:[&_.nav-icon]:text-slate-900 dark:hover:[&_.nav-icon]:text-white"
                    )
                  }
                >
                  {child.icon && (
                    <span className="nav-icon text-xs transition-colors shrink-0">{child.icon}</span>
                  )}
                  <div className="flex flex-1 items-center justify-between overflow-hidden transition-all duration-300">
                    <span className="truncate">{child.label}</span>
                    {child.badge && (
                      <span className="rounded-[3px] font-mono bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 ml-2">
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
        <li className="pt-4 first:pt-1 flex justify-center">
          <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
        </li>
      );
    }
    return (
      <li className="pt-4 first:pt-1 overflow-hidden transition-all duration-300">
        <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap select-none">
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
          "flex items-center rounded-md font-semibold transition-all duration-150 focus:outline-none select-none",
          isCollapsed ? "justify-center w-9 h-9 mx-auto px-0" : "w-full px-2.5 py-2 gap-2 text-xs",
          isActive
            ? "border-l-[3px] border-l-[#111A62] dark:border-l-[#F97316] bg-[#111A62]/10 dark:bg-[#3B4BA0]/30 text-[#111A62] dark:text-white font-bold [&_.nav-icon]:text-[#111A62] dark:[&_.nav-icon]:text-[#F97316]"
            : "border-l-[3px] border-l-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white [&_.nav-icon]:text-slate-500 dark:[&_.nav-icon]:text-slate-400 hover:[&_.nav-icon]:text-slate-900 dark:hover:[&_.nav-icon]:text-white"
        )
      }
    >
      {it.icon && (
        <span className="nav-icon text-sm transition-colors shrink-0">{it.icon}</span>
      )}
      <div className={cn("flex items-center justify-between overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0 ml-0" : "flex-1 opacity-100 ml-2")}>
        <span className="truncate">{it.label}</span>
        {it.badge && (
          <span className="rounded-[3px] font-mono bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 ml-2">
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
          <TooltipContent side="right" sideOffset={12} className="bg-[#111A62] text-white font-semibold rounded-md text-xs">
            <div className="flex items-center">
              {it.label}
              {it.badge && (
                <span className="ml-2 rounded-[3px] font-mono bg-amber-500 px-1.5 py-0.2 text-[9px] text-white font-bold">
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
  const navigate = useNavigate();
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
    } catch (e) { }
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
        "hidden border-r border-slate-200/90 bg-slate-100/75 dark:bg-[#0B0F2E] dark:border-slate-800 lg:block transition-all duration-300 ease-in-out z-40 shrink-0",
        isCollapsed ? "w-[68px]" : "w-64"
      )}>
        <div className="sticky top-0 h-screen flex flex-col relative w-full overflow-hidden">
          {/* Architectural Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-2.5 top-6 flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F163D] text-slate-500 dark:text-slate-300 shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#111A62] dark:hover:text-white z-50 focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <FiChevronRight size={12} /> : <FiChevronLeft size={12} />}
          </button>

          {/* Brand */}
          <div className={cn(
            "border-b border-slate-200/90 dark:border-slate-800 py-4 flex items-center transition-all duration-300 bg-white/50 dark:bg-[#0F163D]/40",
            isCollapsed ? "px-0 justify-center h-[70px]" : "px-4 justify-start h-[70px]"
          )}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={artmsLogo}
                alt="ARTMS Logo"
                className={cn("shrink-0 rounded-md object-contain transition-all duration-300", isCollapsed ? "h-8 w-8" : "h-9 w-9")}
              />
              <div className={cn("flex flex-col leading-tight overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-[150px] opacity-100")}>
                <span className="font-logo text-lg font-bold tracking-tight text-[#111A62] dark:text-white whitespace-nowrap transition-colors">
                  {brand}
                </span>
                <span className="font-sans text-[10px] font-normal tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  AI Recruitment System
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3 overflow-x-hidden custom-scrollbar">
            <ul className="space-y-0.5">
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
          <div className="border-t border-slate-200/90 dark:border-slate-800 px-3 py-3 mt-auto bg-white/50 dark:bg-[#0F163D]/40">
            <div className={cn("flex items-center transition-all duration-300", isCollapsed ? "flex-col gap-2.5 justify-center" : "gap-2.5")}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-8 w-8 shrink-0 rounded-md object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#111A62] text-xs font-bold text-white shadow-2xs">
                  {initials}
                </span>
              )}
              <div className={cn("flex flex-col overflow-hidden transition-all duration-300", isCollapsed ? "w-0 h-0 opacity-0" : "flex-1 opacity-100")}>
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white transition-colors">{user?.name ?? "User"}</p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {getRoleLabel(user?.role)}
                </p>
              </div>

              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    {logoutButtonContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="bg-[#111A62] text-white font-semibold text-xs z-[200]">
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
