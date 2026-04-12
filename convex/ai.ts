import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  starter: 10,
  premium: Infinity,
};

export const checkImportLimit = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { canImport: false, remaining: 0, plan: "free" };

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return { canImport: false, remaining: 0, plan: "free" };

    const plan = profile.plan;
    const limit = PLAN_LIMITS[plan];
    const today = new Date().toDateString();
    const count = profile.dailyImportDate === today ? profile.dailyImportCount : 0;
    const remaining = plan === "premium" ? Infinity : Math.max(0, limit - count);

    return { canImport: remaining > 0, remaining, plan, limit };
  },
});

export const incrementImportCount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new ConvexError("Profile not found");

    const today = new Date().toDateString();
    const count = profile.dailyImportDate === today ? profile.dailyImportCount : 0;

    await ctx.db.patch(profile._id, {
      dailyImportCount: count + 1,
      dailyImportDate: today,
    });
  },
});

// Main AI import action — runs server-side so API key is never exposed
export const importDocument = action({
  args: {
    fileUrl: v.string(),
    fileName: v.string(),
    cardType: v.union(
      v.literal("basic"),
      v.literal("definition"),
      v.literal("cloze"),
      v.literal("visual")
    ),
    deckId: v.id("decks"),
  },
  handler: async (ctx, { fileUrl, fileName, cardType, deckId }) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new ConvexError("Not authenticated");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new ConvexError("AI service not configured");

    // Determine prompt by card type
    const prompts: Record<string, string> = {
      basic:
        "Analyze this document and extract 10-20 key concepts. Return a JSON array with objects containing 'front' (a clear question) and 'back' (concise answer). Format: [{\"front\": \"...\", \"back\": \"...\"}]",
      definition:
        "Identify the key terms and vocabulary in this document. Return a JSON array with objects containing 'front' (the term) and 'back' (its definition). Format: [{\"front\": \"Term\", \"back\": \"Definition...\"}]",
      cloze:
        "Create fill-in-the-blank flashcards from the most important facts in this document. Use {{c1::answer}} notation for the blank. Return JSON: [{\"front\": \"The {{c1::blank}} is important because...\", \"back\": \"full sentence\"}]",
      visual:
        "Extract key visual concepts, processes, diagrams, or structures described in this document. For each, write a 'front' that asks about the visual concept, and a 'back' that describes it in detail including any components or steps. Return JSON: [{\"front\": \"...\", \"back\": \"...\"}]",
    };

    // Fetch the document content to send inline to Gemini
    let fileContent: string;
    let mimeTypeForGemini = "text/plain";

    try {
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) throw new Error(`File fetch failed: ${fileRes.status}`);

      const contentType = fileRes.headers.get("content-type") ?? "application/octet-stream";

      if (contentType.includes("pdf")) {
        mimeTypeForGemini = "application/pdf";
        const buffer = await fileRes.arrayBuffer();
        fileContent = Buffer.from(buffer).toString("base64");
      } else if (contentType.startsWith("image/")) {
        mimeTypeForGemini = contentType.split(";")[0];
        const buffer = await fileRes.arrayBuffer();
        fileContent = Buffer.from(buffer).toString("base64");
      } else {
        // Plain text / JSON / etc
        mimeTypeForGemini = "text/plain";
        fileContent = await fileRes.text();
        // For text, encode as base64 too
        fileContent = Buffer.from(fileContent).toString("base64");
      }
    } catch (err: any) {
      throw new ConvexError(`Could not read document: ${err?.message ?? err}`);
    }

    // Build Gemini request with inline document data
    const geminiParts:
      | { text: string }[]
      | { inlineData: { mimeType: string; data: string } }[] = [
      { text: prompt },
      { inlineData: { mimeType: mimeTypeForGemini, data: fileContent } },
    ];

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: geminiParts }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new ConvexError(`AI service error: ${response.statusText}`);
    }

    const result = await response.json();
    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let cards: Array<{ front: string; back: string }> = [];
    try {
      // Parse JSON, handle potential markdown code fences
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      cards = JSON.parse(cleaned);
    } catch {
      throw new ConvexError("Failed to parse AI response");
    }

    // Bulk create cards in the deck
    const cardsToCreate = cards.map((c) => ({
      front: c.front || "",
      back: c.back || "",
      type: cardType,
      tags: ["ai-generated"],
    }));

    await ctx.runMutation(api.cards.bulkCreate, { deckId, cards: cardsToCreate });
    await ctx.runMutation(api.ai.incrementImportCount, {});

    return { count: cards.length, cards };
  },
});
