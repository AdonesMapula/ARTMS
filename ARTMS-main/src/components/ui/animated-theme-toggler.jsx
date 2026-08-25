import { useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";

function polygonCollapsed(point, vertexCount) {
  const pairs = Array.from({ length: vertexCount }, () => point).join(", ");
  return `polygon(${pairs})`;
}

function getThemeTransitionClipPaths(
  variant,
  cx,
  cy,
  maxRadius,
  viewportWidth,
  viewportHeight
) {
  const toX = (x) => `${(x / viewportWidth) * 100}%`;
  const toY = (y) => `${(y / viewportHeight) * 100}%`;
  const point = (x, y) => `${toX(x)} ${toY(y)}`;
  const toRadius = (r) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  switch (variant) {
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const halfSide = Math.max(halfW, halfH) * 1.05;
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "triangle": {
      const scale = maxRadius * 2.2;
      const dx = (Math.sqrt(3) / 2) * scale;
      const verts = [
        point(cx, cy - scale),
        point(cx + dx, cy + 0.5 * scale),
        point(cx - dx, cy + 0.5 * scale),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${verts})`];
    }
    case "diamond": {
      const R = maxRadius * Math.SQRT2;
      const end = [
        point(cx, cy - R),
        point(cx + R, cy),
        point(cx, cy + R),
        point(cx - R, cy),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "circle":
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
  }
}

export function AnimatedThemeToggler({
  duration = 450,
  variant = "circle",
  fromCenter = false,
  theme: controlledTheme,
  onThemeChange,
  className,
  ...props
}) {
  const context = useTheme();
  const theme = controlledTheme ?? context.theme;
  const isDark = theme === "dark";
  const buttonRef = useRef(null);

  const performToggle = useCallback(
    (nextTheme) => {
      if (onThemeChange) {
        onThemeChange(nextTheme);
      } else if (context.setTheme) {
        context.setTheme(nextTheme);
      }
    },
    [onThemeChange, context]
  );

  const handleToggle = useCallback(
    (event) => {
      const nextTheme = isDark ? "light" : "dark";

      // If browser doesn't support View Transitions API or prefers reduced motion
      const prefersReducedMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!document.startViewTransition || prefersReducedMotion) {
        performToggle(nextTheme);
        return;
      }

      const rect = buttonRef.current?.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const cx = fromCenter ? vw / 2 : rect ? rect.left + rect.width / 2 : vw / 2;
      const cy = fromCenter ? vh / 2 : rect ? rect.top + rect.height / 2 : vh / 2;

      const maxRadius = Math.hypot(
        Math.max(cx, vw - cx),
        Math.max(cy, vh - cy)
      );

      const [startClip, endClip] = getThemeTransitionClipPaths(
        variant,
        cx,
        cy,
        maxRadius,
        vw,
        vh
      );

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          performToggle(nextTheme);
        });
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [startClip, endClip],
          },
          {
            duration,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    },
    [isDark, performToggle, variant, duration, fromCenter]
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800",
        className
      )}
      {...props}
    >
      <Sun
        size={18}
        className={cn(
          "transition-all duration-300 transform",
          isDark
            ? "scale-0 rotate-90 opacity-0 absolute"
            : "scale-100 rotate-0 opacity-100 text-amber-500 group-hover:rotate-45"
        )}
      />
      <Moon
        size={18}
        className={cn(
          "transition-all duration-300 transform",
          isDark
            ? "scale-100 rotate-0 opacity-100 text-indigo-400 group-hover:-rotate-12"
            : "scale-0 -rotate-90 opacity-0 absolute"
        )}
      />
    </button>
  );
}

export default AnimatedThemeToggler;
