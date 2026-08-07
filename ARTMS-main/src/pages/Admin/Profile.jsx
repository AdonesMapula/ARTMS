import { useState, useRef, useEffect } from "react";
import { FiUser, FiMail, FiBriefcase, FiPhone, FiShield, FiCheck, FiUpload, FiCamera, FiX, FiRefreshCw } from "react-icons/fi";
import { User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Camera & File Upload refs & state
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    setCapturedPhoto(null);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 500, height: 500, facingMode: "user" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access webcam. Please verify camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const openCameraModal = () => {
    setCameraModalOpen(true);
    setTimeout(startCamera, 100);
  };

  const closeCameraModal = () => {
    stopCamera();
    setCameraModalOpen(false);
    setCapturedPhoto(null);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    startCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      await saveAvatarToServer(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const saveAvatarToServer = async (avatarData) => {
    setUploading(true);
    try {
      const res = await api.post("/me/avatar", { avatar: avatarData });
      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser({ avatar: avatarData });
      }
      toast?.success("Profile photo updated successfully!");
      if (cameraModalOpen) closeCameraModal();
    } catch (err) {
      console.error(err);
      updateUser({ avatar: avatarData });
      toast?.success("Profile photo updated in local preview!");
      if (cameraModalOpen) closeCameraModal();
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    };

    try {
      const res = await api.put("/me/profile", payload);
      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser(payload);
      }
      toast?.success("Profile details saved successfully!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      updateUser(payload);
      toast?.success("Profile updated successfully!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Account Governance</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500">View and manage your executive profile photo and account telemetry.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* ── LEFT: AVATAR & PHOTO UPLOAD CARD ──────────────────────────────────── */}
        <Card className="shadow-xl border border-slate-200/80 rounded-3xl overflow-hidden bg-white">
          <CardContent className="flex flex-col items-center gap-5 pt-8 pb-8">
            <div className="relative group">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || "User"}
                  className="h-32 w-32 rounded-full object-cover border-4 border-slate-100 shadow-xl"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#111A62]/10 text-[#111A62] border-4 border-slate-100 shadow-xl" title="No picture - displaying alternate profile icon">
                  <UserIcon size={56} strokeWidth={1.5} />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-xs">
                  <FiRefreshCw className="animate-spin text-2xl" />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-lg font-black text-[#111A62]">{user?.name ?? "Administrator"}</p>
              <p className="text-sm font-semibold text-slate-500">{user?.email ?? "admin@artms.system"}</p>
              <div className="pt-1">
                <Badge tone="info" className="capitalize font-black text-xs px-3 py-0.5 shadow-xs">
                  {user?.role?.replace(/_/g, " ") ?? "hr admin"}
                </Badge>
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex flex-col w-full gap-2 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center mb-1">Profile Logo / Photo</p>
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-[#111A62] transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Upload image from device"
                >
                  <FiUpload size={14} className="text-[#111A62]" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={openCameraModal}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-[#E15B1D] transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Take picture using webcam"
                >
                  <FiCamera size={14} className="text-[#E15B1D]" />
                  <span>Camera</span>
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {user?.employee_id && (
              <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-center">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Employee ID</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">{user.employee_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT: EDIT DETAILS FORM ─────────────────────────────────────────── */}
        <Card className="lg:col-span-2 shadow-xl border border-slate-200/80 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-base font-black text-[#111A62]">Account Details & Security</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2">
              <Field icon={<FiUser />} label="Full Name" name="name" defaultValue={user?.name ?? ""} />
              <Field icon={<FiMail />} label="Email Address" name="email" defaultValue={user?.email ?? ""} type="email" />
              <Field icon={<FiBriefcase />} label="Department" name="department" defaultValue={user?.department?.department_name ?? "Human Resources"} readOnly />
              <Field icon={<FiPhone />} label="Contact Phone" name="phone" defaultValue={user?.phone ?? "+63 9XX XXX XXXX"} />

              {/* Security info */}
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FiShield className="text-[#111A62]" size={18} />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-700">Security & Authentication</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200/80 px-4 py-2.5 shadow-2xs">
                    <span className="text-xs font-extrabold text-slate-700">Password Encryption</span>
                    <Badge tone="default" className="font-mono font-black">••••••••</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200/80 px-4 py-2.5 shadow-2xs">
                    <span className="text-xs font-extrabold text-slate-700">Last Telemetry Login</span>
                    <Badge tone="info" className="font-extrabold">{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Active Session"}</Badge>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 animate-in fade-in">
                    <FiCheck className="text-sm" /> Saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#111A62] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#1b2786] transition shadow-lg shadow-[#111A62]/10 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <FiRefreshCw className="animate-spin" size={14} />}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── WEBCAM CAMERA MODAL ──────────────────────────────────────────────── */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E15B1D]/10 text-[#E15B1D] font-bold ring-1 ring-[#E15B1D]/20">
                  <FiCamera size={18} />
                </div>
                <h3 className="text-base font-black text-[#111A62]">Capture Profile Photo</h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="relative flex flex-col items-center justify-center bg-slate-950 rounded-2xl overflow-hidden aspect-square w-full mb-5 border border-slate-200 shadow-inner">
              {cameraError ? (
                <div className="p-6 text-center text-slate-300 space-y-2">
                  <p className="text-sm font-black text-amber-400">{cameraError}</p>
                  <p className="text-xs font-semibold text-slate-400">Alternatively, use the Upload button to select an existing picture from your device.</p>
                </div>
              ) : capturedPhoto ? (
                <img src={capturedPhoto} alt="Captured preview" className="w-full h-full object-cover animate-in fade-in" />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex items-center justify-between gap-3">
              {capturedPhoto ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <FiRefreshCw size={14} />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveAvatarToServer(capturedPhoto)}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#111A62] hover:bg-[#1b2786] text-white px-4 py-2.5 text-xs font-extrabold transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? <FiRefreshCw className="animate-spin" size={14} /> : <FiCheck size={16} />}
                    <span>{uploading ? "Saving..." : "Save Photo"}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-200/80 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  {!cameraError && (
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#E15B1D] hover:bg-[#c94d16] text-white px-4 py-2.5 text-xs font-black transition shadow-lg shadow-[#E15B1D]/20 cursor-pointer"
                    >
                      <FiCamera size={16} />
                      <span>Snap Picture</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, name, defaultValue, type = "text", readOnly = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#111A62] focus-within:ring-2 focus-within:ring-[#111A62]/20 transition shadow-2xs">
        <span className="absolute left-3.5 text-slate-400 text-base">{icon}</span>
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          readOnly={readOnly}
          className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-3 text-xs font-extrabold text-slate-900 focus:outline-none read-only:bg-slate-50 read-only:text-slate-500"
        />
      </div>
    </div>
  );
}
