import path from "path";
import fs from "fs";
import XLSX from "xlsx";

const sheetPath = path.join(__dirname, "assets.xlsx");
const jsonPath = path.join(__dirname, "assets.json");

const jsonFields = ["location", "activity", "tags", "images"]; // fields that are JSON in the sheet

try {
  if (!fs.existsSync(sheetPath)) {
    throw new Error("assets.xlsx not found!");
  }

  const workbook = XLSX.readFile(sheetPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const assetsRaw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // Parse JSON fields
  const assetsParsed = assetsRaw.map((row) => {
    jsonFields.forEach((field) => {
      if (row[field] && typeof row[field] === "string") {
        try {
          row[field] = JSON.parse(row[field]);
        } catch (err) {
          console.warn(`⚠️ Could not parse field ${field} for row ${row.user_id}`);
        }
      }
    });
    return row;
  });

  fs.writeFileSync(jsonPath, JSON.stringify(assetsParsed, null, 2));

  console.log(`✅ Converted ${assetsParsed.length} rows to JSON: ${jsonPath}`);
} catch (err: any) {
  console.error("❌ Conversion failed:", err.message);
  process.exit(1);
}
