/* eslint-disable */
import { pgQuery } from "../infra/pg.js";

function pad6(n) {
    return String(n).padStart(6, "0");
}

export async function allocateMcqId() {
    const res = await pgQuery(`SELECT nextval('mcq_seq')::int AS n`, []);
    const n = res.rows?.[0]?.n;
    if (!n) throw new Error("Failed to allocate mcq_seq");
    return { mcq_num: n, mcq_id: `NEURO_${pad6(n)}` };
}

export function isIncrementalMcqId(id) {
    return /^NEURO_\d{6}$/.test(String(id || "").trim());
}
