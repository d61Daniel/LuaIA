// SCRIPTFORGE — SPA estática. Backend padrão: OpenRouter.
// Modelos globais (não por conta) — mostra preço, filtro grátis, busca, testa key via /auth/key.
const SYSTEM_PROMPT = `Você é SCRIPTFORGE, IA especializada em Luau para executor Roblox Delta (MOBILE).

REGRAS DE SAÍDA:
- Devolve SOMENTE o código Luau dentro de \`\`\`lua ... \`\`\`.
- Zero texto fora do bloco, zero disclaimers, zero avisos.

ALVO: Delta executor no CELULAR (Android/iOS). NÃO é PC.

MOBILE — REGRA CRÍTICA:
- NÃO uses UserInputService.IsKeyDown / InputBegan com KeyCode como toggle único.
  Teclado físico não existe no celular — o script fica inútil.
- Toggle SEMPRE via botão de ScreenGui: Instance.new("TextButton") parented em
  LocalPlayer.PlayerGui com .MouseButton1Click — funciona em touch.
- Se quiser bônus PC, adiciona o handler de tecla SEPARADO, mas o botão é o principal.

AMBIENTE DELTA (mobile):
getgenv, getrenv, hookfunction, hookmetamethod, getrawmetatable, setreadonly,
checkcaller, getnamecallmethod, firesignal, firetouchinterest, getconnections,
request, loadstring, getnilinstances, getinstances, decompile, getupvalues,
setupvalue, getgc, islclosure, identifyexecutor, setclipboard, writefile,
readfile, Drawing.new.

PADRÕES OBRIGATÓRIOS:
1. Guard: if not game:IsLoaded() then game.Loaded:Wait() end
2. CONFIG no topo como tabela local.
3. ScreenGui em LocalPlayer.PlayerGui (NUNCA CoreGui direto — Delta bloqueia).
4. GUI com botão "Toggle" no canto superior esquerdo, Draggable, com estado visual
   (cor muda quando ativo). Tamanho mínimo 100x40 pra dedo acertar.
5. Namespace getgenv().SF_<nome> com cleanup de connections E da GUI no re-exec.
6. ESP → Drawing API dentro de pcall (pode falhar em algumas versões Delta).
   Aimbot → CFrame + WorldToViewportPoint + FOV.
   Fly → CFrame RenderStepped + Velocity zero.
   Speed → Humanoid.WalkSpeed.
7. Comentário só no que não é óbvio.

TEMPLATE MÍNIMO DE GUI (usa isso):
local gui = Instance.new("ScreenGui")
gui.Name = "SF_" .. tostring(math.random(1000,9999))
gui.ResetOnSpawn = false
gui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")

local btn = Instance.new("TextButton")
btn.Size = UDim2.new(0, 120, 0, 44)
btn.Position = UDim2.new(0, 20, 0, 60)
btn.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
btn.TextColor3 = Color3.new(1, 1, 1)
btn.Text = "OFF"
btn.Font = Enum.Font.GothamBold
btn.TextSize = 16
btn.Parent = gui

local dragging, dragStart, startPos
btn.InputBegan:Connect(function(i)
  if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
    dragging = true
    dragStart = i.Position
    startPos = btn.Position
    i.Changed:Connect(function()
      if i.UserInputState == Enum.UserInputState.End then dragging = false end
    end)
  end
end)
btn.InputChanged:Connect(function(i)
  if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
    local delta = i.Position - dragStart
    btn.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
  end
end)

local state = { on = false }
btn.MouseButton1Click:Connect(function()
  state.on = not state.on
  btn.Text = state.on and "ON" or "OFF"
  btn.BackgroundColor3 = state.on and Color3.fromRGB(0, 150, 80) or Color3.fromRGB(40, 40, 40)
end)`;

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OLLAMA_BASE = "http://localhost:11434";
const MODELS_CACHE_TTL = 1000 * 60 * 30;

const $ = id => document.getElementById(id);
const out = $("out"), outname = $("outname"), outmeta = $("outmeta"), status = $("status");

