"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const FEATURES = [
  {
    title: "Escaneo enfocado",
    description:
      "Analiza canales y playlists para detectar menciones reales sobre terapia y salud mental.",
    icon: "🎯",
  },
  {
    title: "Contexto accionable",
    description:
      "Extrae momentos clave, tono y sensibilidad para que el equipo avance sin ver video completo.",
    icon: "🔍",
  },
  {
    title: "Exportación simple",
    description:
      "Descarga resultados a CSV o Google Sheets para compartir hallazgos y coordinar contenidos.",
    icon: "📊",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passcode.trim()) {
      setError("Ingresa el passcode compartido con el equipo VoyBien.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/auth/verify-passcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(payload.message ?? "Passcode incorrecto.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos validar el passcode.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #06204E 0%, #FF40CE 100%)'}}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat"
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Main login card */}
        <div className="w-full max-w-md">
          {/* Logo/Splash */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl font-bold text-white">V</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{color: '#95E0FF'}}>
              VoyBien · Internal Tool
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">
              Podcast Therapy Scanner
            </h1>
            <p className="text-sm max-w-sm opacity-90">
              Accede con el passcode interno para analizar conversaciones sobre terapia, priorizar
              contenidos y coordinar respuestas con el equipo.
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="passcode" className="block text-sm font-medium text-gray-900 mb-2">
                  Passcode compartido
                </label>
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#111827',
                  }}
                />
              </div>

              {error && (
                <div className="alert-error">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn micro-bounce w-full font-bold py-3"
                style={{
                  background: 'linear-gradient(to right, #FF40CE, #0065FF)',
                  color: 'white'
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner"></div>
                    Validando passcode...
                  </div>
                ) : (
                  "Ingresar al dashboard"
                )}
              </button>
            </form>
          </div>

          {/* Features section */}
          <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider">
              Lo que podrás hacer adentro
            </h2>
            <ul className="space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="flex gap-3 text-sm">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">{feature.title}</p>
                    <p className="text-xs leading-relaxed opacity-80">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-xs opacity-60">
              ¿Dudas? Escríbele a Operaciones VoyBien para recuperar el passcode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
