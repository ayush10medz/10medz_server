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

// Create a Fuse.js instance for allMedicinesArray (simple name matching)
const allMedicinesFuse = new Fuse(allMedicinesArray, {
    includeScore: true,
    threshold: 0.3, // Adjust threshold as needed for name matching
});

// 2. Prepare searchable (normalized) fields for inventoryJson
const updatedInventoryJson = inventoryJson.map(inv => ({
    ...inv,
    normalizedLabel: normalize(inv.label),
    normalizedSalt: inv.salt ? normalize(inv.salt) : "",
    normalizedCategory: inv.category ? normalize(inv.category) : "",
}));

// 3. Fuse.js config for fuzzy searching inventoryJson
const inventoryFuse = new Fuse(updatedInventoryJson, {
    keys: ["normalizedLabel", "normalizedSalt", "normalizedCategory"],
    includeScore: true,
    threshold: 0.4, // Keep a slightly higher threshold for detailed inventory matching
});

// 4. Find the best inventory match
export function findInventoryMatch(medicineName) {
    const normName = normalize(medicineName);

    // First, try to find a better candidate name from the comprehensive list
    const nameSearch = allMedicinesFuse.search(normName);
    let candidateName = normName;

    // If a good match is found in the allMedicinesArray, use that as the candidate name
    if (nameSearch.length > 0 && nameSearch[0].score < 0.2) { // Use a stricter score threshold for name matching
        candidateName = normalize(nameSearch[0].item);
    }

    // Now, use the candidate name to search the inventory
    let finalSearchName = candidateName;

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

    // Fuzzy fallback using inventoryFuse with the candidate name
    const result = inventoryFuse.search(finalSearchName);
    return result.length > 0 ? result[0].item : null;
}
