import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("Verifierar din e-post...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verifieringstoken saknas.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Din e-post är nu verifierad.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message || "Verifieringen misslyckades.");
      });
  }, [token]);

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div
        className={`rounded-xl border p-6 ${
          status === "success"
            ? "bg-green-50 border-green-200 text-green-900"
            : status === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-slate-50 border-slate-200 text-slate-900"
        }`}
      >
        <h1 className="text-xl font-bold">E-postverifiering</h1>
        <p className="mt-2 text-sm">{message}</p>
      </div>
      <Link
        to="/login"
        className="mt-6 inline-block text-[var(--color-primary)] font-medium hover:underline"
      >
        Till login
      </Link>
    </main>
  );
}
