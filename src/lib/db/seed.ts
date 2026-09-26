/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb, schema } from "./index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const db = await getDb();
  console.log("Seeding database with realistic Pakistani pharmacy dataset...");

  // 1. Roles
  const existingRoles = await db.select().from(schema.roles);
  let ownerRoleId = existingRoles.find((r: any) => r.name === "OWNER")?.id;
  let staffRoleId = existingRoles.find((r: any) => r.name === "STAFF")?.id;

  if (!ownerRoleId || !staffRoleId) {
    const [ownerR] = await db
      .insert(schema.roles)
      .values({
        id: "role-owner-001",
        name: "OWNER",
        description: "Full access to inventory, POS, reports, AI workflow approvals, and system settings",
      })
      .returning();
    const [staffR] = await db
      .insert(schema.roles)
      .values({
        id: "role-staff-002",
        name: "STAFF",
        description: "Counter POS, sales processing, item lookup, and standard returns",
      })
      .returning();
    ownerRoleId = ownerR.id;
    staffRoleId = staffR.id;
  }

  // 2. Demo Users
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const existingUsers = await db.select().from(schema.users);
  let ownerUserId = existingUsers.find((u: any) => u.email === "owner@sehatstock.pk")?.id;
  let staffUserId = existingUsers.find((u: any) => u.email === "staff@sehatstock.pk")?.id;

  if (!ownerUserId) {
    const [ownerU] = await db
      .insert(schema.users)
      .values({
        id: "user-owner-001",
        name: "Dr. Hamza Malik",
        email: "owner@sehatstock.pk",
        passwordHash,
        roleId: ownerRoleId,
        status: "ACTIVE",
      })
      .returning();
    ownerUserId = ownerU.id;
  }

  if (!staffUserId) {
    const [staffU] = await db
      .insert(schema.users)
      .values({
        id: "user-staff-002",
        name: "Ayesha Tariq",
        email: "staff@sehatstock.pk",
        passwordHash,
        roleId: staffRoleId,
        status: "ACTIVE",
      })
      .returning();
    staffUserId = staffU.id;
  }

  // 3. Settings
  const defaultSettings = [
    { key: "staff_max_discount_percent", value: "3.0", description: "Maximum discount % cashier can give without owner approval" },
    { key: "pharmacy_branch_name", value: "Central Health Pharmacy (Branch #1)", description: "Physical store title on receipts" },
    { key: "pharmacy_phone", value: "+92 300 1234567", description: "Store hotline" },
    { key: "pharmacy_address", value: "Shop 14-16, Commercial Avenue, Phase 5, DHA, Lahore", description: "Counter physical location" },
    { key: "fefo_rotation_enabled", value: "true", description: "Enforce First Expiry First Out stock allocation" },
  ];
  for (const s of defaultSettings) {
    try {
      await db.insert(schema.settings).values(s).onConflictDoNothing();
    } catch {}
  }

  // 4. Categories
  const categoryDefs = [
    { id: "cat-analgesics", name: "Analgesics & Antipyretics", slug: "analgesics", description: "Pain relief, fever reducers, anti-inflammatory medications" },
    { id: "cat-antibiotics", name: "Antibiotics & Antimicrobials", slug: "antibiotics", description: "Bacterial infection treatments and systemic anti-infectives" },
    { id: "cat-gastro", name: "Gastroenterology & Antacids", slug: "gastroenterology", description: "Proton pump inhibitors, acidity, ulcer treatments" },
    { id: "cat-respiratory", name: "Respiratory & Anti-Allergy", slug: "respiratory", description: "Antihistamines, cough syrups, bronchodilators, inhalers" },
    { id: "cat-cardio", name: "Cardiovascular & Hypertension", slug: "cardiovascular", description: "Blood pressure and heart regulation drugs" },
    { id: "cat-diabetes", name: "Endocrinology & Diabetes", slug: "diabetes", description: "Oral hypoglycemics and glucose management" },
  ];
  for (const c of categoryDefs) {
    try {
      await db.insert(schema.categories).values(c).onConflictDoNothing();
    } catch {}
  }

  // 5. Suppliers
  const supplierDefs = [
    { id: "sup-gsk", companyName: "GlaxoSmithKline Pakistan (GSK)", contactPerson: "Tariq Mehmood", phone: "+92 21 111 475 757", email: "orders@gsk.com.pk", address: "Dockyard Road, West Wharf, Karachi", ntn: "0711902-3" },
    { id: "sup-getz", companyName: "Getz Pharma Pakistan", contactPerson: "Nabeel Raza", phone: "+92 21 386 211 11", email: "distribution@getzpharma.com", address: "29-30/27, K.I.A, Karachi", ntn: "1428905-1" },
    { id: "sup-abbott", companyName: "Abbott Laboratories Pakistan", contactPerson: "Kamran Siddiqui", phone: "+92 21 350 697 46", email: "pk.orders@abbott.com", address: "Landhi Industrial Area, Karachi", ntn: "0710123-5" },
    { id: "sup-searle", companyName: "The Searle Company Limited", contactPerson: "Zubair Hashmi", phone: "+92 21 350 546 96", email: "sales@searlecompany.com", address: "F-208, SITE, Karachi", ntn: "0658493-8" },
    { id: "sup-obs", companyName: "OBS Pakistan (Pvt) Ltd", contactPerson: "Faisal Latif", phone: "+92 21 350 714 50", email: "supply@obs.com.pk", address: "Plot 39, Sector 24, Korangi, Karachi", ntn: "2837190-4" },
  ];
  for (const s of supplierDefs) {
    try {
      await db.insert(schema.suppliers).values(s).onConflictDoNothing();
    } catch {}
  }

  // 6. Realistic Medicines
  const medicineDefs = [
    {
      id: "med-panadol-500",
      brandName: "Panadol",
      genericName: "Paracetamol",
      categoryId: "cat-analgesics",
      strength: "500mg",
      dosageForm: "Tablet",
      manufacturer: "GlaxoSmithKline (GSK)",
      barcode: "8964000120012",
      basePurchasePrice: "2.80",
      baseSellingPrice: "3.50",
      reorderLevel: 50,
      description: "Fast relief of fever, headache, body ache, toothache, and mild discomfort.",
      symptoms: "fever;headache;body pain;joint pain;mild ache;temperature",
    },
    {
      id: "med-augmentin-625",
      brandName: "Augmentin",
      genericName: "Amoxicillin + Clavulanic Acid",
      categoryId: "cat-antibiotics",
      strength: "625mg",
      dosageForm: "Tablet",
      manufacturer: "GlaxoSmithKline (GSK)",
      barcode: "8964000120029",
      basePurchasePrice: "22.50",
      baseSellingPrice: "28.00",
      reorderLevel: 25,
      description: "Broad-spectrum antibacterial for respiratory, ENT, urinary, and dental bacterial infections.",
      symptoms: "throat infection;bacterial infection;tonsillitis;ear pain;sinusitis;chest infection;pneumonia",
    },
    {
      id: "med-risek-20",
      brandName: "Risek",
      genericName: "Omeprazole",
      categoryId: "cat-gastro",
      strength: "20mg",
      dosageForm: "Capsule",
      manufacturer: "Getz Pharma",
      barcode: "8964000120036",
      basePurchasePrice: "18.00",
      baseSellingPrice: "24.00",
      reorderLevel: 30,
      description: "Proton pump inhibitor (PPI) for gastric acidity, GERD, and heartburn prevention.",
      symptoms: "heartburn;stomach acidity;GERD;burning chest;gastric ulcer;indigestion",
    },
    {
      id: "med-brufen-400",
      brandName: "Brufen",
      genericName: "Ibuprofen",
      categoryId: "cat-analgesics",
      strength: "400mg",
      dosageForm: "Tablet",
      manufacturer: "Abbott Laboratories",
      barcode: "8964000120043",
      basePurchasePrice: "3.50",
      baseSellingPrice: "4.80",
      reorderLevel: 40,
      description: "Non-steroidal anti-inflammatory drug (NSAID) for inflammation, muscular strain, arthritis.",
      symptoms: "swelling;inflammation;severe pain;muscle ache;back pain;sprain;arthritis",
    },
    {
      id: "med-softin-10",
      brandName: "Softin",
      genericName: "Loratadine",
      categoryId: "cat-respiratory",
      strength: "10mg",
      dosageForm: "Tablet",
      manufacturer: "The Searle Company",
      barcode: "8964000120050",
      basePurchasePrice: "9.00",
      baseSellingPrice: "13.00",
      reorderLevel: 20,
      description: "Non-drowsy 24-hour antihistamine for seasonal allergic rhinitis, sneezing, and skin hives.",
      symptoms: "allergy;sneezing;runny nose;watery eyes;itching;skin allergy;hives",
    },
    {
      id: "med-disprin-300",
      brandName: "Disprin",
      genericName: "Aspirin (Acetylsalicylic Acid)",
      categoryId: "cat-analgesics",
      strength: "300mg",
      dosageForm: "Soluble Tablet",
      manufacturer: "Reckitt Benckiser",
      barcode: "8964000120067",
      basePurchasePrice: "2.10",
      baseSellingPrice: "3.00",
      reorderLevel: 60,
      description: "Fast-acting soluble analgesic and antipyretic for migraine, vascular headache, and mild pain.",
      symptoms: "headache;migraine;pain;fever",
    },
    {
      id: "med-flagyl-400",
      brandName: "Flagyl",
      genericName: "Metronidazole",
      categoryId: "cat-antibiotics",
      strength: "400mg",
      dosageForm: "Tablet",
      manufacturer: "Sanofi-Aventis",
      barcode: "8964000120074",
      basePurchasePrice: "4.50",
      baseSellingPrice: "6.20",
      reorderLevel: 35,
      description: "Antiprotozoal and antibacterial for amoebiasis, loose motions, dental infections, and giardiasis.",
      symptoms: "diarrhea;stomach cramps;loose motions;food poisoning;amoebic dysentery",
    },
    {
      id: "med-arinac-forte",
      brandName: "Arinac Forte",
      genericName: "Ibuprofen + Pseudoephedrine",
      categoryId: "cat-respiratory",
      strength: "400mg + 60mg",
      dosageForm: "Tablet",
      manufacturer: "Abbott Laboratories",
      barcode: "8964000120081",
      basePurchasePrice: "8.50",
      baseSellingPrice: "11.50",
      reorderLevel: 25,
      description: "Dual action decongestant and analgesic for severe flu, nasal blockage, and body chills.",
      symptoms: "severe cold;flu;nasal congestion;blocked nose;sinus headache;fever and chills",
    },
    {
      id: "med-ventolin-inhaler",
      brandName: "Ventolin Inhaler",
      genericName: "Salbutamol",
      categoryId: "cat-respiratory",
      strength: "100mcg/dose",
      dosageForm: "Inhaler",
      manufacturer: "GlaxoSmithKline (GSK)",
      barcode: "8964000120098",
      basePurchasePrice: "320.00",
      baseSellingPrice: "395.00",
      reorderLevel: 10,
      description: "Short-acting beta-2 agonist bronchodilator for rapid relief of asthma attacks and wheezing.",
      symptoms: "asthma;wheezing;breathlessness;shortness of breath;chest tightness;bronchospasm",
    },
    {
      id: "med-glucophage-500",
      brandName: "Glucophage",
      genericName: "Metformin Hydrochloride",
      categoryId: "cat-diabetes",
      strength: "500mg",
      dosageForm: "Tablet",
      manufacturer: "OBS Pakistan",
      barcode: "8964000120104",
      basePurchasePrice: "4.80",
      baseSellingPrice: "6.80",
      reorderLevel: 40,
      description: "First-line oral biguanide antihyperglycemic agent for Type 2 Diabetes Mellitus control.",
      symptoms: "diabetes;high blood sugar;glucose control;type 2 diabetes",
    },
  ];

  for (const m of medicineDefs) {
    try {
      await db.insert(schema.medicines).values(m).onConflictDoNothing();
    } catch {}
  }

  // 7. Medicine Batches (Carefully chosen for FEFO & Low Stock Demonstration)
  const batchDefs = [
    // Panadol 500mg: CRITICAL LOW STOCK (12 units left, reorder level 50) -> Triggers AI Restock!
    {
      id: "batch-pan-01",
      medicineId: "med-panadol-500",
      batchNumber: "PAN-24A",
      expiryDate: new Date("2027-08-15"),
      purchasePrice: "2.80",
      sellingPrice: "3.50",
      quantity: 12,
      supplierId: "sup-gsk",
    },
    // Augmentin 625mg: LOW STOCK (8 packs left, reorder 25) AND NEAR EXPIRY!
    {
      id: "batch-aug-01",
      medicineId: "med-augmentin-625",
      batchNumber: "AUG-24C",
      expiryDate: new Date("2026-10-25"), // Expiring in ~1 month
      purchasePrice: "22.50",
      sellingPrice: "28.00",
      quantity: 8,
      supplierId: "sup-gsk",
    },
    // Risek 20mg: Healthy stock
    {
      id: "batch-rsk-01",
      medicineId: "med-risek-20",
      batchNumber: "RSK-25B",
      expiryDate: new Date("2028-02-10"),
      purchasePrice: "18.00",
      sellingPrice: "24.00",
      quantity: 160,
      supplierId: "sup-getz",
    },
    // Brufen 400mg: Healthy stock
    {
      id: "batch-brf-01",
      medicineId: "med-brufen-400",
      batchNumber: "BRF-25A",
      expiryDate: new Date("2027-11-20"),
      purchasePrice: "3.50",
      sellingPrice: "4.80",
      quantity: 210,
      supplierId: "sup-abbott",
    },
    // Softin 10mg: Near Expiry batch (14 units)
    {
      id: "batch-sft-01",
      medicineId: "med-softin-10",
      batchNumber: "SFT-24D",
      expiryDate: new Date("2026-10-18"), // Near expiry
      purchasePrice: "9.00",
      sellingPrice: "13.00",
      quantity: 14,
      supplierId: "sup-searle",
    },
    // Disprin 300mg: Healthy stock
    {
      id: "batch-dsp-01",
      medicineId: "med-disprin-300",
      batchNumber: "DSP-25C",
      expiryDate: new Date("2028-04-30"),
      purchasePrice: "2.10",
      sellingPrice: "3.00",
      quantity: 320,
      supplierId: "sup-gsk",
    },
    // Flagyl 400mg
    {
      id: "batch-flg-01",
      medicineId: "med-flagyl-400",
      batchNumber: "FLG-25A",
      expiryDate: new Date("2027-06-15"),
      purchasePrice: "4.50",
      sellingPrice: "6.20",
      quantity: 95,
      supplierId: "sup-searle",
    },
    // Arinac Forte
    {
      id: "batch-arn-01",
      medicineId: "med-arinac-forte",
      batchNumber: "ARN-25B",
      expiryDate: new Date("2027-12-10"),
      purchasePrice: "8.50",
      sellingPrice: "11.50",
      quantity: 120,
      supplierId: "sup-abbott",
    },
    // Ventolin Inhaler
    {
      id: "batch-ven-01",
      medicineId: "med-ventolin-inhaler",
      batchNumber: "VEN-24K",
      expiryDate: new Date("2027-09-05"),
      purchasePrice: "320.00",
      sellingPrice: "395.00",
      quantity: 18,
      supplierId: "sup-gsk",
    },
    // Glucophage 500mg
    {
      id: "batch-glc-01",
      medicineId: "med-glucophage-500",
      batchNumber: "GLC-25H",
      expiryDate: new Date("2028-03-25"),
      purchasePrice: "4.80",
      sellingPrice: "6.80",
      quantity: 240,
      supplierId: "sup-obs",
    },
  ];

  for (const b of batchDefs) {
    try {
      await db.insert(schema.medicineBatches).values(b).onConflictDoNothing();
    } catch {}
  }

  // 8. Demo Completed Sale for Return Demonstration (INV-2026-080)
  const existingDemoSale = await db.select().from(schema.sales).where(eq(schema.sales.id, "sale-demo-return-080"));
  if (existingDemoSale.length === 0) {
    await db.insert(schema.sales).values({
      id: "sale-demo-return-080",
      invoiceNo: "INV-2026-080",
      cashierId: staffUserId,
      subtotal: "140.00",
      discountPercent: "0.00",
      discountAmount: "0.00",
      totalAmount: "140.00",
      customerName: "Mohammad Usman",
      customerPhone: "+92 321 4455667",
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24), // 1 day ago
    });

    await db.insert(schema.saleItems).values({
      id: "sitem-080-1",
      saleId: "sale-demo-return-080",
      medicineId: "med-augmentin-625",
      batchId: "batch-aug-01",
      quantity: 5, // 5 tablets @ Rs. 28 = Rs. 140
      unitPrice: "28.00",
      totalPrice: "140.00",
      returnedQuantity: 0,
    });

    await db.insert(schema.invoices).values({
      id: "inv-demo-080",
      invoiceNumber: "INV-2026-080",
      saleId: "sale-demo-return-080",
      customerName: "Mohammad Usman",
      customerPhone: "+92 321 4455667",
      subtotal: "140.00",
      discountAmount: "0.00",
      taxAmount: "0.00",
      netAmount: "140.00",
      paymentMethod: "CASH",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    });

    await db.insert(schema.payments).values({
      id: "pay-demo-080",
      saleId: "sale-demo-return-080",
      paymentMethod: "CASH",
      amount: "140.00",
      status: "PAID",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    });
  }

  // 9. Demo AI Restock Automation Records
  const existingAuto = await db.select().from(schema.restockAutomations);
  if (existingAuto.length === 0) {
    await db.insert(schema.restockAutomations).values([
      {
        id: "auto-panadol-01",
        medicineId: "med-panadol-500",
        currentStock: 12,
        reorderLevel: 50,
        salesVelocity30d: 260,
        recommendedOrderQty: 200,
        supplierId: "sup-gsk",
        status: "PENDING_APPROVAL",
        reasoning: "Stock is 12 units (below threshold of 50). Average daily counter velocity is 8.6 units. Remaining inventory will deplete in ~1.4 days. Recommended replenishment: 200 units from authorized distributor GSK.",
      },
      {
        id: "auto-augmentin-02",
        medicineId: "med-augmentin-625",
        currentStock: 8,
        reorderLevel: 25,
        salesVelocity30d: 65,
        recommendedOrderQty: 50,
        supplierId: "sup-gsk",
        status: "DRAFT_CREATED",
        reasoning: "Stock is 8 packs (below threshold of 25). Active batch also expires in <30 days. Recommended inward batch replenishment: 50 packs.",
      },
    ]);
  }

  console.log("Database seeded successfully with authentic Pakistani pharmacy data!");
}