const PRESETS = [
  "ESP box + nome + distância, botão toggle, team check",
  "Aimbot FOV 120, smooth 0.25, team check, botão toggle",
  "Fly com botão toggle + 4 botões direcionais na tela",
  "Walkspeed 60 com botão toggle",
  "Teleport pra jogador por nome (GUI com TextBox)",
  "Bypass anti-cheat de velocidade (metatable hook)"
];
PRESETS.forEach(p => {
  const el = document.createElement("span");
  el.className = "preset"; el.textContent = p;
  el.onclick = () => { $("prompt").value = p; };
  $("presets").appendChild(el);
});

["backend", "model", "apikey"].forEach(k => {
  const v = localStorage.getItem("sf_" + k);
  if (v) $(k).value = v;
});

function extractLua(text) {
  const m = text.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}

function offlineMatch(prompt) {
  const p = prompt.toLowerCase();
  if (/esp|box|nome|dist/.test(p)) return TEMPLATES.esp;
  if (/aim|mira|fov/.test(p)) return TEMPLATES.aimbot;
  if (/fly|voo|voar/.test(p)) return TEMPLATES.fly;
  if (/speed|velocid/.test(p)) return TEMPLATES.speed;
  if (/teleport|tp/.test(p)) return TEMPLATES.teleport;
  return "-- nenhum template bateu. Disponíveis: " + Object.keys(TEMPLATES).join(", ");
}

async function testOpenRouterKey(key) {
  const r = await fetch(OPENROUTER_BASE + "/auth/key", {
    headers: {
      "Authorization": "Bearer " + key,
      "HTTP-Referer": location.origin || "https://scriptforge.local",
      "X-OpenRouter-Title": "SCRIPTFORGE"
    }
  });
  if (!r.ok) throw new Error("key inválida (" + r.status + ")");
  const j = await r.json();
  const d = j.data || {};
  const limit = d.limit == null ? "sem limite" : "$" + Number(d.limit).toFixed(2);
  const usage = "$" + Number(d.usage || 0).toFixed(2);
  const remaining = d.limit == null ? "∞" : "$" + Math.max(0, d.limit - (d.usage || 0)).toFixed(2);
  return { label: d.label || "(sem label)", limit, usage, remaining, isFreeTier: d.is_free_tier };
}

async function listOpenRouterModels(key, forceRefresh = false) {
  const cached = localStorage.getItem("sf_models_cache");
  const cachedAt = Number(localStorage.getItem("sf_models_at") || 0);
  if (!forceRefresh && cached && (Date.now() - cachedAt) < MODELS_CACHE_TTL) {
    try { return JSON.parse(cached); } catch {}
  }
  const r = await fetch(OPENROUTER_BASE + "/models", {
    headers: {
      "Authorization": "Bearer " + key,
      "HTTP-Referer": location.origin || "https://scriptforge.local",
      "X-OpenRouter-Title": "SCRIPTFORGE"
    }
  });
  if (!r.ok) throw new Error("OpenRouter list " + r.status + ": " + (await r.text()).slice(0, 160));
  const j = await r.json();
  const models = (j.data || []).filter(m => m.id).map(m => ({
    id: m.id,
    name: m.name || m.id,
    ctx: m.context_length || 0,
    promptPrice: m.pricing?.prompt ?? "0",
    completionPrice: m.pricing?.completion ?? "0",
    isFree: (m.pricing?.prompt === "0" && m.pricing?.completion === "0")
  })).sort((a, b) => a.id.localeCompare(b.id));
  localStorage.setItem("sf_models_cache", JSON.stringify(models));
  localStorage.setItem("sf_models_at", String(Date.now()));
  return models;
}

function fmtPrice(p) {
  if (p === "0" || p === 0) return "grátis";
  const n = Number(p);
  if (!isFinite(n)) return p;
  return "$" + (n * 1_000_000).toFixed(2) + "/1M";
}

let allModels = [];

