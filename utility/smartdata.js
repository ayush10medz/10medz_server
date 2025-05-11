import Fuse from "fuse.js";
import { inventoryJson } from "../constant/newInventory.js";

// 1. Normalize text for fuzzy searching
export function normalize(text) {
    return (text || "")
        .replace(/tab|caps?|capsule|tablet|syrup|injection/gi, "") // Remove suffixes
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// 2. Prepare searchable (normalized) fields
const updatedInventoryJson = inventoryJson.map(inv => ({
    ...inv,
    normalizedLabel: normalize(inv.label),
    normalizedSalt: inv.salt ? normalize(inv.salt) : "",
    normalizedCategory: inv.category ? normalize(inv.category) : "",
}));

// 3. Fuse.js config for fuzzy searching
const inventoryFuse = new Fuse(updatedInventoryJson, {
    keys: ["normalizedLabel", "normalizedSalt", "normalizedCategory"],
    includeScore: true,
    threshold: 0.4,
});

// 4. Find the best inventory match
export function findInventoryMatch(medicineName) {
    const normName = normalize(medicineName);

    // Strong (exact) match
    let exact = updatedInventoryJson.find(item =>
        normName === item.normalizedLabel ||
        normName === item.normalizedSalt ||
        normName === item.normalizedCategory
    );
    if (exact) return exact;

    // Partial/substring match
    for (const item of updatedInventoryJson) {
        if (
            normName && (
                item.normalizedLabel.includes(normName) ||
                normName.includes(item.normalizedLabel) ||
                (item.normalizedSalt && (
                    item.normalizedSalt.includes(normName) ||
                    normName.includes(item.normalizedSalt)
                )) ||
                (item.normalizedCategory && (
                    item.normalizedCategory.includes(normName) ||
                    normName.includes(item.normalizedCategory)
                ))
            )
        ) {
            return item;
        }
    }
    // Fuzzy fallback
    const result = inventoryFuse.search(normName);
    return result.length > 0 ? result[0].item : null;
} 