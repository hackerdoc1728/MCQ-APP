/* =========================================================
   NeuroMCQ Admin – Final Admin JS (NO DRAFT, Always READY)
   - Create always sends status="ready"
   - No UI/status field needed
   - Batch publish sends confirm when dryRun=false
   - Public list + Fetch one normalize payload_json
   ========================================================= */
//* global window, document, localStorage, navigator, alert, console, fetch */

(() => {
    "use strict";

    /* ------------------ Helpers ------------------ */

    const $ = (id) => document.getElementById(id);

    function on(id, evt, fn) {
        const el = $(id);
        if (!el) return; // don't crash if HTML changes
        el.addEventListener(evt, fn);
    }

    function pretty(obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    }

    function escapeHtml(s = "") {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function setText(id, text) {
        const el = $(id);
        if (el) el.textContent = String(text ?? "");
    }

    function setBtnDisabled(id, disabled) {
        const el = $(id);
        if (el) el.disabled = !!disabled;
    }

    function readNum(id, fallback = 0) {
        const el = $(id);
        const v = Number(el?.value);
        return Number.isFinite(v) ? v : fallback;
    }

    function writeNum(id, n) {
        const el = $(id);
        if (!el) return;
        el.value = String(Math.max(0, Math.floor(Number(n) || 0)));
    }

    function setVal(id, val) {
        const el = $(id);
        if (!el) {
            console.warn(`Missing element #${id}`);
            return;
        }
        el.value = val;
    }

    function setPill(type, text) {
        const pill = $("connPill");
        if (!pill) return;
        pill.className = `pill pill--${type}`;
        pill.textContent = text;
    }

    /* ------------------ Config persistence ------------------ */

    function resolveApiBase() {
        // 1) hard override via admin.html
        const fromWindow = window.__ADMIN_CONFIG__?.apiBase;
        if (fromWindow && String(fromWindow).trim())
            return String(fromWindow).trim().replace(/\/+$/, "");

        // 2) input field
        const fromInput = $("apiBase")?.value;
        if (fromInput && String(fromInput).trim())
            return String(fromInput).trim().replace(/\/+$/, "");

        // 3) stored
        const fromStore = localStorage.getItem("nm_apiBase");
        if (fromStore && String(fromStore).trim())
            return String(fromStore).trim().replace(/\/+$/, "");

        // 4) default
        return "http://localhost:3000";
    }

    function getToken() {
        const raw = String($("token")?.value || "").trim();
        if (!raw) return "";
        return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
    }

    function saveCfg() {
        const apiBase = String($("apiBase")?.value || "").trim();
        const token = String($("token")?.value || "").trim();
        if ($("apiBase")) localStorage.setItem("nm_apiBase", apiBase);
        if ($("token")) localStorage.setItem("nm_adminToken", token);
    }

    function loadCfg() {
        if ($("apiBase")) $("apiBase").value = localStorage.getItem("nm_apiBase") || resolveApiBase();
        if ($("token")) $("token").value = localStorage.getItem("nm_adminToken") || "";
    }

    /* ------------------ Fetch wrapper ------------------ */

    async function request(path, { method = "GET", headers = {}, body = null, auth = false } = {}) {
        const base = resolveApiBase();
        const url = `${base}${path}`;

        const h = { ...headers };
        if (auth) {
            const tok = getToken();
            if (!tok) throw new Error("Admin token missing");
            h.Authorization = tok;
        }

        const res = await fetch(url, {
            method,
            headers: h,
            body,
            credentials: "include", // Cloudflare Access cookie/session
        });

        const txt = await res.text();
        let data = null;
        try {
            data = txt ? JSON.parse(txt) : null;
        } catch {
            data = txt;
        }

        if (!res.ok) {
            const msg =
                (data && (data.error || data.message)) ||
                (typeof data === "string" && data) ||
                `${res.status} ${res.statusText}`;
            throw new Error(msg);
        }

        return data;
    }

    /* ------------------ UI helpers ------------------ */

    function clearFiles() {
        [
            "stem_image",
            "option_a_image",
            "option_b_image",
            "option_c_image",
            "option_d_image",
            "explanation_image",
        ].forEach((id) => {
            const el = $(id);
            if (el) el.value = "";
        });
    }

    function setLastMcqId(id) {
        setText("lastMcqId", id || "-");
        setBtnDisabled("copyLastBtn", !id);

        // convenience: set publish/fetch fields
        if (id) {
            if ($("pubOneId")) $("pubOneId").value = id;
            if ($("pubFetchId")) $("pubFetchId").value = id;
        }
    }

    /* ------------------ Ping ------------------ */

    async function pingApi() {
        try {
            await request("/api/health");
            setPill("ok", "Connected");
        } catch (e) {
            console.error(e);
            setPill("err", "Offline");
        }
    }

    /* ------------------ Fill Demo ------------------ */

    function fillDemo() {
        setVal("author", "Dr Ilaiyabharathi T");

        setVal("stem_text", "What is the primary neurotransmitter in the basal ganglia?");
        setVal("stem_video_url", "");

        setVal("option_a_text", "Dopamine");
        setVal("option_b_text", "Acetylcholine");
        setVal("option_c_text", "GABA");
        setVal("option_d_text", "Glutamate");

        setVal("correct_option", "A");

        setVal("explanation_text", "Dopamine plays a central role in basal ganglia circuitry.");
        setVal("key_learning_point", "Basal ganglia = dopamine");
    }

    function clearForm() {
        setVal("author", "");
        setVal("stem_text", "");
        setVal("stem_video_url", "");
        setVal("option_a_text", "");
        setVal("option_b_text", "");
        setVal("option_c_text", "");
        setVal("option_d_text", "");
        setVal("correct_option", "A");
        setVal("explanation_text", "");
        setVal("key_learning_point", "");
        clearFiles();

        if ($("pubOneId")) $("pubOneId").value = "";
        if ($("pubFetchId")) $("pubFetchId").value = "";
        if ($("pubOffset")) $("pubOffset").value = "0";

        setLastMcqId("");
        setText("createOut", "Cleared.");
        setText("publishOut", "Cleared.");
        setText("publicOut", "Cleared.");
        if ($("listWrap")) $("listWrap").innerHTML = "";
    }

    /* ------------------ Create MCQ (ALWAYS READY) ------------------ */

    async function createMcq() {
        setText("createOut", "Creating…");

        const fd = new FormData();

        // 🔒 No draft anymore: always ready
        fd.append("status", "ready");

        [
            "author",
            "stem_text",
            "stem_video_url",
            "option_a_text",
            "option_b_text",
            "option_c_text",
            "option_d_text",
            "correct_option",
            "explanation_text",
            "key_learning_point",
        ].forEach((id) => fd.append(id, $(id)?.value || ""));

        [
            "stem_image",
            "option_a_image",
            "option_b_image",
            "option_c_image",
            "option_d_image",
            "explanation_image",
        ].forEach((id) => {
            const f = $(id)?.files?.[0];
            if (f) fd.append(id, f);
        });

        // If Cloudflare Access is sufficient, keep auth:false.
        const out = await request("/api/admin/mcq", {
            method: "POST",
            body: fd,
            auth: false,
        });

        setText("createOut", pretty(out));

        if (out?.mcq_id) setLastMcqId(out.mcq_id);
        saveCfg();
    }

    /* ------------------ Publish one ------------------ */

    async function publishOne() {
        const mcq_id = String($("pubOneId")?.value || "").trim();
        if (!mcq_id) return alert("Enter mcq_id");

        setText("publishOut", "Publishing…");

        const out = await request("/api/admin/mcq/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mcq_id }),
            auth: false,
        });

        setText("publishOut", pretty(out));
        saveCfg();
    }

    /* ------------------ Batch publish ------------------ */

    async function batchPublish() {
        const dryRun = ($("batchDryRun")?.value || "true") === "true";
        const limit = Math.min(Math.max(parseInt($("batchLimit")?.value || "20", 10), 1), 200);

        const payload = { limit, dryRun };

        if (!dryRun) {
            const confirm = String($("batchConfirm")?.value || "").trim();
            if (confirm !== "PUBLISH") {
                alert('Type "PUBLISH" to confirm');
                return;
            }
            payload.confirm = confirm;
        }

        setText("publishOut", "Running batch…");

        const out = await request("/api/admin/mcq/publish-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            auth: false,
        });

        setText("publishOut", pretty(out));
        saveCfg();
    }

    /* ------------------ Public list renderer ------------------ */

    function renderMcqCard(mcq) {
        const correct = String(mcq.correct_option || "").toUpperCase();
        const options = [
            ["A", mcq.option_a_text],
            ["B", mcq.option_b_text],
            ["C", mcq.option_c_text],
            ["D", mcq.option_d_text],
        ];

        return `
      <article class="mcqcard">
        <div class="mcqcard__top">
          <div class="mcqcard__id mono">${escapeHtml(mcq.mcq_id || "-")}</div>
          ${correct ? `<span class="pill pill--ok">Correct: ${escapeHtml(correct)}</span>` : ""}
        </div>

        <div class="mcqcard__section">
          <div class="mcqcard__label">Stem</div>
          <div>${escapeHtml(mcq.stem_text || "-")}</div>
        </div>

        <div class="mcqcard__opts">
          ${options
                .map(([k, v]) => {
                    const isCorrect = k === correct;
                    return `
                <div class="opt ${isCorrect ? "opt--correct" : ""}">
                  <div class="opt__k mono">${escapeHtml(k)}</div>
                  <div>${escapeHtml(v || "-")}</div>
                </div>
              `;
                })
                .join("")}
        </div>

        <div class="mcqcard__section">
          <div class="mcqcard__label">Explanation</div>
          <div>${escapeHtml(mcq.explanation_text || "-")}</div>
        </div>

        <details class="mcqcard__raw">
          <summary class="mono">Raw JSON</summary>
          <pre class="out">${escapeHtml(JSON.stringify(mcq, null, 2))}</pre>
        </details>
      </article>
    `;
    }

    function renderMcqList(items) {
        const wrap = $("listWrap");
        if (!wrap) return;
        wrap.innerHTML = (items || []).map(renderMcqCard).join("");
    }

    /* ------------------ Pagination ------------------ */

    let lastPageCount = 0;

    function syncPagerButtons() {
        const limit = Math.max(1, readNum("pubLimit", 20));
        const offset = Math.max(0, readNum("pubOffset", 0));

        setBtnDisabled("prevPageBtn", offset === 0);

        const noMore = lastPageCount < limit;
        setBtnDisabled("nextPageBtn", noMore);
    }

    async function refreshPublicList() {
        const limit = Math.max(1, readNum("pubLimit", 20));
        const offset = Math.max(0, readNum("pubOffset", 0));

        const out = await request(`/api/mcq?limit=${limit}&offset=${offset}`);

        // normalize items: sometimes API returns {payload_json:{...}}
        const items = (out?.items || []).map((x) => x?.payload_json ?? x);

        lastPageCount = items.length;
        renderMcqList(items);

        setText("publicOut", pretty(out));
        syncPagerButtons();
    }

    async function goPrevPage() {
        const limit = Math.max(1, readNum("pubLimit", 20));
        const offset = Math.max(0, readNum("pubOffset", 0));
        writeNum("pubOffset", Math.max(0, offset - limit));
        await refreshPublicList();
    }

    async function goNextPage() {
        const limit = Math.max(1, readNum("pubLimit", 20));
        const offset = Math.max(0, readNum("pubOffset", 0));
        writeNum("pubOffset", offset + limit);
        await refreshPublicList();
    }

    async function fetchOnePublic() {
        const id = String($("pubFetchId")?.value || "").trim();
        if (!id) return alert("Enter mcq_id");

        const res = await request(`/api/mcq/${encodeURIComponent(id)}`);

        // normalize Neon response shape
        const mcq = res?.mcq?.payload_json ?? res?.payload_json ?? res?.mcq ?? res;

        lastPageCount = 0;
        syncPagerButtons();

        renderMcqList([mcq]);
        setText("publicOut", pretty(res)); // keep full response visible
    }

    /* ------------------ Wire Events ------------------ */

    function wire() {
        // config
        on("saveCfgBtn", "click", () => {
            saveCfg();
            setPill("ok", "Saved");
            setTimeout(() => setPill("warn", "Not checked"), 900);
        });

        // buttons
        on("pingBtn", "click", () => pingApi().catch(() => { }));
        on("fillDemoBtn", "click", fillDemo);
        on("clearBtn", "click", clearForm);

        on("createBtn", "click", () => createMcq().catch((e) => alert(e.message)));
        on("publishOneBtn", "click", () => publishOne().catch((e) => alert(e.message)));
        on("batchBtn", "click", () => batchPublish().catch((e) => alert(e.message)));

        on("refreshListBtn", "click", () => refreshPublicList().catch((e) => alert(e.message)));
        on("prevPageBtn", "click", () => goPrevPage().catch((e) => alert(e.message)));
        on("nextPageBtn", "click", () => goNextPage().catch((e) => alert(e.message)));
        on("fetchOneBtn", "click", () => fetchOnePublic().catch((e) => alert(e.message)));

        on("pubLimit", "change", () => {
            writeNum("pubOffset", 0);
            refreshPublicList().catch((e) => alert(e.message));
        });

        on("copyLastBtn", "click", async () => {
            const id = String($("lastMcqId")?.textContent || "").trim();
            if (!id || id === "-") return;
            await navigator.clipboard.writeText(id);
            alert("Copied: " + id);
        });
    }

    /* ------------------ Init ------------------ */

    loadCfg();
    wire();
    syncPagerButtons();
    pingApi();
})();
