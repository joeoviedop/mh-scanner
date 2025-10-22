"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface Keyword {
  _id: string;
  keyword: string;
  category: string;
  priority: "high" | "medium" | "low";
  description: string;
  isActive: boolean;
  lastModified: number;
}

interface KeywordConfigData {
  keywords: Keyword[];
  categories: string[];
  lastUpdated: number | null;
}

const CATEGORY_NAMES: Record<string, string> = {
  therapy_core: "🎯 Core Therapy",
  mental_health: "🧠 Mental Health",
  treatment: "💊 Treatment",
  conditions: "📋 Conditions",
  crisis: "🚨 Crisis",
  personal: "👤 Personal Experiences",
  support: "🤝 Support",
  emotional: "💭 Emotional",
  therapeutic: "🔬 Therapeutic Concepts",
};

const PRIORITY_BADGES: Record<Keyword["priority"], string> = {
  high: "bg-danger-50/80 text-danger-600",
  medium: "bg-warning-50/80 text-warning-600",
  low: "bg-sand-100 text-sand-600",
};

const STATUS_BADGES = {
  active: "bg-success-50/80 text-success-600",
  inactive: "bg-sand-100 text-sand-500",
};

const INPUT_STYLES =
  "w-full rounded-3xl border border-white/70 bg-white/95 px-4 py-2 text-sm text-sand-900 shadow-subtle transition focus:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function KeywordConfigPageClient() {
  const [data, setData] = useState<KeywordConfigData>({
    keywords: [],
    categories: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    keyword: "",
    category: "",
    priority: "medium" as Keyword["priority"],
    description: "",
    isActive: true,
  });

  useEffect(() => {
    void fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/config/keywords");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch keywords");
      }

      setData(result.data);

      if (result.data.keywords.length === 0) {
        setStatusMessage("No hay palabras clave configuradas. ¿Quieres inicializarlas con un set recomendado?");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultKeywords = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage(null);

      const response = await fetch("/api/config/keywords/initialize", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initialize keywords");
      }

      setStatusMessage(`Agregamos ${result.data.count} palabras clave sugeridas.`);
      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize keywords");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeyword = async () => {
    if (!formData.keyword.trim() || !formData.category.trim()) {
      setError("La palabra clave y la categoría son obligatorias.");
      return;
    }

    try {
      setError(null);
      setStatusMessage(null);

      const payload = editingKeyword ? { ...formData, id: editingKeyword._id } : formData;

      const response = await fetch("/api/config/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save keyword");
      }

      setStatusMessage(editingKeyword ? "Palabra clave actualizada." : "Palabra clave agregada.");

      setFormData({
        keyword: "",
        category: "",
        priority: "medium",
        description: "",
        isActive: true,
      });
      setEditingKeyword(null);
      setShowAddForm(false);

      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save keyword");
    }
  };

  const handleDeleteKeyword = async (keyword: Keyword) => {
    if (!confirm(`¿Eliminar "${keyword.keyword}"?`)) {
      return;
    }

    try {
      setError(null);
      setStatusMessage(null);

      const response = await fetch(`/api/config/keywords?id=${keyword._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete keyword");
      }

      setStatusMessage("Palabra clave eliminada.");
      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete keyword");
    }
  };

  const handleToggleActive = async (keyword: Keyword) => {
    try {
      setError(null);

      const response = await fetch("/api/config/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: keyword._id,
          isActive: !keyword.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to toggle keyword");
      }

      await fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle keyword");
    }
  };

  const startEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({
      keyword: keyword.keyword,
      category: keyword.category,
      priority: keyword.priority,
      description: keyword.description,
      isActive: keyword.isActive,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingKeyword(null);
    setShowAddForm(false);
    setFormData({
      keyword: "",
      category: "",
      priority: "medium",
      description: "",
      isActive: true,
    });
  };

  const filteredKeywords = useMemo(() => {
    return data.keywords.filter((keyword) => {
      if (selectedCategory !== "all" && keyword.category !== selectedCategory) return false;
      if (selectedPriority !== "all" && keyword.priority !== selectedPriority) return false;
      if (!showInactive && !keyword.isActive) return false;
      if (searchTerm && !keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [data.keywords, selectedCategory, selectedPriority, showInactive, searchTerm]);

  const activeCount = data.keywords.filter((keyword) => keyword.isActive).length;
  const totalCount = data.keywords.length;

  if (loading && data.keywords.length === 0) {
    return (
      <div className="">
        <div className="">
          <span className="" />
          <p className="">Cargando palabras clave…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <header className="">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/dashboard" },
            { label: "Configuración" },
            { label: "Palabras clave" },
          ]}
        />
        <div className="">
          <div className="">
            <p className="">
              Podcaster Therapy Scanner
            </p>
            <h1 className="">Configura la detección por palabras clave</h1>
            <p className="">
              Ajusta el diccionario de términos que usamos para detectar menciones en las transcripciones y priorizar fragmentos.
            </p>
          </div>
          <div className="">
            <Badge variant="outline" className="">
              {activeCount} activas · {totalCount} totales
            </Badge>
            {!showAddForm ? (
              <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
                Añadir palabra clave
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {statusMessage ? (
        <div className="">
          <div className="">
            <span>{statusMessage}</span>
            <Button variant="ghost" size="sm" className="" onClick={() => setStatusMessage(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="">
          <div className="">
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="" onClick={() => setError(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : null}

      {data.keywords.length === 0 && !loading ? (
        <div className="">
          <div className="">🔧</div>
          <h2 className="">No hay palabras clave configuradas</h2>
          <p className="">
            Inicializa el set sugerido o comienza agregando tus propias variantes manualmente.
          </p>
          <div className="">
            <Button onClick={initializeDefaultKeywords} isLoading={loading} loadingLabel="Inicializando…">
              Inicializar palabras sugeridas
            </Button>
            <Button variant="secondary" onClick={() => setShowAddForm(true)}>
              Agregar manualmente
            </Button>
          </div>
        </div>
      ) : null}

      {showAddForm ? (
        <div className="">
          <div className="">
            <div>
              <h3 className="">
                {editingKeyword ? "Editar palabra clave" : "Nueva palabra clave"}
              </h3>
              <p className="">
                Define la categoría, prioridad y describe cuándo debe dispararse esta detección.
              </p>
            </div>
            <Button variant="ghost" onClick={cancelEdit} className="">
              Cancelar
            </Button>
          </div>

          <div className="">
            <div>
              <label className="">
                Palabra o frase *
              </label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(event) => setFormData((prev) => ({ ...prev, keyword: event.target.value }))}
                className={INPUT_STYLES}
                placeholder="Ej. terapia, mi psicólogo"
              />
            </div>

            <div>
              <label className="">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                className={INPUT_STYLES}
              >
                <option value="">Selecciona…</option>
                {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
                <option value="custom">Personalizada</option>
              </select>
            </div>

            <div>
              <label className="">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, priority: event.target.value as Keyword["priority"] }))
                }
                className={INPUT_STYLES}
              >
                <option value="high">Alta prioridad</option>
                <option value="medium">Media prioridad</option>
                <option value="low">Baja prioridad</option>
              </select>
            </div>

            <label className="">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
                className=""
              />
              Activa para nuevos análisis
            </label>
          </div>

          <div className="">
            <label className="">
              Descripción (opcional)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              className={`${INPUT_STYLES} min-h-[120px]`}
              placeholder="¿Cuándo debería marcarse esta palabra clave?"
            />
          </div>

          <div className="">
            <Button type="button" onClick={handleSaveKeyword} isLoading={loading} loadingLabel="Guardando…">
              {editingKeyword ? "Actualizar palabra clave" : "Agregar palabra clave"}
            </Button>
            <Button variant="ghost" onClick={cancelEdit} className="">
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {data.keywords.length > 0 ? (
        <div className="">
          <div className="">
            <div>
              <label className="">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={INPUT_STYLES}
                placeholder="Buscar palabras…"
              />
            </div>
            <div>
              <label className="">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className={INPUT_STYLES}
              >
                <option value="all">Todas</option>
                {data.categories.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_NAMES[category] || category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="">
                Prioridad
              </label>
              <select
                value={selectedPriority}
                onChange={(event) => setSelectedPriority(event.target.value)}
                className={INPUT_STYLES}
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <label className="">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className=""
              />
              Mostrar inactivas
            </label>
          </div>
        </div>
      ) : null}

      {filteredKeywords.length > 0 ? (
        <div className="">
          <div className="">
            <h2 className="">Palabras clave ({filteredKeywords.length})</h2>
            <Badge variant="outline" className="">
              Última actualización:{" "}
              {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : "sin datos"}
            </Badge>
          </div>
          <div className="divide-y divide-white/60">
            {filteredKeywords.map((keyword) => (
              <div key={keyword._id} className="">
                <div className="">
                  <div className="">
                    <div className="">
                      <h3 className="">
                        &ldquo;{keyword.keyword}&rdquo;
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${PRIORITY_BADGES[keyword.priority]}`}>
                        {keyword.priority}
                      </span>
                      <span className="">
                        {CATEGORY_NAMES[keyword.category] || keyword.category}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          keyword.isActive ? STATUS_BADGES.active : STATUS_BADGES.inactive
                        }`}
                      >
                        {keyword.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    {keyword.description ? (
                      <p className="">{keyword.description}</p>
                    ) : null}
                    <p className="">
                      Actualizada {new Date(keyword.lastModified).toLocaleString()}
                    </p>
                  </div>
                  <div className="">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={keyword.isActive ? "text-warning-600 hover:text-warning-700" : "text-success-600 hover:text-success-700"}
                      onClick={() => handleToggleActive(keyword)}
                    >
                      {keyword.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => startEdit(keyword)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className=""
                      onClick={() => handleDeleteKeyword(keyword)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data.keywords.length > 0 ? (
        <div className="">
          <div className="">🔍</div>
          <h3 className="">No hay coincidencias con los filtros</h3>
          <p className="">Ajusta tu búsqueda o muestra palabras inactivas.</p>
        </div>
      ) : null}

      {data.keywords.length > 0 ? (
        <div className="">
          <h4 className="">💡 Cómo usamos estas palabras</h4>
          <ul className="">
            <li>• Solo las palabras <strong>activas</strong> se usan en nuevos análisis.</li>
            <li>• Las de <strong>alta prioridad</strong> pesan más en el ranking de fragmentos.</li>
            <li>• Aplicamos coincidencias difusas (ignora mayúsculas, acentos y pluralizaciones).</li>
            <li>• Los cambios aplican inmediatamente para los siguientes procesos de transcripción.</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
