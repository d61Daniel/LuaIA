# SCRIPTFORGE — Luau para Delta

Gerador de scripts Luau para executor Roblox Delta, rodando 100% no browser.
Backend OpenRouter. Hospedável em GitHub Pages.

## Deploy

1. Cria repo público `roblox-script-ai`
2. Sobe: `index.html`, `style.css`, `app.js`, `templates.js`, `.nojekyll`, `README.md`
3. Settings → Pages → Source: **Deploy from a branch** · Branch: `main` · Folder: `/ (root)` → Save
4. URL: `https://SEU-USER.github.io/roblox-script-ai/`

## Uso

1. Pega uma key em https://openrouter.ai/keys (formato `sk-or-v1-...`)
2. Cola no campo — o app busca os modelos disponíveis na tua conta automaticamente
3. Escolhe um modelo no dropdown (os `:free` aparecem marcados)
4. Descreve o script → **Gerar** (Ctrl+Enter)
5. **Copiar** ou **Baixar .lua** → manda pro celular → Delta → cola → Execute

## Backends

| Backend | Onde | Como |
|---|---|---|
| OpenRouter | nuvem | cola key `sk-or-v1-...`, dropdown popula sozinho |
| Ollama | local | `OLLAMA_ORIGINS=* ollama serve` |
| Offline | — | templates embutidos, sem rede |

Key fica só no `localStorage` do navegador.
