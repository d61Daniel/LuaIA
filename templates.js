// Banco de templates Luau usados no modo offline.
const TEMPLATES = {
  esp: `-- ESP com Drawing API — toggle RightShift
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { toggle_key = Enum.KeyCode.RightShift, color = Color3.fromRGB(0,255,170), max_dist = 1000, team_check = true }
local g = getgenv()
if g.SF_ESP then for _,c in ipairs(g.SF_ESP.c) do c:Disconnect() end end
local S = { on = true, c = {} }; g.SF_ESP = S

local P = game:GetService("Players")
local RS = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local Cam = workspace.CurrentCamera
local LP = P.LocalPlayer

local function box(plr)
  local b = Drawing.new("Square"); b.Thickness=1; b.Color=CONFIG.color; b.Filled=false; b.Visible=false
  local n = Drawing.new("Text"); n.Size=14; n.Center=true; n.Outline=true; n.Color=Color3.new(1,1,1); n.Visible=false
  return { b=b, n=n, plr=plr }
end

local cache = {}
table.insert(S.c, RS.RenderStepped:Connect(function()
  for _,plr in ipairs(P:GetPlayers()) do
    if plr ~= LP then cache[plr] = cache[plr] or box(plr) end
  end
  for plr,e in pairs(cache) do
    local ch = plr.Character
    local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
    local hum = ch and ch:FindFirstChildOfClass("Humanoid")
    if not hrp or not hum or hum.Health <= 0 or (CONFIG.team_check and plr.Team == LP.Team) then
      e.b.Visible = false; e.n.Visible = false
    else
      local p, on = Cam:WorldToViewportPoint(hrp.Position)
      local h = (Cam.CFrame.Position - hrp.Position).Magnitude
      if on and h < CONFIG.max_dist then
        local head = ch:FindFirstChild("Head")
        local hp = head and Cam:WorldToViewportPoint(head.Position + Vector3.new(0,0.5,0))
        local height = hp and math.abs(p.Y - hp.Y) or 60
        local width = height * 0.55
        e.b.Size = Vector2.new(width, height)
        e.b.Position = Vector2.new(p.X - width/2, p.Y - height/2)
        e.b.Visible = S.on
        e.n.Position = Vector2.new(p.X, p.Y - height/2 - 14)
        e.n.Text = string.format("%s [%dm]", plr.Name, math.floor(h))
        e.n.Visible = S.on
      else
        e.b.Visible = false; e.n.Visible = false
      end
    end
  end
end))
table.insert(S.c, UIS.InputBegan:Connect(function(i,gp)
  if not gp and i.KeyCode == CONFIG.toggle_key then S.on = not S.on end
end))`,

  aimbot: `-- Aimbot FOV — toggle RightControl, team check, smooth
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { key = Enum.KeyCode.RightControl, fov = 120, smooth = 0.25, team_check = true }
local g = getgenv()
if g.SF_AIM then for _,c in ipairs(g.SF_AIM.c) do c:Disconnect() end end
local S = { on = false, c = {} }; g.SF_AIM = S

local P = game:GetService("Players")
local RS = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local Cam = workspace.CurrentCamera
local LP = P.LocalPlayer

local function best()
  local b, bd = nil, CONFIG.fov
  local sc = Cam.ViewportSize / 2
  for _,plr in ipairs(P:GetPlayers()) do
    if plr == LP then continue end
    if CONFIG.team_check and plr.Team == LP.Team then continue end
    local ch = plr.Character
    local hd = ch and ch:FindFirstChild("Head")
    local hm = ch and ch:FindFirstChildOfClass("Humanoid")
    if hd and hm and hm.Health > 0 then
      local p, on = Cam:WorldToViewportPoint(hd.Position)
      if on then
        local d = (Vector2.new(p.X,p.Y) - sc).Magnitude
        if d < bd then b, bd = hd, d end
      end
    end
  end
  return b
end

table.insert(S.c, RS.RenderStepped:Connect(function()
  if not S.on then return end
  local t = best()
  if t then Cam.CFrame = Cam.CFrame:Lerp(CFrame.new(Cam.CFrame.Position, t.Position), CONFIG.smooth) end
end))
table.insert(S.c, UIS.InputBegan:Connect(function(i,gp)
  if not gp and i.KeyCode == CONFIG.key then S.on = not S.on end
end))`,

  fly: `-- Fly via CFrame loop — toggle F
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { key = Enum.KeyCode.F, speed = 50 }
local g = getgenv()
if g.SF_FLY then for _,c in ipairs(g.SF_FLY.c) do c:Disconnect() end end
local S = { on = false, c = {}, v = Vector3.zero }; g.SF_FLY = S

local P = game:GetService("Players")
local RS = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local Cam = workspace.CurrentCamera
local LP = P.LocalPlayer

local function hrp() local ch = LP.Character; return ch and ch:FindFirstChild("HumanoidRootPart") end

table.insert(S.c, RS.RenderStepped:Connect(function(dt)
  if not S.on then return end
  local h = hrp(); if not h then return end
  local m = Vector3.zero
  if UIS:IsKeyDown(Enum.KeyCode.W) then m += Cam.CFrame.LookVector end
  if UIS:IsKeyDown(Enum.KeyCode.S) then m -= Cam.CFrame.LookVector end
  if UIS:IsKeyDown(Enum.KeyCode.A) then m -= Cam.CFrame.RightVector end
  if UIS:IsKeyDown(Enum.KeyCode.D) then m += Cam.CFrame.RightVector end
  if UIS:IsKeyDown(Enum.KeyCode.Space) then m += Vector3.yAxis end
  if UIS:IsKeyDown(Enum.KeyCode.LeftControl) then m -= Vector3.yAxis end
  if m.Magnitude > 0 then m = m.Unit end
  S.v = S.v:Lerp(m * CONFIG.speed, math.clamp(dt*10, 0, 1))
  h.CFrame = h.CFrame + S.v * dt
  h.Velocity = Vector3.zero
end))
table.insert(S.c, UIS.InputBegan:Connect(function(i,gp)
  if not gp and i.KeyCode == CONFIG.key then
    S.on = not S.on
    local h = hrp(); if h and not S.on then h.Velocity = Vector3.zero end
  end
end))`,

  speed: `-- Walkspeed spoof — toggle G
if not game:IsLoaded() then game.Loaded:Wait() end
local CONFIG = { key = Enum.KeyCode.G, speed = 60, default = 16 }
local g = getgenv()
if g.SF_SPD then for _,c in ipairs(g.SF_SPD.c) do c:Disconnect() end end
local S = { on = false, c = {} }; g.SF_SPD = S
local RS = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local LP = game:GetService("Players").LocalPlayer
local function apply()
  local ch = LP.Character; local hm = ch and ch:FindFirstChildOfClass("Humanoid")
  if hm then hm.WalkSpeed = S.on and CONFIG.speed or CONFIG.default end
end
table.insert(S.c, LP.CharacterAdded:Connect(function() task.wait(0.5); apply() end))
table.insert(S.c, RS.Heartbeat:Connect(apply))
table.insert(S.c, UIS.InputBegan:Connect(function(i,gp)
  if not gp and i.KeyCode == CONFIG.key then S.on = not S.on; apply() end
end))`,

  teleport: `-- Teleport helper — getgenv().SF_TP.to_player("Nome") ou .to_coords(x,y,z)
if not game:IsLoaded() then game.Loaded:Wait() end
local LP = game:GetService("Players").LocalPlayer
local function to_player(name)
  local t = game:GetService("Players"):FindFirstChild(name)
  local hrp = t and t.Character and t.Character:FindFirstChild("HumanoidRootPart")
  local my = LP.Character and LP.Character:FindFirstChild("HumanoidRootPart")
  if hrp and my then my.CFrame = hrp.CFrame * CFrame.new(0,0,3); return true end
  return false
end
local function to_coords(x,y,z)
  local my = LP.Character and LP.Character:FindFirstChild("HumanoidRootPart")
  if my then my.CFrame = CFrame.new(x,y,z); return true end
  return false
end
getgenv().SF_TP = { to_player = to_player, to_coords = to_coords }
print("[SF] SF_TP pronto — use SF_TP.to_player(\\"Nome\\")")`
};
