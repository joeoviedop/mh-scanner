export interface FragmentClassification {
  tema: "testimonio" | "recomendacion" | "reflexion" | "dato" | "otro";
  tono: "positivo" | "neutro" | "critico" | "preocupante";
  sensibilidad: (
    | "autolesion"
    | "suicidio"
    | "abuso"
    | "trauma"
    | "crisis"
    | "ninguna"
  )[];
  confianza: number;
  tags?: string[];
  razon?: string;
}

export interface ClassificationInput {
  fragmentText: string;
  contextText: string;
  keywords: string[];
  language?: string | null;
}

export class OpenAIClient {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini", endpoint = "https://api.openai.com/v1/responses") {
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.model = model;
  }

  async classifyFragment(input: ClassificationInput): Promise<FragmentClassification> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "Eres un analista que clasifica fragmentos de podcasts en español relacionados con terapia y salud mental. Responde exclusivamente con JSON válido que siga la especificación proporcionada.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.buildPrompt(input),
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "fragment_classification",
            schema: {
              type: "object",
              properties: {
                tema: {
                  type: "string",
                  enum: ["testimonio", "recomendacion", "reflexion", "dato", "otro"],
                },
                tono: {
                  type: "string",
                  enum: ["positivo", "neutro", "critico", "preocupante"],
                },
                sensibilidad: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["autolesion", "suicidio", "abuso", "trauma", "crisis", "ninguna"],
                  },
                },
                confianza: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  nullable: true,
                },
                razon: {
                  type: "string",
                  nullable: true,
                },
              },
              required: ["tema", "tono", "sensibilidad", "confianza"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      output?: {
        content: { type: string; text?: string }[];
      }[];
    };

    const content = data.output
      ?.flatMap((item) => item.content)
      ?.find((item) => typeof item.text === "string")?.text;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    try {
      const parsed = JSON.parse(content) as FragmentClassification & { sensibilidad: string[] };
      const allowedSensibilidad = [
        "autolesion",
        "suicidio",
        "abuso",
        "trauma",
        "crisis",
        "ninguna",
      ] as const;

      const isAllowedSensibilidad = (
        label: string,
      ): label is FragmentClassification["sensibilidad"][number] =>
        (allowedSensibilidad as readonly string[]).includes(label);

      const sensibilidad = (parsed.sensibilidad ?? [])
        .filter(isAllowedSensibilidad)
        .filter((value, index, array) => array.indexOf(value) === index);

      const safeSensibilidad: FragmentClassification["sensibilidad"] = sensibilidad.length
        ? sensibilidad
        : ["ninguna"];
      const confianza = Math.max(0, Math.min(100, Math.round(parsed.confianza)));

      return {
        tema: parsed.tema,
        tono: parsed.tono,
        sensibilidad: safeSensibilidad,
        confianza,
        tags: parsed.tags?.filter((tag) => tag.trim().length > 0),
        razon: parsed.razon?.trim(),
      };
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }

  private buildPrompt(input: ClassificationInput): string {
    const keywords = input.keywords.length ? `Palabras clave detectadas: ${input.keywords.join(", ")}` : "Sin palabras clave destacadas.";
    const language = input.language ?? "desconocido";

    return `Analiza el siguiente fragmento de podcast para detectar menciones relevantes sobre terapia y salud mental.

Idioma del episodio: ${language}
${keywords}

Fragmento:
"""
${input.fragmentText}
"""

Contexto ampliado:
"""
${input.contextText}
"""

Devuelve un JSON con los campos:
- tema: testimonio | recomendacion | reflexion | dato | otro
- tono: positivo | neutro | critico | preocupante
- sensibilidad: lista de etiquetas (autolesion, suicidio, abuso, trauma, crisis, ninguna)
- confianza: número 0-100 que indique certeza
- tags: lista opcional de etiquetas libres
- razon: breve explicación opcional del porqué de la clasificación`;
  }
}

export function getOpenAIClient(): OpenAIClient {
  return new OpenAIClient(process.env.OPENAI_API_KEY);
}
