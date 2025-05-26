import Fuse from "fuse.js";
import { allMedicinesArray, inventoryJson } from "../constant/newInventory.js";

// 1. Normalize text for fuzzy searching
export function normalize(text) {
    return (text || "")
        .replace(/tab|caps?|capsule|tablet|syrup|injection/gi, "") // Remove suffixes
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// Commented out allMedicinesFuse logic as requested
// const allMedicinesFuse = new Fuse(allMedicinesArray, {
//     includeScore: true,
//     threshold: 0.3, // Adjust threshold as needed for name matching
// });

// 2. Prepare searchable (normalized) fields for inventoryJson
const updatedInventoryJson = inventoryJson.map(inv => ({
    ...inv,
    normalizedLabel: normalize(inv.label),
    normalizedSalt: inv.salt ? normalize(inv.salt) : "",
    normalizedCategory: inv.category ? normalize(inv.category) : "",
}));

// 3. Fuse.js config for fuzzy searching inventoryJson
const inventoryFuse = new Fuse(updatedInventoryJson, {
    keys: [
        { name: "normalizedLabel", weight: 3 }, // Increased weight for label matches
        { name: "normalizedSalt", weight: 1 },
        { name: "normalizedCategory", weight: 0.5 }
    ],
    includeScore: true,
    threshold: 0.2, // Even lower threshold for more precise matching
    minMatchCharLength: 4, // Increased minimum match length
    shouldSort: true,
    findAllMatches: false,
    location: 0,
    distance: 50, // Reduced distance for tighter matching
    ignoreLocation: false, // Ensure location matters
    useExtendedSearch: false,
    tokenize: true, // Enable tokenization for better word matching
    matchAllTokens: true, // Require all tokens to match
    includeMatches: true // Include match details for better debugging
});

// 4. Find the best inventory match
export function findInventoryMatch(medicineName) {
    const normName = normalize(medicineName);
    let finalSearchName = normName;

    // Strong (exact) match in inventory
    let exact = updatedInventoryJson.find(item =>
        finalSearchName === item.normalizedLabel ||
        finalSearchName === item.normalizedSalt ||
        finalSearchName === item.normalizedCategory
    );
    if (exact) return exact;

    // Partial/substring match in inventory
    for (const item of updatedInventoryJson) {
        if (
            finalSearchName && (
                item.normalizedLabel.includes(finalSearchName) ||
                finalSearchName.includes(item.normalizedLabel) ||
                (item.normalizedSalt && (
                    item.normalizedSalt.includes(finalSearchName) ||
                    finalSearchName.includes(item.normalizedSalt)
                )) ||
                (item.normalizedCategory && (
                    item.normalizedCategory.includes(finalSearchName) ||
                    finalSearchName.includes(item.normalizedCategory)
                ))
            )
        ) {
            return item;
        }
    }

    // Fuzzy fallback using inventoryFuse with stricter matching
    const result = inventoryFuse.search(finalSearchName);

    // Only return if the match score is very good
    return result.length > 0 && result[0].score < 0.2 ? result[0].item : null;
}
