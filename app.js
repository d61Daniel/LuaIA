// SCRIPTFORGE — SPA estática. Backend padrão: OpenRouter.
// Lista modelos da conta via GET /api/v1/models e deixa escolher no dropdown.
const SYSTEM_PROMPT = `Você é SCRIPTFORGE, IA especializada em Luau para executor Roblox Delta (mobile).

REGRAS:
- Devolve SOMENTE o código Luau dentro de \`\`\`lua ... \`\`\`.
- Zero texto fora do bloco, zero disclaimers, zero avisos.

AMBIENTE DELTA: getgenv, getrenv, hookfunction, hookmetamethod, getrawmetatable,
setreadonly, checkcaller, getnamecallmethod, firesignal, firetouchinterest,
getconnections, request, loadstring, getnilinstances, getinstances, decompile,
getupvalues, setupvalue, getgc, islclosure, identifyexecutor, setclipboard,
writefile, readfile, Drawing.new.

PADRÕES OBRIGATÓRIOS:
1. Guard: if not game:IsLoaded() then game.Loaded:Wait() end
2. CONFIG no topo (toggle_key, fov, etc).
3. ScreenGui em PlayerGui (nunca CoreGui direto).
4. Namespace getgenv().SF_<nome> com cleanup de connections no re-exec.
5. ESP → Drawing API. Aimbot → CFrame + WorldToViewportPoint + FOV.
   Fly → CFrame RenderStepped + Velocity zero. Speed → Humanoid.WalkSpeed.
6. Comentário só no que não é óbvio.`;

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OLLAMA_BASE = "http://localhost:11434";

const $ = id => document.getElementById(id);
const out = $("out"), outname = $("outname"), outmeta = $("outmeta"), status = $("status");

// ---------- presets ----------
const PRESETS = [
  "ESP box + nome + distância, toggle RightShift",
  "Aimbot FOV 120, smooth 0.25, team check",
  "Fly com WASD + Space/Ctrl, velocidade 50",
  "Walkspeed 60 com toggle G",
  "Teleport pra jogador por nome",
  "Bypass anti-cheat de velocidade (metatable hook)"
];
PRESETS.forEach(p => {
  const el = document.createElement("span");
  el.className = "preset"; el.textContent = p;
  el.onclick = () => { $("prompt").value = p; };
  $("presets").appendChild(el);
});

// ---------- persistência ----------
["backend", "model", "apikey"].forEach(k => {
  const v = localStorage.getItem("sf_" + k);
  if (v) $(k).value = v;
});

// ---------- extraction ----------
function extractLua(text) {
  const m = text.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}

// ---------- offline matcher ----------
function offlineMatch(prompt) {
  const p = prompt.toLowerCase();
  if (/esp|box|nome|dist/.test(p)) return TEMPLATES.esp;
  if (/aim|mira|fov/.test(p)) return TEMPLATES.aimbot;
  if (/fly|voo|voar/.test(p)) return TEMPLATES.fly;
  if (/speed|velocid/.test(p)) return TEMPLATES.speed;
  if (/teleport|tp/.test(p)) return TEMPLATES.teleport;
  return "-- nenhum template bateu. Disponíveis: " + Object.keys(TEMPLATES).join(", ");
}

