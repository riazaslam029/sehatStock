"use server";

import { getDb, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { getGeminiClient, isGeminiConfigured } from "./gemini";

export interface SemanticSearchResult {
  id: string;
  brandName: string;
  genericName: string;
  categoryName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  barcode: string | null;
  baseSellingPrice: number;
  totalStock: number;
  batchCount: number;
  inStock: boolean;
  reorderLevel: number;
  isLowStock: boolean;
  similarityScore: number; // 0 - 100
  matchReasoning: string;
  matchedSymptoms: string[];
  description: string | null;
}

export interface SemanticSearchResponse {
  query: string;
  source: "GEMINI_API" | "CLINICAL_SEMANTIC_ENGINE";
  totalResults: number;
  results: SemanticSearchResult[];
}

export interface MedicineCandidate {
  id: string;
  brandName: string;
  genericName: string;
  categoryId: string;
  categoryName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  barcode: string | null;
  baseSellingPrice: string;
  reorderLevel: number;
  description: string | null;
  symptoms: string | null;
  totalStock: number;
  batchCount: number;
}

export async function searchMedicinesSemantically(
  query: string,
  categoryFilter?: string
): Promise<SemanticSearchResponse> {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) {
    return {
      query: "",
      source: "CLINICAL_SEMANTIC_ENGINE",
      totalResults: 0,
      results: [],
    };
  }

  const db = await getDb();

  // 1. Fetch all active medicines with category and current batch stock aggregated
  const rawMeds = await db
    .select({
      id: schema.medicines.id,
      brandName: schema.medicines.brandName,
      genericName: schema.medicines.genericName,
      categoryId: schema.medicines.categoryId,
      categoryName: schema.categories.name,
      strength: schema.medicines.strength,
      dosageForm: schema.medicines.dosageForm,
      manufacturer: schema.medicines.manufacturer,
      barcode: schema.medicines.barcode,
      baseSellingPrice: schema.medicines.baseSellingPrice,
      reorderLevel: schema.medicines.reorderLevel,
      description: schema.medicines.description,
      symptoms: schema.medicines.symptoms,
      totalStock: sql<number>`COALESCE(SUM(${schema.medicineBatches.quantity}), 0)::int`,
      batchCount: sql<number>`COUNT(${schema.medicineBatches.id})::int`,
    })
    .from(schema.medicines)
    .innerJoin(schema.categories, eq(schema.medicines.categoryId, schema.categories.id))
    .leftJoin(
      schema.medicineBatches,
      eq(schema.medicineBatches.medicineId, schema.medicines.id)
    )
    .where(eq(schema.medicines.status, "ACTIVE"))
    .groupBy(schema.medicines.id, schema.categories.name);

  const meds: MedicineCandidate[] = rawMeds as unknown as MedicineCandidate[];

  // Filter category if specified
  const filteredMeds: MedicineCandidate[] = categoryFilter && categoryFilter !== "ALL"
    ? meds.filter((m: MedicineCandidate) => m.categoryId === categoryFilter || m.categoryName.toLowerCase() === categoryFilter.toLowerCase())
    : meds;


  // 2. Try Gemini API first if configured
  if (isGeminiConfigured()) {
    try {
      const client = getGeminiClient();
      if (client) {
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

        const catalogPrompt = filteredMeds.map((m) => ({
          id: m.id,
          brand: m.brandName,
          generic: m.genericName,
          category: m.categoryName,
          symptoms: m.symptoms || "",
          description: m.description || "",
        }));

        const prompt = `You are a clinical pharmacologist AI assistant for SehatStock Pharmacy POS.
Given this patient/pharmacist search query: "${cleanQuery}"

Analyze our pharmacy formulary and evaluate which medicines clinically match or treat these symptoms/indications.
Return ONLY valid JSON array with objects matching this exact structure:
[
  {
    "id": "med-id",
    "score": 95, // integer 0 to 100 representing clinical relevance match
    "reasoning": "Clear 1-sentence clinical explanation why this medicine treats the symptoms",
    "matchedSymptoms": ["fever", "headache"] // list of specific symptoms addressed
  }
]

Filter out medicines with relevance score below 35. Order from highest relevance to lowest.
Pharmacy formulary:
${JSON.stringify(catalogPrompt)}`;

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const aiMatches: Array<{
            id: string;
            score: number;
            reasoning: string;
            matchedSymptoms: string[];
          }> = JSON.parse(jsonMatch[0]);

          const results: SemanticSearchResult[] = [];

          for (const match of aiMatches) {
            const med = filteredMeds.find((m) => m.id === match.id);
            if (med && match.score >= 35) {
              const stock = Number(med.totalStock);
              results.push({
                id: med.id,
                brandName: med.brandName,
                genericName: med.genericName,
                categoryName: med.categoryName,
                strength: med.strength,
                dosageForm: med.dosageForm,
                manufacturer: med.manufacturer,
                barcode: med.barcode,
                baseSellingPrice: parseFloat(med.baseSellingPrice),
                totalStock: stock,
                batchCount: Number(med.batchCount),
                inStock: stock > 0,
                reorderLevel: med.reorderLevel,
                isLowStock: stock <= med.reorderLevel,
                similarityScore: Math.min(100, Math.max(0, match.score)),
                matchReasoning: match.reasoning,
                matchedSymptoms: match.matchedSymptoms || [],
                description: med.description,
              });
            }
          }

          results.sort((a, b) => b.similarityScore - a.similarityScore);

          return {
            query: cleanQuery,
            source: "GEMINI_API",
            totalResults: results.length,
            results,
          };
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed or timed out, seamlessly falling back to Clinical Semantic Engine:", err);
      // Seamlessly fall through to deterministic clinical semantic matcher
    }
  }

  // 3. High-Accuracy Clinical Semantic Engine (Deterministic Fallback / Offline / Zero-Setup)
  const results = matchClinicalFormulary(cleanQuery, filteredMeds);

  return {
    query: cleanQuery,
    source: "CLINICAL_SEMANTIC_ENGINE",
    totalResults: results.length,
    results,
  };
}

/**
 * Clinical Semantic Matcher:

 * Understands synonyms, clinical indications, colloquial symptoms, and anatomy terms.
 */
function matchClinicalFormulary(
  query: string,
  medicinesList: MedicineCandidate[]
): SemanticSearchResult[] {

  const q = query.toLowerCase();
  const queryTokens = q
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  // Clinical Synonym Dictionary mapping colloquial symptoms to pharmacological actions
  const clinicalOntology: Record<string, string[]> = {
    fever: ["temperature", "bukhar", "pyrexia", "hot", "shivering", "chills", "febrile"],
    pain: ["ache", "headache", "sar dard", "body pain", "backache", "toothache", "discomfort", "soreness"],
    headache: ["migraine", "sar dard", "temple pain", "tension headache"],
    throat: ["sore throat", "cough", "pharyngitis", "tonsils", "tonsillitis", "difficulty swallowing", "gala kharab"],
    cough: ["dry cough", "productive cough", "chest congestion", "mucus", "phlegm"],
    infection: ["bacterial", "antibiotic", "pus", "wound", "ear infection", "pneumonia", "sinusitis", "uti"],
    acidity: ["heartburn", "acid reflux", "gerd", "burning stomach", "ulcer", "gastric", "indigestion", "teezabiyat"],
    allergy: ["sneezing", "dust", "pollen", "runny nose", "itching", "watery eyes", "hives", "allergic rhinitis", "rash"],
    stomach: ["diarrhea", "loose motions", "pecheesh", "dysentery", "cramps", "gastroenteritis", "food poisoning"],
    joint: ["arthritis", "swelling", "knee pain", "inflammation", "muscle sprain", "strain", "joint pain"],
    flu: ["cold", "influenza", "nazla", "zukaam", "blocked nose", "nasal congestion"],
    weakness: ["fatigue", "calcium", "vitamin", "exhaustion", "convalescence", "bones"],
  };

  const scoredResults: SemanticSearchResult[] = [];

  for (const med of medicinesList) {
    let score = 0;
    const matchedSymptomsSet = new Set<string>();
    const reasons: string[] = [];

    const medSymptoms = (med.symptoms || "").toLowerCase().split(";").map((s: string) => s.trim());
    const brandLower = med.brandName.toLowerCase();
    const genericLower = med.genericName.toLowerCase();
    const descLower = (med.description || "").toLowerCase();
    const catLower = med.categoryName.toLowerCase();

    // 1. Direct Brand or Generic exact match in query (100% or 95%)
    if (q.includes(brandLower)) {
      score += 85;
      reasons.push(`Direct brand match for "${med.brandName}"`);
      matchedSymptomsSet.add(med.brandName);
    }
    if (q.includes(genericLower)) {
      score += 75;
      reasons.push(`Direct generic salt formula match ("${med.genericName}")`);
      matchedSymptomsSet.add(med.genericName);
    }

    // 2. Symptom tokens comparison
    for (const symptom of medSymptoms) {
      if (!symptom) continue;

      // Exact symptom phrase in query
      if (q.includes(symptom)) {
        score += 35;
        matchedSymptomsSet.add(symptom);
        reasons.push(`Indicated for ${symptom}`);
        continue;
      }

      // Check clinical synonym ontology
      for (const [canonical, synonyms] of Object.entries(clinicalOntology)) {
        const matchesCanonical = symptom.includes(canonical);
        const queryHasCanonicalOrSynonym =
          q.includes(canonical) || synonyms.some((syn) => q.includes(syn));

        if (matchesCanonical && queryHasCanonicalOrSynonym) {
          score += 25;
          matchedSymptomsSet.add(symptom);
          const matchedSynonym = synonyms.find((s) => q.includes(s)) || canonical;
          reasons.push(`Treats ${canonical} (${matchedSynonym})`);
          break;
        }
      }
    }

    // 3. Token-level overlap with description, category, and symptoms
    for (const token of queryTokens) {
      if (brandLower.includes(token)) score += 15;
      if (genericLower.includes(token)) score += 15;
      if (descLower.includes(token)) score += 8;
      if (catLower.includes(token)) score += 10;
    }

    // Cap and normalize score
    const finalScore = Math.min(99, Math.max(0, score));

    if (finalScore >= 30) {
      const stock = Number(med.totalStock);
      const uniqueReasons = Array.from(new Set(reasons));
      const reasonText = uniqueReasons.length > 0
        ? uniqueReasons.slice(0, 2).join(" • ")
        : `Clinically indicated for matching symptoms`;

      scoredResults.push({
        id: med.id,
        brandName: med.brandName,
        genericName: med.genericName,
        categoryName: med.categoryName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        manufacturer: med.manufacturer,
        barcode: med.barcode,
        baseSellingPrice: parseFloat(med.baseSellingPrice),
        totalStock: stock,
        batchCount: Number(med.batchCount),
        inStock: stock > 0,
        reorderLevel: med.reorderLevel,
        isLowStock: stock <= med.reorderLevel,
        similarityScore: finalScore,
        matchReasoning: reasonText,
        matchedSymptoms: Array.from(matchedSymptomsSet),
        description: med.description,
      });
    }
  }

  scoredResults.sort((a, b) => b.similarityScore - a.similarityScore);
  return scoredResults;
}
