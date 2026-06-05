import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { deleteMyAccount } from "../../api/auth.js";
import { useConfirm } from "../ConfirmDialog";

export default function DangerZone() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = await confirm({
      tone: "danger",
      icon: "alert",
      title: "Radera ditt konto?",
      body: "All din data — profil, ansökningar, meddelanden och sparade jobb — raderas permanent. Detta går inte att ångra.",
      confirm: "Radera konto",
      confirmVariant: "danger",
      typed: "RADERA",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      logout();
      navigate("/", { replace: true });
    } catch {
      alert("Något gick fel. Kontakta oss på support@transportplattformen.se om problemet kvarstår.");
      setDeleting(false);
    }
  };

  return (
    <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-sm font-semibold text-red-900 uppercase tracking-wide mb-1">Farlig zon</h2>
      <p className="text-sm text-red-800 mb-4">
        Radering av ditt konto tar bort all din data permanent — profil, ansökningar, meddelanden och sparade jobb. Detta kan inte ångras.
      </p>
      <button
        type="button"
        disabled={deleting}
        onClick={handleDelete}
        className="inline-flex items-center px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        {deleting ? "Raderar…" : "Radera mitt konto"}
      </button>
    </div>
  );
}
