export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Bienvenido al panel de VoyBien</h2>
        <p className="mt-2 text-sm text-slate-600">
          Aquí podrás concentrar la investigación sobre salud mental en podcasts. Empieza cargando un
          canal o playlist de YouTube para detectar menciones relevantes y decidir qué episodios deben
          revisarse a detalle.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">1. Escanear contenido</h3>
          <p className="mt-1 text-sm text-slate-600">
            Ingresa la URL de un canal o playlist. El sistema priorizará episodios con subtítulos y te
            mostrará un resumen de menciones relacionadas a terapia y salud mental.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">2. Evaluar hallazgos</h3>
          <p className="mt-1 text-sm text-slate-600">
            Revisa el tono, la sensibilidad y la confianza de cada fragmento para decidir si amerita
            respuesta, seguimiento o integración a campañas en curso.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">3. Registrar feedback</h3>
          <p className="mt-1 text-sm text-slate-600">
            Marca los hallazgos útiles para ajustar el ranking de menciones. Esto ayuda a priorizar los
            fragmentos más accionables para el equipo.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">4. Compartir y coordinar</h3>
          <p className="mt-1 text-sm text-slate-600">
            Exporta resultados a CSV o Google Sheets para informar a Operaciones, Terapia y Contenido
            sin perder el contexto clave.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        <h3 className="text-base font-semibold">Próximos pasos en el MVP</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Habilitar el formulario para cargar canales y playlists de YouTube.</li>
          <li>Conectar Convex para almacenar episodios, fragmentos y feedback del equipo.</li>
          <li>
            Integrar detección automática con OpenAI para clasificar tipo, tono y sensibilidad de cada
            mención.
          </li>
        </ul>
      </section>
    </div>
  );
}
