import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all therapy keywords configuration
export const getKeywords = query({
  args: {},
  handler: async (ctx) => {
    const keywords = await ctx.db
      .query("keywordConfig")
      .order("asc")
      .collect();
    
    // If no keywords exist in database, return default set
    if (keywords.length === 0) {
      return {
        keywords: [],
        categories: [],
        lastUpdated: null,
      };
    }

    // Group keywords by category
    const categories = [...new Set(keywords.map(k => k.category))].sort();
    
    return {
      keywords,
      categories,
      lastUpdated: Math.max(...keywords.map(k => k._creationTime)),
    };
  },
});

// Initialize keywords with default set
export const initializeDefaultKeywords = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if keywords already exist
    const existingKeywords = await ctx.db
      .query("keywordConfig")
      .first();
    
    if (existingKeywords) {
      throw new Error("Keywords already initialized");
    }

    const defaultKeywords = [
      // Core therapy terms
      { keyword: "terapia", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "psicologo", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "psicóloga", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "psicologia", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "psicología", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "terapeuta", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "psiquiatra", category: "therapy_core", isActive: true, priority: "high" },
      { keyword: "psiquiatría", category: "therapy_core", isActive: true, priority: "high" },
      
      // Mental health general
      { keyword: "salud mental", category: "mental_health", isActive: true, priority: "high" },
      { keyword: "bienestar mental", category: "mental_health", isActive: true, priority: "medium" },
      { keyword: "salud emocional", category: "mental_health", isActive: true, priority: "medium" },
      { keyword: "cuidado mental", category: "mental_health", isActive: true, priority: "medium" },
      { keyword: "salud psicologica", category: "mental_health", isActive: true, priority: "medium" },
      { keyword: "salud psicológica", category: "mental_health", isActive: true, priority: "medium" },
      
      // Treatment types
      { keyword: "tratamiento psicológico", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "sesion de terapia", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "sesión de terapia", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "terapia familiar", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "terapia de pareja", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "terapia grupal", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "terapia online", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "consulta psicologica", category: "treatment", isActive: true, priority: "medium" },
      { keyword: "consulta psicológica", category: "treatment", isActive: true, priority: "medium" },
      
      // Conditions
      { keyword: "ansiedad", category: "conditions", isActive: true, priority: "high" },
      { keyword: "depresion", category: "conditions", isActive: true, priority: "high" },
      { keyword: "depresión", category: "conditions", isActive: true, priority: "high" },
      { keyword: "trauma", category: "conditions", isActive: true, priority: "high" },
      { keyword: "estres", category: "conditions", isActive: true, priority: "medium" },
      { keyword: "estrés", category: "conditions", isActive: true, priority: "medium" },
      { keyword: "burnout", category: "conditions", isActive: true, priority: "medium" },
      { keyword: "trastorno", category: "conditions", isActive: true, priority: "medium" },
      { keyword: "trastornos mentales", category: "conditions", isActive: true, priority: "medium" },
      
      // Crisis terms (sensitive)
      { keyword: "crisis de panico", category: "crisis", isActive: true, priority: "high" },
      { keyword: "crisis de pánico", category: "crisis", isActive: true, priority: "high" },
      { keyword: "ataque de ansiedad", category: "crisis", isActive: true, priority: "high" },
      { keyword: "ataque de nervios", category: "crisis", isActive: true, priority: "medium" },
      { keyword: "autolesion", category: "crisis", isActive: true, priority: "high" },
      { keyword: "autolesión", category: "crisis", isActive: true, priority: "high" },
      { keyword: "suicidio", category: "crisis", isActive: true, priority: "high" },
      
      // Personal experiences
      { keyword: "mi terapeuta", category: "personal", isActive: true, priority: "high" },
      { keyword: "mi psicólogo", category: "personal", isActive: true, priority: "high" },
      { keyword: "mi psicóloga", category: "personal", isActive: true, priority: "high" },
      { keyword: "mi psiquiatra", category: "personal", isActive: true, priority: "high" },
      { keyword: "fui a terapia", category: "personal", isActive: true, priority: "high" },
      { keyword: "me ayudó la terapia", category: "personal", isActive: true, priority: "medium" },
      { keyword: "llamé al psicólogo", category: "personal", isActive: true, priority: "medium" },
      { keyword: "llamé a mi terapeuta", category: "personal", isActive: true, priority: "medium" },
      { keyword: "mi terapeuta me dijo", category: "personal", isActive: true, priority: "medium" },
      { keyword: "diagnosticaron", category: "personal", isActive: true, priority: "medium" },
      
      // Emotional support
      { keyword: "apoyo psicologico", category: "support", isActive: true, priority: "medium" },
      { keyword: "apoyo psicológico", category: "support", isActive: true, priority: "medium" },
      { keyword: "apoyo terapeuta", category: "support", isActive: true, priority: "medium" },
      { keyword: "acompanamiento terapeutico", category: "support", isActive: true, priority: "medium" },
      { keyword: "acompañamiento terapéutico", category: "support", isActive: true, priority: "medium" },
      { keyword: "acompañamiento emocional", category: "support", isActive: true, priority: "medium" },
      { keyword: "red de apoyo", category: "support", isActive: true, priority: "medium" },
      
      // Emotional management
      { keyword: "manejo de emociones", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "problemas emocionales", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "conflicto emocional", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "gestion emocional", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "gestión emocional", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "herramientas emocionales", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "emocionalmente", category: "emotional", isActive: true, priority: "low" },
      { keyword: "autoestima", category: "emotional", isActive: true, priority: "medium" },
      { keyword: "autocuidado mental", category: "emotional", isActive: true, priority: "medium" },
      
      // Therapeutic concepts
      { keyword: "mindfulness", category: "therapeutic", isActive: true, priority: "medium" },
      { keyword: "contencion", category: "therapeutic", isActive: true, priority: "medium" },
      { keyword: "contención", category: "therapeutic", isActive: true, priority: "medium" },
      { keyword: "duelo", category: "therapeutic", isActive: true, priority: "medium" },
      { keyword: "diagnostico mental", category: "therapeutic", isActive: true, priority: "medium" },
      { keyword: "diagnóstico mental", category: "therapeutic", isActive: true, priority: "medium" },
      { keyword: "trato psicologico", category: "therapeutic", isActive: true, priority: "low" },
    ];

    // Insert all keywords
    for (const keywordData of defaultKeywords) {
      await ctx.db.insert("keywordConfig", {
        keyword: keywordData.keyword,
        category: keywordData.category,
        priority: keywordData.priority as "high" | "medium" | "low",
        description: "", // Empty by default, user can add later
        isActive: keywordData.isActive,
        lastModified: Date.now(),
      });
    }

    return { success: true, count: defaultKeywords.length };
  },
});

