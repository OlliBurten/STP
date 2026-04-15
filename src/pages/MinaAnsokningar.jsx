import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchConversations } from "../api/conversations.js";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import LoadingBlock from "../components/LoadingBlock";

function ApplicationStatus({ conv }) {
  if (conv.selectedByCompanyAt) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Utvald
      </span>
    );
  }
  if (conv.rejectedByCompanyAt) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
        Ej aktuell
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Inväntar svar
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

export default function MinaAnsokningar() {
  usePageTitle("Mina ansökningar");
  const { hasApi } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((convs) => {
        // Applications = conversations tied to a specific job
        setApplications(convs.filter((c) => c.jobId));
      })
      .catch((e) => {
        setError(e.message || "Kunde inte hämta dina ansökningar");
      })
      .finally(() => setLoading(false));
  }, [hasApi]);

  const activeCount = applications.filter((a) => !a.rejectedByCompanyAt).length;
  const selectedCount = applications.filter((a) => a.selectedByCompanyAt).length;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader
        breadcrumbs={[{ label: "Mina ansökningar" }]}
        backTo="/jobb"
        backLabel="Tillbaka till jobblistan"
        title="Mina ansökningar"
        description="Här ser du alla jobb du har sökt och statusen på dina ansökningar."
      />

      {loading ? (
        <LoadingBlock message="Hämtar dina ansökningar..." />
      ) : error ? (
        <p className="mt-8 text-red-600">{error}</p>
      ) : applications.length === 0 ? (
        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-600">Du har inte sökt några jobb ännu.</p>
          <Link
            to="/jobb"
            className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline"
          >
            Bläddra bland jobb →
          </Link>
        </div>
      ) : (
        <>
          {selectedCount > 0 && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              <span className="font-medium">Grattis!</span> Du är utvald för {selectedCount} {selectedCount === 1 ? "tjänst" : "tjänster"}. Gå till meddelanden och svara.
            </div>
          )}

          <div className="mb-2 flex gap-4 text-sm text-slate-500">
            <span>{applications.length} {applications.length === 1 ? "ansökning" : "ansökningar"} totalt</span>
            <span>{activeCount} aktiva</span>
          </div>

          <ul className="mt-2 space-y-3">
            {applications.map((conv) => (
              <li key={conv.id}>
                <Link
                  to={`/meddelanden/${conv.id}`}
                  className="block p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-slate-900 truncate">{conv.jobTitle || "Okänd tjänst"}</h2>
                        <ApplicationStatus conv={conv} />
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{conv.companyName}</p>
                      <p className="text-xs text-slate-400 mt-1">Sökt {formatDate(conv.createdAt)}</p>
                    </div>
                    <span className="text-slate-400 hover:text-[var(--color-primary)] shrink-0 mt-0.5">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8">
        <Link
          to="/jobb"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
        >
          Hitta fler jobb
        </Link>
      </div>
    </main>
  );
}