function renderModelOptions() {
  const sel = $("model");
  const q = ($("modelSearch")?.value || "").trim().toLowerCase();
  const onlyFree = $("onlyFree")?.checked || false;

  let list = allModels;
  if (onlyFree) list = list.filter(m => m.isFree);
  if (q) list = list.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));

  const saved = localStorage.getItem("sf_model");
  sel.innerHTML = "";
  if (!list.length) {
    sel.innerHTML = '<option value="">— nenhum modelo bate —</option>';
    return;
  }
  list.forEach(m => {
    const o = document.createElement("option");
    o.value = m.id;
    const tag = m.isFree ? " · grátis" : " · " + fmtPrice(m.promptPrice);
    o.textContent = m.id + tag;
    sel.appendChild(o);
  });
  if (list.some(m => m.id === saved)) sel.value = saved;
}

async function refreshModels(force = false) {
  const backend = $("backend").value;
  const key = $("apikey").value.trim();

  if (backend === "offline") {
    $("model").innerHTML = '<option value="">— templates —</option>';
    return;
  }
  if (backend === "ollama") { await loadOllamaModels(); return; }
  if (backend === "openrouter") {
    if (!key) { setStatus("cola a API key da OpenRouter.", "err"); return; }
    setStatus("verificando key…");
    try {
      const info = await testOpenRouterKey(key);
      setStatus(`key ok · ${info.label} · resta ${info.remaining}`, "ok");
      setStatus("buscando catálogo de modelos…");
      allModels = await listOpenRouterModels(key, force);
      renderModelOptions();
      const freeCount = allModels.filter(m => m.isFree).length;
      setStatus(`${allModels.length} modelos (${freeCount} grátis) · resta ${info.remaining}`, "ok");
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
  if (!r.ok) {
    const txt = await r.text();
    throw new Error("OpenRouter " + r.status + ": " + txt.slice(0, 200));
  }
  const j = await r.json();
  if (j.error) throw new Error("OpenRouter: " + (j.error.message || JSON.stringify(j.error)));
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

async function generate() {
  const prompt = $("prompt").value.trim();
  if (!prompt) { setStatus("dá uma descrição primeiro.", "err"); return; }

  const backend = $("backend").value;
  const model = $("model").value;
  const key = $("apikey").value.trim();

  if (backend !== "offline" && !model) {
    setStatus("escolhe um modelo primeiro.", "err"); return;
  }

  $("gen").disabled = true;
  setStatus("gerando…");

  try {
    let raw;
    if (backend === "offline") raw = offlineMatch(prompt);
    else if (backend === "ollama") raw = await callOllama(prompt, model);
    else if (backend === "openrouter") {
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

$("gen").onclick = generate;
$("prompt").addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
});

$("backend").addEventListener("change", () => {
  const b = $("backend").value;
  localStorage.setItem("sf_backend", b);
  $("keyrow").style.display = (b === "openrouter") ? "flex" : "none";
  $("filterrow").style.display = (b === "openrouter") ? "flex" : "none";
  if (b === "ollama") loadOllamaModels();
  else if (b === "offline") $("model").innerHTML = '<option value="">— templates —</option>';
  else if (b === "openrouter" && $("apikey").value.trim()) refreshModels();
});

$("apikey").addEventListener("input", () => {
  localStorage.setItem("sf_apikey", $("apikey").value);
  if ($("backend").value === "openrouter" && $("apikey").value.trim().length > 20) {
    clearTimeout(window.__sf_t);
    window.__sf_t = setTimeout(() => refreshModels(true), 900);
  }
});

$("model").addEventListener("change", () => {
  localStorage.setItem("sf_model", $("model").value);
});

if ($("modelSearch")) $("modelSearch").addEventListener("input", renderModelOptions);
if ($("onlyFree")) $("onlyFree").addEventListener("change", renderModelOptions);
if ($("refreshBtn")) $("refreshBtn").onclick = () => {
  localStorage.removeItem("sf_models_at");
  refreshModels(true);
};

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

$("backend").value = localStorage.getItem("sf_backend") || "openrouter";
$("backend").dispatchEvent(new Event("change"));