// Add a new keyword
export const addKeyword = mutation({
  args: {
    keyword: v.string(),
    category: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if keyword already exists
    const existing = await ctx.db
      .query("keywordConfig")
      .withIndex("by_keyword", (q) => q.eq("keyword", args.keyword.toLowerCase().trim()))
      .first();

    if (existing) {
      // Return existing keyword ID instead of throwing error
      console.log(`Keyword "${args.keyword}" already exists, returning existing ID`);
      return existing._id;
    }

    const keywordId = await ctx.db.insert("keywordConfig", {
      keyword: args.keyword.toLowerCase().trim(),
      category: args.category,
      priority: args.priority,
      description: args.description || "",
      isActive: args.isActive ?? true,
      lastModified: Date.now(),
    });

    return keywordId;
  },
});

// Update a keyword
export const updateKeyword = mutation({
  args: {
    id: v.id("keywordConfig"),
    keyword: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const updateData: Record<string, unknown> = {
      lastModified: Date.now(),
    };

    if (updates.keyword !== undefined) {
      // Check if new keyword already exists (excluding current one)
      const newKeyword = updates.keyword.toLowerCase().trim();
      const existing = await ctx.db
        .query("keywordConfig")
        .withIndex("by_keyword", (q) => q.eq("keyword", newKeyword))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error("Keyword already exists");
      }
      updateData.keyword = newKeyword;
    }

    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete a keyword
export const deleteKeyword = mutation({
  args: { id: v.id("keywordConfig") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return id;
  },
});

// Toggle keyword active status
export const toggleKeywordStatus = mutation({
  args: { id: v.id("keywordConfig") },
  handler: async (ctx, { id }) => {
    const keyword = await ctx.db.get(id);
    if (!keyword) {
      throw new Error("Keyword not found");
    }

    await ctx.db.patch(id, {
      isActive: !keyword.isActive,
      lastModified: Date.now(),
    });

    return !keyword.isActive;
  },
});

// Get active keywords for processing (used by the keyword filter)
export const getActiveKeywords = query({
  args: {},
  handler: async (ctx) => {
    const keywords = await ctx.db
      .query("keywordConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return keywords.map(k => k.keyword);
  },
});

// Get keywords by category
export const getKeywordsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const keywords = await ctx.db
      .query("keywordConfig")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();

    return keywords;
  },
});

// Bulk update keywords
export const bulkUpdateKeywords = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("keywordConfig"),
      isActive: v.optional(v.boolean()),
      priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
      category: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { updates }) => {
    const results = [];
    
    for (const update of updates) {
      const { id, ...changes } = update;
      
      const updateData: Record<string, unknown> = {
        lastModified: Date.now(),
        ...changes,
      };

      await ctx.db.patch(id, updateData);
      results.push(id);
    }

    return results;
  },
});
