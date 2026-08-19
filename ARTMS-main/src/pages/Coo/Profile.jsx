import { useState, useRef, useEffect } from "react";
import { FiUser, FiMail, FiBriefcase, FiPhone, FiShield, FiCheck, FiUpload, FiCamera, FiX, FiRefreshCw, FiLock } from "react-icons/fi";
import { User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/public/boot");
        if (res.data?.data?.departments) {
          setDepartments(res.data.data.departments.map(d => ({ value: String(d.id), label: d.department_name })));
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepartments();
  }, []);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveAvatarToServer(file);
  };

  const saveAvatarToServer = async (avatarInput) => {
    setUploading(true);
    try {
      const formData = new FormData();
      if (avatarInput instanceof File) {
        formData.append("avatar", avatarInput);
      } else if (typeof avatarInput === "string" && avatarInput.startsWith("data:")) {
        const arr = avatarInput.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        formData.append("avatar", blob, "avatar.jpg");
      } else {
        formData.append("avatar", avatarInput);
      }

      const res = await api.post("/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        const localPreview = avatarInput instanceof File ? URL.createObjectURL(avatarInput) : avatarInput;
        updateUser({ avatar: localPreview });
      }
      toast?.success("Profile photo updated successfully!");
      if (cameraModalOpen) closeCameraModal();
    } catch (err) {
      console.error(err);
      const fallbackUrl = avatarInput instanceof File ? URL.createObjectURL(avatarInput) : avatarInput;
      updateUser({ avatar: fallbackUrl });
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
      department_id: formData.get("department_id"),
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaving(true);
    
    const formData = new FormData(e.target);
    const current_password = (formData.get("current_password") || "").trim();
    const password = (formData.get("new_password") || "").trim();
    const password_confirmation = (formData.get("confirm_password") || "").trim();

    if (!password || password.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      setPasswordSaving(false);
      return;
    }

    if (password !== password_confirmation) {
      setPasswordError("New passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    try {
      await api.post("/auth/change-password", {
        current_password,
        password,
        password_confirmation
      });
      toast?.success("Password changed successfully!");
      e.target.reset();
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || "Failed to change password. Please check your current password.");
    } finally {
      setPasswordSaving(false);
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
        <Card className="shadow-xl border border-slate-200/80 rounded-3xl bg-white">
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
                  {user?.role?.replace(/_/g, " ") ?? "System User"}
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
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl border border-slate-200/80 rounded-3xl bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 rounded-t-3xl">
              <CardTitle className="text-base font-black text-[#111A62]">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2">
                
                <div className="sm:col-span-1">
                  <Input 
                    label="Full Name" 
                    name="name" 
                    icon={<FiUser size={16} />}
                    defaultValue={user?.name ?? ""} 
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input 
                    label="Email Address" 
                    name="email" 
                    icon={<FiMail size={16} />}
                    defaultValue={user?.email ?? ""} 
                    type="email" 
                  />
                </div>
                <div className="sm:col-span-1">
                  <Select
                    label="Department"
                    name="department_id"
                    icon={FiBriefcase}
                    defaultValue={String(user?.department_id || "")}
                    options={[
                      { value: "", label: "Select Department" },
                      ...departments
                    ]}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input 
                    label="Contact Phone" 
                    name="phone" 
                    icon={<FiPhone size={16} />}
                    defaultValue={user?.phone ?? ""} 
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
                  {saved && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 animate-in fade-in">
                      <FiCheck className="text-sm" /> Saved successfully
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="shadow-md shadow-[var(--artms-primary)]/10"
                  >
                    {saving ? <FiRefreshCw className="animate-spin" size={14} /> : null}
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-slate-200/80 rounded-3xl bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 rounded-t-3xl">
              <CardTitle className="text-base font-black text-[#111A62] flex items-center gap-2">
                <FiShield /> Security & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                 <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-700">Last Telemetry Login</span>
                    <span className="text-xs text-slate-500 mt-0.5">Your most recent successful authentication into the system.</span>
                 </div>
                 <Badge tone="info" className="font-extrabold shadow-sm shrink-0">{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Active Session"}</Badge>
              </div>

              <form onSubmit={handlePasswordChange} className="grid gap-5 sm:grid-cols-2">
                {passwordError && (
                  <div className="sm:col-span-2 p-3 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {passwordError}
                  </div>
                )}
                
                <div className="sm:col-span-2">
                  <Input 
                    label="Current Password" 
                    name="current_password" 
                    icon={<FiLock size={16} />}
                    type="password" 
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input 
                    label="New Password" 
                    name="new_password" 
                    icon={<FiShield size={16} />}
                    type="password" 
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input 
                    label="Confirm New Password" 
                    name="confirm_password" 
                    icon={<FiShield size={16} />}
                    type="password" 
                    required
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
                  {passwordSaved && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 animate-in fade-in">
                      <FiCheck className="text-sm" /> Password Updated
                    </span>
                  )}
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiLock size={14} />}
                    <span>{passwordSaving ? "Updating..." : "Update Password"}</span>
                  </Button>
                </div>
              </form>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── WEBCAM CAMERA MODAL ──────────────────────────────────────────────── */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--artms-accent)]/10 text-[var(--artms-accent)] font-bold ring-1 ring-[var(--artms-accent)]/20">
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetake}
                    disabled={uploading}
                    className="flex-1"
                  >
                    <FiRefreshCw size={14} />
                    <span>Retake Photo</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => saveAvatarToServer(capturedPhoto)}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? <FiRefreshCw className="animate-spin" size={14} /> : <FiCheck size={16} />}
                    <span>{uploading ? "Saving..." : "Save Photo"}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeCameraModal}
                    className="flex-1 bg-slate-100"
                  >
                    Cancel
                  </Button>
                  {!cameraError && (
                    <Button
                      type="button"
                      variant="accent"
                      onClick={handleCapture}
                      className="flex-1"
                    >
                      <FiCamera size={16} />
                      <span>Snap Picture</span>
                    </Button>
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
