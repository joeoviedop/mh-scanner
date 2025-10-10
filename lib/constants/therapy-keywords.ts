export const THERAPY_KEYWORDS = [
  "terapia",
  "psicologo",
  "psicóloga",
  "psicologia",
  "psicología",
  "salud mental",
  "terapeuta",
  "psiquiatra",
  "psiquiatría",
  "tratamiento psicológico",
  "sesion de terapia",
  "sesión de terapia",
  "mi terapeuta",
  "fui a terapia",
  "me ayudó la terapia",
  "mi psicólogo",
  "mi psicóloga",
  "ansiedad",
  "depresion",
  "depresión",
  "crisis de panico",
  "crisis de pánico",
  "autolesion",
  "autolesión",
  "suicidio",
  "salud emocional",
  "bienestar mental",
  "apoyo psicologico",
  "apoyo psicológico",
  "manejo de emociones",
  "problemas emocionales",
  "trauma",
  "estres",
  "estrés",
  "burnout",
  "ataque de ansiedad",
  "trato psicologico",
  "consulta psicologica",
  "consulta psicológica",
  "cuidado mental",
  "mindfulness",
  "autoestima",
  "diagnostico mental",
  "diagnóstico mental",
  "terapia familiar",
  "terapia de pareja",
  "terapia grupal",
  "terapia online",
  "acompanamiento terapeutico",
  "acompañamiento terapéutico",
  "apoyo terapeuta",
  "emocionalmente",
  "salud psicologica",
  "salud psicológica",
  "conflicto emocional",
  "gestion emocional",
  "gestión emocional",
  "contencion",
  "contención",
  "duelo",
  "llamé al psicólogo",
  "mi psiquiatra",
  "acompañamiento emocional",
  "diagnosticaron",
  "trastorno",
  "trastornos mentales",
  "ataque de nervios",
  "llamé a mi terapeuta",
  "mi terapeuta me dijo",
  "herramientas emocionales",
  "autocuidado mental",
  "red de apoyo",
];

export function matchTherapyKeywords(text: string | null | undefined): string[] {
  // Ensure text is a valid string
  if (!text || typeof text !== "string") return [];

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const found = new Set<string>();

  for (const keyword of THERAPY_KEYWORDS) {
    const normalizedKeyword = keyword
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    if (normalized.includes(normalizedKeyword)) {
      found.add(keyword);
    }
  }

  return Array.from(found).sort();
}
