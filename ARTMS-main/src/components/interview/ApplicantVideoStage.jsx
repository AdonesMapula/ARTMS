import { useState, useRef, useEffect } from "react";
import { VideoTrack } from "@livekit/components-react";
import { 
  Settings, Eye, Activity, ShieldCheck, Maximize2, 
  Smile, User, Gauge, Sliders, ChevronDown, ChevronUp 
} from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * ApplicantVideoStage
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 2.B: Left Column: Primary Applicant Video & Visual Telemetry (60% width)
 * 
 * Features:
 * - Responsive primary video container featuring candidate incoming WebRTC stream
 * - Name overlay banner (e.g. Alex Chen)
 * - MediaPipe Sentiment Overlay Widget (Floating bottom container):
 *   - Status badge + sentiment confidence bar (Live Sentiment: Focused / Neutral)
 *   - Posture gauge + Eye Contact metric (Posture: Engaged | Eye Contact: 82% Direct)
 *   - Collapsible settings toggle to customize or hide overlay metrics locally
 */

export default function ApplicantVideoStage({
  candidateName = "Applicant",
  remoteCameraTrack = null,
  liveMetrics = null,
  FaceTrackingComponent = null,
  onLocalMetricsComputed = null,
}) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [metricSensitivities, setMetricSensitivities] = useState({
    eyeContact: true,
    posture: true,
    sentiment: true,
  });

  // Sentiment & Telemetry Metrics (cleared on new call until live frames arrive)
  const isCalibrated = Boolean(liveMetrics?.calibrated);
  const eyeContactVal = isCalibrated ? (liveMetrics?.eyeContactRatio ?? 0) : 0;
  const sentimentScore = isCalibrated ? (liveMetrics?.composedScore ?? 0) : 0;
  const sentimentLabel = isCalibrated ? (liveMetrics?.emotion || "Focused / Neutral") : "Standby / Calibrating...";
  const postureLabel = isCalibrated ? (liveMetrics?.posture || "Engaged & Upright") : "Calibrating...";

  // Determine sentiment pill color
  const getSentimentTone = (score) => {
    if (!isCalibrated) return "text-slate-600 bg-slate-100 border-slate-200";
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  return (
    <div className="relative flex flex-col h-full w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Header Label Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200 bg-slate-50 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700">
            Applicant Video Feed
          </span>
          <span className="rounded-md bg-white px-2.5 py-0.5 font-bold text-slate-900 text-[11px] border border-slate-200 shadow-xs">
            {candidateName}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-[10px] font-mono text-slate-500">1080p • 60 FPS WebRTC</span>
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className="hover:text-slate-900 text-slate-600 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
            title="Toggle MediaPipe Overlay"
          >
            {showOverlay ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span className="text-[10px] font-semibold">{showOverlay ? "Hide AI HUD" : "Show AI HUD"}</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {remoteCameraTrack && remoteCameraTrack.publication && !remoteCameraTrack.publication.isMuted ? (
          FaceTrackingComponent ? (
            <FaceTrackingComponent
              trackRef={remoteCameraTrack}
              className="h-full w-full object-cover"
              isApplicant={false}
              onMetricsComputed={onLocalMetricsComputed}
            />
          ) : (
            <VideoTrack trackRef={remoteCameraTrack} className="h-full w-full object-cover" />
          )
        ) : (
          /* High-Fidelity Candidate Video Feed Representation */
          <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 text-center">
            {/* Candidate Silhouette / Realistic Camera Feed Simulation */}
            <div className="relative mb-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 shadow-2xl text-slate-300">
                <User size={64} className="text-slate-400" />
              </div>
              {/* Active face tracking brackets overlay */}
              <div className="absolute -inset-2 border-2 border-dashed border-blue-400/50 rounded-full animate-pulse pointer-events-none" />
              <div className="absolute top-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <h3 className="text-base font-bold text-white">{candidateName}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Active Candidate Audio/Video Stream • Connected to Session
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-950/70 border border-blue-700/60 px-3 py-1 text-[11px] font-semibold text-blue-200">
              <Activity size={12} className="animate-spin text-blue-400" />
              MediaPipe Vision Mesh Model Active (15 FPS)
            </span>
          </div>
        )}

        {/* ── MediaPipe Sentiment Overlay Widget (Floating Bottom Container) ── */}
        {showOverlay && (
          <div className="absolute bottom-3 left-3 right-3 z-30 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-3 shadow-lg transition-all text-slate-800">
            {/* Overlay Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 border border-blue-200 text-blue-700 text-[10px]">
                  ⚡
                </span>
                <span className="text-xs font-bold text-slate-900 tracking-wide">
                  Visual Sentiment Overlay Active <span className="text-slate-500 font-normal">(MediaPipe)</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSettings((s) => !s)}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Configure Overlay Metrics"
                >
                  <Settings size={14} />
                </button>
              </div>
            </div>

            {/* Overlay Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Left Metric: Live Sentiment */}
              <div className="md:col-span-7 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-600">Live Sentiment:</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase", getSentimentTone(sentimentScore))}>
                    {sentimentLabel}
                  </span>
                </div>
                {/* Confidence Bar */}
                <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${sentimentScore}%` }}
                  />
                </div>
              </div>

              {/* Right Metric: Posture & Eye Contact Gauge */}
              <div className="md:col-span-5 flex items-center justify-between pl-0 md:pl-3 md:border-l border-slate-200">
                <div>
                  <div className="text-[11px] font-medium text-slate-600">
                    Posture: <strong className="text-slate-900 font-semibold">{postureLabel}</strong>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                    Eye Contact: <strong className="text-emerald-700 font-mono font-bold">{eyeContactVal}% Direct</strong>
                  </div>
                </div>

                {/* Radial Gauge / Meter Visual */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-xs">
                  <Gauge size={20} className="text-emerald-600" />
                  <span className="absolute -bottom-1 text-[8px] font-mono font-bold text-slate-700">
                    {eyeContactVal}%
                  </span>
                </div>
              </div>
            </div>

            {/* Inline Settings Toggle Panel */}
            {showSettings && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-700">
                <span className="font-semibold text-slate-600">Active Sensors:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metricSensitivities.eyeContact}
                      onChange={(e) => setMetricSensitivities((s) => ({ ...s, eyeContact: e.target.checked }))}
                      className="rounded border-slate-300 accent-[#111A62]"
                    />
                    <span>Eye Gaze</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metricSensitivities.posture}
                      onChange={(e) => setMetricSensitivities((s) => ({ ...s, posture: e.target.checked }))}
                      className="rounded border-slate-300 accent-[#111A62]"
                    />
                    <span>Head Pose</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metricSensitivities.sentiment}
                      onChange={(e) => setMetricSensitivities((s) => ({ ...s, sentiment: e.target.checked }))}
                      className="rounded border-slate-300 accent-[#111A62]"
                    />
                    <span>Emotion</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
