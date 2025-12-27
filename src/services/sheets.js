import fs from "fs";
import { google } from "googleapis";
import config from "../../config/config.js";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Must match your sheet schema order exactly
export const COLS = [
    "mcq_id",
    "status",
    "created_at",
    "updated_at",
    "stem_text",
    "stem_image_key",
    "stem_video_url",
    "option_a_text",
    "option_a_image_key",
    "option_b_text",
    "option_b_image_key",
    "option_c_text",
    "option_c_image_key",
    "option_d_text",
    "option_d_image_key",
    "correct_option",
    "explanation_text",
    "explanation_image_key",
    "key_learning_point",
    "author",
    "commit_hash",
    "published_batch",
    "is_latest",
];

function loadServiceAccount() {
    if (config.googleServiceAccountJson) {
        return JSON.parse(config.googleServiceAccountJson);
    }
    if (config.googleServiceAccountJsonPath) {
        return JSON.parse(fs.readFileSync(config.googleServiceAccountJsonPath, "utf8"));
    }
    throw new Error("No service account JSON provided.");
}

export async function getSheetsClient() {
    const sa = loadServiceAccount();
    const auth = new google.auth.JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: SCOPES,
    });
    return google.sheets({ version: "v4", auth });
}

function toA1Column(n) {
    let s = "";
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

export function rowToObject(row) {
    const obj = {};
    for (let i = 0; i < COLS.length; i++) obj[COLS[i]] = row[i] ?? "";
    return obj;
}

export async function appendMcqRow(valuesInOrder) {
    const sheets = await getSheetsClient();
    const range = `${config.googleSheetTab}!A:Z`;

    return sheets.spreadsheets.values.append({
        spreadsheetId: config.googleSheetId,
        range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [valuesInOrder] },
    });
}

export async function readAllSheetRows() {
    const sheets = await getSheetsClient();
    const rangeAll = `${config.googleSheetTab}!A:W`; // 23 cols
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheetId,
        range: rangeAll,
        valueRenderOption: "UNFORMATTED_VALUE",
    });

    const values = res.data.values || [];
    return values; // includes header row at [0]
}

/**
 * OPTION 1 invariant:
 * One mcq_id must appear exactly once in the sheet.
 */
export async function findSingleRowByMcqId(mcq_id) {
    const values = await readAllSheetRows();
    if (values.length < 2) return null;

    // Validate header matches COLS (optional but recommended)
    const header = (values[0] || []).map((h) => String(h ?? "").trim());
    if (header.length === COLS.length) {
        for (let i = 0; i < COLS.length; i++) {
            if (header[i] !== COLS[i]) {
                throw new Error(`Header mismatch at col ${i + 1}. Expected "${COLS[i]}", got "${header[i]}"`);
            }
        }
    }

    const matches = [];
    for (let i = 1; i < values.length; i++) {
        const row = values[i] || [];
        if (String(row[0] ?? "").trim() === mcq_id) {
            matches.push({ rowNumber: i + 1, row });
        }
    }

    if (matches.length === 0) return null;
    if (matches.length > 1) throw new Error(`Sheet corruption: mcq_id "${mcq_id}" appears ${matches.length} times`);
    return matches[0];
}

export async function setCell(rowNumber, colName, value) {
    const colIdx = COLS.indexOf(colName);
    if (colIdx === -1) throw new Error(`Unknown column: ${colName}`);

    const colLetter = toA1Column(colIdx + 1);
    const range = `${config.googleSheetTab}!${colLetter}${rowNumber}`;

    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.update({
        spreadsheetId: config.googleSheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [[value]] },
    });
}

export async function updateFullRow(rowNumber, rowValues) {
    // rowValues must be an array length = COLS.length
    if (!Array.isArray(rowValues) || rowValues.length !== COLS.length) {
        throw new Error(`updateFullRow requires an array of length ${COLS.length}`);
    }

    const range = `${config.googleSheetTab}!A${rowNumber}:W${rowNumber}`;
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.update({
        spreadsheetId: config.googleSheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [rowValues] },
    });
}

export function nowIso() {
    return new Date().toISOString();
}
