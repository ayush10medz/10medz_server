import { OpenAI } from "openai";
import { ErrorHandler, TryCatch } from "../utility/utility.js";
import { findInventoryMatch } from "../utility/smartdata.js";

export const fetchSmartData = TryCatch(async (req, res, next) => {
    const file = req.file;

    if (!file) {
        return next(new ErrorHandler("No file provided", 400));
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
        return next(new ErrorHandler("Invalid file type. Please upload a JPEG or PNG image.", 400));
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return next(new ErrorHandler("File size too large. Maximum size is 5MB.", 400));
    }

    // Convert file to base64
    const base64Image = file.buffer.toString('base64');
    const cleanedBase64Image = base64Image.replace(/^data:image\/\w+;base64,/, "");

    // Initialize OpenAI
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Call OpenAI API
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `You are a medical assistant. Extract a complete list of all items from the handwritten Indian prescription image, including both medicines and medical consumables. Do not omit surgical or orthopedic supplies.

❌ Exclude all medical tests or investigations such as:
- CBC (Complete Blood Count)
- LFT (Liver Function Test)
- RFT (Renal Function Test)
- CRP (C-Reactive Protein)
- Any blood tests, diagnostic tests, or scans

✅ Only return a JSON object with the following structure:

{
  "Doctor Name": "<doctor's name or null>",
  "Medicines": [
    {
      "Medicine Name": "<name>",
      "Dosage": "<dosage or null>",
      "Frequency": "<frequency or null>",
      "Quantity": "<quantity or null>"
    },
    ...
  ]
}

Only include medicines and medical consumables (e.g., surgical dressings, orthopedic supports). Do not include any tests or investigations. Do not include explanations. Do not use markdown. Return ONLY valid JSON.`
            },
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${cleanedBase64Image}`,
                        },
                    },
                ],
            },
        ],
        max_tokens: 2000,
        temperature: 0,
        store: false
    });

    const rawText = response?.choices?.[0]?.message?.content;
    console.log("🧾 GPT Raw Output:\n", rawText);

    if (!rawText) {
        return next(new ErrorHandler("Failed to process image. Please try again.", 500));
    }

    // Clean JSON string
    const cleaned = rawText.replace(/```json|```/g, '').trim() || "";

    // Parse GPT result JSON object
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (error) {
        console.error("Error parsing GPT response:", error);
        return next(new ErrorHandler("Failed to parse AI response. Please try again.", 500));
    }

    const doctorName = parsed["Doctor Name"] || null;
    const medicines = parsed["Medicines"] || [];

    // Merge with fuzzy-matched price and inventory data
    const results = medicines.map((med) => {
        const label = med["Medicine Name"] || med["name"] || null;
        const dosage = med["Dosage"] || med["dosage"] || null;
        const frequency = med["Frequency"] || med["frequency"] || null;
        const quantity = med["Quantity"] || med["quantity"] || 1;

        // Fuzzy matching
        const inventoryMatch = findInventoryMatch(label || "");
        const availableInStock = !!inventoryMatch;

        // --- Only use inventoryJson price/discount, never from matched ---
        const price = inventoryMatch && inventoryMatch.price !== undefined
            ? inventoryMatch.price
            : "N/A";
        const discount = inventoryMatch && inventoryMatch.discount !== undefined
            ? inventoryMatch.discount
            : "N/A";
        const netPrice =
            price !== "N/A" && discount !== "N/A"
                ? (price - ((price * discount) / 100)).toFixed(2)
                : "N/A";

        return {
            label,
            dosage,
            frequency,
            quantity,
            availableInStock,
            price,
            discount,
            netPrice,
        };
    });

    console.log("🧾 Final Results:\n", results);
    return res.status(200).json({
        success: true,
        data: {
            doctorName,
            medicines: results,
        }
    });
}); 