// ---------- OpenRouter: listar modelos ----------
async function listOpenRouterModels(key) {
  const r = await fetch(OPENROUTER_BASE + "/models", {
    headers: {
      "Authorization": "Bearer " + key,
      "HTTP-Referer": location.origin || "https://scriptforge.local",
      "X-OpenRouter-Title": "SCRIPTFORGE"
    }
  });
  if (!r.ok) throw new Error("OpenRouter list " + r.status + ": " + (await r.text()).slice(0, 160));
  const j = await r.json();
  return (j.data || [])
    .filter(m => m.id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function fillModelSelect(models) {
  const sel = $("model");
  sel.innerHTML = "";
  if (!models.length) {
    sel.innerHTML = '<option value="">— nenhum modelo —</option>';
    return;
  }
  models.forEach(m => {
    const o = document.createElement("option");
    o.value = m.id;
    const free = m.pricing?.prompt === "0" ? " · free" : "";
    o.textContent = m.id + free;
    sel.appendChild(o);
  });
  const saved = localStorage.getItem("sf_model");
  const has = models.some(m => m.id === saved);
  sel.value = has ? saved : models[0].id;
}

async function refreshModels() {
  const backend = $("backend").value;
  const key = $("apikey").value.trim();

  if (backend === "offline") { $("model").innerHTML = '<option value="">— templates —</option>'; return; }
  if (backend === "ollama") { await loadOllamaModels(); return; }
  if (backend === "openrouter") {
    if (!key) { setStatus("cola a API key da OpenRouter.", "err"); return; }
    setStatus("buscando modelos da conta…");
    try {
      const models = await listOpenRouterModels(key);
      fillModelSelect(models);
      setStatus(models.length + " modelos carregados.", "ok");
    } catch (e) {
      setStatus(e.message, "err");
    }
  }
}

async function loadOllamaModels() {
  try {
    const r = await fetch(OLLAMA_BASE + "/api/tags");
    const j = await r.json();
    const sel = $("model");
    sel.innerHTML = "";
    (j.models || []).forEach(m => {
      const o = document.createElement("option"); o.value = m.name; o.textContent = m.name;
      sel.appendChild(o);
    });
    setStatus("ollama: " + (j.models?.length || 0) + " modelos locais.", "ok");
  } catch {
    setStatus("ollama offline — roda: OLLAMA_ORIGINS=* ollama serve", "err");
  }
}

// ---------- OpenRouter: gerar ----------
async function callOpenRouter(prompt, key, model) {
  const r = await fetch(OPENROUTER_BASE + "/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": location.origin || "https://scriptforge.local",
      "X-OpenRouter-Title": "SCRIPTFORGE"
    },
    body: JSON.stringify({
      model: model,
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!r.ok) throw new Error("OpenRouter " + r.status + ": " + (await r.text()).slice(0, 200));
  const j = await r.json();
  return j.choices[0].message.content;
}

async function callOllama(prompt, model) {
  const r = await fetch(OLLAMA_BASE + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      stream: false,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!r.ok) throw new Error("Ollama " + r.status);
  const j = await r.json();
  return j.message.content;
}

// ---------- main ----------
async function generate() {
  const prompt = $("prompt").value.trim();
  if (!prompt) { setStatus("dá uma descrição primeiro.", "err"); return; }

  const backend = $("backend").value;
  const model = $("model").value;
  const key = $("apikey").value.trim();

  if (backend !== "offline" && !model) {
    setStatus("escolhe um modelo primeiro (recarrega com a key).", "err"); return;
  }

  $("gen").disabled = true;
  setStatus("gerando…");

  try {
    let raw;
    if (backend === "offline") {
      raw = offlineMatch(prompt);
    } else if (backend === "ollama") {
      raw = await callOllama(prompt, model);
    } else if (backend === "openrouter") {
      if (!key) throw new Error("cola a API key da OpenRouter");
      raw = await callOpenRouter(prompt, key, model);
    }

    const code = extractLua(raw);
    out.textContent = code;

    const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40) || "script";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    outname.textContent = `${stamp}_${slug}.lua`;
    outmeta.textContent = `${code.split("\n").length} linhas · ${backend}${model ? " · " + model : ""}`;

    setStatus("pronto.", "ok");
  } catch (e) {
    setStatus(e.message, "err");
    console.error(e);
  } finally {
    $("gen").disabled = false;
  }
}

function setStatus(msg, cls = "") {
  status.textContent = msg;
  status.className = "status " + cls;
}

// ---------- eventos ----------
$("gen").onclick = generate;
$("prompt").addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
});

$("backend").addEventListener("change", () => {
  const b = $("backend").value;
  localStorage.setItem("sf_backend", b);
  $("keyrow").style.display = (b === "openrouter") ? "flex" : "none";
  if (b === "ollama") loadOllamaModels();
  else if (b === "offline") $("model").innerHTML = '<option value="">— templates —</option>';
  else if (b === "openrouter" && $("apikey").value.trim()) refreshModels();
});

$("apikey").addEventListener("input", () => {
  localStorage.setItem("sf_apikey", $("apikey").value);
  if ($("backend").value === "openrouter" && $("apikey").value.trim().length > 20) {
    clearTimeout(window.__sf_t);
    window.__sf_t = setTimeout(refreshModels, 800);
  }
});

$("model").addEventListener("change", () => {
  localStorage.setItem("sf_model", $("model").value);
});

$("copy").onclick = async () => {
  if (!out.textContent.trim()) return;
  try { await navigator.clipboard.writeText(out.textContent); setStatus("copiado.", "ok"); }
  catch { setStatus("clipboard bloqueado — seleciona manual.", "err"); }
};

$("dl").onclick = () => {
  if (!out.textContent.trim()) return;
  const blob = new Blob([out.textContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = outname.textContent;
  a.click();
  URL.revokeObjectURL(a.href);
};

// init
$("backend").value = localStorage.getItem("sf_backend") || "openrouter";
$("backend").dispatchEvent(new Event("change"));
