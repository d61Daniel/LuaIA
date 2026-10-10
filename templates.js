// Banco de templates Luau — todos mobile-ready (Delta no celular).
// Toggle via botão touch em ScreenGui, arrastável, com estado visual.
const TEMPLATES = {

  esp: `-- ESP com Drawing API — botão toggle touch (Delta mobile)
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { color = Color3.fromRGB(0,255,170), max_dist = 1000, team_check = true }
local g = getgenv()
if g.SF_ESP then
  for _,c in ipairs(g.SF_ESP.c) do c:Disconnect() end
  if g.SF_ESP.gui then g.SF_ESP.gui:Destroy() end
end
local S = { on = true, c = {} }; g.SF_ESP = S

local P = game:GetService("Players")
local RS = game:GetService("RunService")
local Cam = workspace.CurrentCamera
local LP = P.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "SF_ESP_" .. tostring(math.random(1000,9999))
gui.ResetOnSpawn = false
gui.Parent = LP:WaitForChild("PlayerGui")
S.gui = gui

local btn = Instance.new("TextButton")
btn.Size = UDim2.new(0, 120, 0, 44)
btn.Position = UDim2.new(0, 20, 0, 60)
btn.BackgroundColor3 = Color3.fromRGB(0, 150, 80)
btn.TextColor3 = Color3.new(1,1,1)
btn.Text = "ESP: ON"
btn.Font = Enum.Font.GothamBold
btn.TextSize = 16
btn.Parent = gui

local dragging, dragStart, startPos
btn.InputBegan:Connect(function(i)
  if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
    dragging = true; dragStart = i.Position; startPos = btn.Position
    i.Changed:Connect(function()
      if i.UserInputState == Enum.UserInputState.End then dragging = false end
    end)
  end
end)
btn.InputChanged:Connect(function(i)
  if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
    local d = i.Position - dragStart
    btn.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
  end
end)
btn.MouseButton1Click:Connect(function()
  S.on = not S.on
  btn.Text = S.on and "ESP: ON" or "ESP: OFF"
  btn.BackgroundColor3 = S.on and Color3.fromRGB(0, 150, 80) or Color3.fromRGB(60, 30, 30)
end)

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
end))`,

  aimbot: `-- Aimbot FOV — botão toggle touch (Delta mobile)
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { fov = 120, smooth = 0.25, team_check = true }
local g = getgenv()
if g.SF_AIM then
  for _,c in ipairs(g.SF_AIM.c) do c:Disconnect() end
  if g.SF_AIM.gui then g.SF_AIM.gui:Destroy() end
end
local S = { on = false, c = {} }; g.SF_AIM = S

local P = game:GetService("Players")
local RS = game:GetService("RunService")
local Cam = workspace.CurrentCamera
local LP = P.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "SF_AIM_" .. tostring(math.random(1000,9999))
gui.ResetOnSpawn = false
gui.Parent = LP:WaitForChild("PlayerGui")
S.gui = gui

local btn = Instance.new("TextButton")
btn.Size = UDim2.new(0, 120, 0, 44)
btn.Position = UDim2.new(0, 20, 0, 120)
btn.BackgroundColor3 = Color3.fromRGB(60, 30, 30)
btn.TextColor3 = Color3.new(1,1,1)
btn.Text = "AIM: OFF"
btn.Font = Enum.Font.GothamBold
btn.TextSize = 16
btn.Parent = gui

local dragging, dragStart, startPos
btn.InputBegan:Connect(function(i)
  if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
    dragging = true; dragStart = i.Position; startPos = btn.Position
    i.Changed:Connect(function()
      if i.UserInputState == Enum.UserInputState.End then dragging = false end
    end)
  end
end)
btn.InputChanged:Connect(function(i)
  if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
    local d = i.Position - dragStart
    btn.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
  end
end)
btn.MouseButton1Click:Connect(function()
  S.on = not S.on
  btn.Text = S.on and "AIM: ON" or "AIM: OFF"
  btn.BackgroundColor3 = S.on and Color3.fromRGB(0, 150, 80) or Color3.fromRGB(60, 30, 30)
end)

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
end))`,

  fly: `-- Fly mobile — botão toggle + 4 botões direcionais na tela
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { speed = 60 }
local g = getgenv()
if g.SF_FLY then
  for _,c in ipairs(g.SF_FLY.c) do c:Disconnect() end
  if g.SF_FLY.gui then g.SF_FLY.gui:Destroy() end
end
local S = { on = false, c = {}, v = Vector3.zero, dir = Vector3.zero }; g.SF_FLY = S

local P = game:GetService("Players")
local RS = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local Cam = workspace.CurrentCamera
local LP = P.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "SF_FLY_" .. tostring(math.random(1000,9999))
gui.ResetOnSpawn = false
gui.Parent = LP:WaitForChild("PlayerGui")
S.gui = gui

local function mk_btn(text, pos, size)
  local b = Instance.new("TextButton")
  b.Size = size or UDim2.new(0, 60, 0, 60)
  b.Position = pos
  b.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
  b.TextColor3 = Color3.new(1,1,1)
  b.Text = text
  b.Font = Enum.Font.GothamBold
  b.TextSize = 20
  b.Parent = gui
  return b
end

local toggle = mk_btn("FLY: OFF", UDim2.new(0, 20, 0, 180), UDim2.new(0, 120, 0, 44))
local up     = mk_btn("▲", UDim2.new(0, 130, 1, -220))
local down   = mk_btn("▼", UDim2.new(0, 130, 1, -80))
local left   = mk_btn("◀", UDim2.new(0, 60,  1, -150))
local right  = mk_btn("▶", UDim2.new(0, 200, 1, -150))
local fwd    = mk_btn("W", UDim2.new(0, 130, 1, -150))
local back   = mk_btn("S", UDim2.new(0, 130, 1, -290))

local function hold(btn, vec)
  btn.InputBegan:Connect(function(i)
    if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
      S.dir += vec
    end
  end)
  btn.InputEnded:Connect(function(i)
    if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
      S.dir -= vec
    end
  end)
end

hold(fwd,   Vector3.new(0, 0, -1))
hold(back,  Vector3.new(0, 0,  1))
hold(left,  Vector3.new(-1, 0, 0))
hold(right, Vector3.new( 1, 0, 0))
hold(up,    Vector3.new(0, 1, 0))
hold(down,  Vector3.new(0,-1, 0))

toggle.MouseButton1Click:Connect(function()
  S.on = not S.on
  S.dir = Vector3.zero
  toggle.Text = S.on and "FLY: ON" or "FLY: OFF"
  toggle.BackgroundColor3 = S.on and Color3.fromRGB(0,150,80) or Color3.fromRGB(40,40,40)
end)

local function hrp() local ch = LP.Character; return ch and ch:FindFirstChild("HumanoidRootPart") end

table.insert(S.c, RS.RenderStepped:Connect(function(dt)
  if not S.on then return end
  local h = hrp(); if not h then return end
  local world = Vector3.zero
  if S.dir.Magnitude > 0 then
    local look = Cam.CFrame.LookVector
    local rightv = Cam.CFrame.RightVector
    world = (look * -S.dir.Z) + (rightv * S.dir.X) + Vector3.yAxis * S.dir.Y
    if world.Magnitude > 0 then world = world.Unit end
  end
  S.v = S.v:Lerp(world * CONFIG.speed, math.clamp(dt*10, 0, 1))
  h.CFrame = h.CFrame + S.v * dt
  h.Velocity = Vector3.zero
end))`,

  speed: `-- Walkspeed — botão toggle touch (Delta mobile)
if not game:IsLoaded() then game.Loaded:Wait() end

local CONFIG = { speed = 60, default = 16 }
local g = getgenv()
if g.SF_SPD then
  for _,c in ipairs(g.SF_SPD.c) do c:Disconnect() end
  if g.SF_SPD.gui then g.SF_SPD.gui:Destroy() end
end
local S = { on = false, c = {} }; g.SF_SPD = S

local RS = game:GetService("RunService")
local LP = game:GetService("Players").LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "SF_SPD_" .. tostring(math.random(1000,9999))
gui.ResetOnSpawn = false
gui.Parent = LP:WaitForChild("PlayerGui")
S.gui = gui

local btn = Instance.new("TextButton")
btn.Size = UDim2.new(0, 120, 0, 44)
btn.Position = UDim2.new(0, 20, 0, 240)
btn.BackgroundColor3 = Color3.fromRGB(60, 30, 30)
btn.TextColor3 = Color3.new(1,1,1)
btn.Text = "SPD: OFF"
btn.Font = Enum.Font.GothamBold
btn.TextSize = 16
btn.Parent = gui

local dragging, dragStart, startPos
btn.InputBegan:Connect(function(i)
  if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
    dragging = true; dragStart = i.Position; startPos = btn.Position
    i.Changed:Connect(function()
      if i.UserInputState == Enum.UserInputState.End then dragging = false end
    end)
  end
end)
btn.InputChanged:Connect(function(i)
  if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
    local d = i.Position - dragStart
    btn.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
  end
end)

local function apply()
  local ch = LP.Character
  local hm = ch and ch:FindFirstChildOfClass("Humanoid")
  if hm then hm.WalkSpeed = S.on and CONFIG.speed or CONFIG.default end
end

btn.MouseButton1Click:Connect(function()
  S.on = not S.on
  btn.Text = S.on and "SPD: ON" or "SPD: OFF"
  btn.BackgroundColor3 = S.on and Color3.fromRGB(0,150,80) or Color3.fromRGB(60,30,30)
  apply()
end)

table.insert(S.c, LP.CharacterAdded:Connect(function() task.wait(0.5); apply() end))
table.insert(S.c, RS.Heartbeat:Connect(apply))`,

  teleport: `-- Teleport mobile — GUI com TextBox + botões
if not game:IsLoaded() then game.Loaded:Wait() end

local g = getgenv()
if g.SF_TP and g.SF_TP.gui then g.SF_TP.gui:Destroy() end

local P = game:GetService("Players")
local LP = P.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "SF_TP_" .. tostring(math.random(1000,9999))
gui.ResetOnSpawn = false
gui.Parent = LP:WaitForChild("PlayerGui")

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 240, 0, 120)
frame.Position = UDim2.new(0, 20, 0, 300)
frame.BackgroundColor3 = Color3.fromRGB(25, 30, 40)
frame.BorderSizePixel = 0
frame.Parent = gui

local box = Instance.new("TextBox")
box.Size = UDim2.new(1, -20, 0, 40)
box.Position = UDim2.new(0, 10, 0, 10)
box.BackgroundColor3 = Color3.fromRGB(15, 20, 28)
box.TextColor3 = Color3.new(1,1,1)
box.PlaceholderText = "nome do jogador"
box.Text = ""
box.Font = Enum.Font.Gotham
box.TextSize = 16
box.Parent = frame

local goPlayer = Instance.new("TextButton")
goPlayer.Size = UDim2.new(0.5, -15, 0, 40)
goPlayer.Position = UDim2.new(0, 10, 0, 60)
goPlayer.BackgroundColor3 = Color3.fromRGB(0, 150, 80)
goPlayer.TextColor3 = Color3.new(1,1,1)
goPlayer.Text = "TP pra jogador"
goPlayer.Font = Enum.Font.GothamBold
goPlayer.TextSize = 14
goPlayer.Parent = frame

local listBtn = Instance.new("TextButton")
listBtn.Size = UDim2.new(0.5, -15, 0, 40)
listBtn.Position = UDim2.new(0.5, 5, 0, 60)
listBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 90)
listBtn.TextColor3 = Color3.new(1,1,1)
listBtn.Text = "listar players"
listBtn.Font = Enum.Font.GothamBold
listBtn.TextSize = 14
listBtn.Parent = frame

local function my_hrp()
  local ch = LP.Character
  return ch and ch:FindFirstChild("HumanoidRootPart")
end

goPlayer.MouseButton1Click:Connect(function()
  local name = box.Text
  if name == "" then return end
  local t = P:FindFirstChild(name)
  local thrp = t and t.Character and t.Character:FindFirstChild("HumanoidRootPart")
  local my = my_hrp()
  if thrp and my then
    my.CFrame = thrp.CFrame * CFrame.new(0, 0, 3)
  end
end)

listBtn.MouseButton1Click:Connect(function()
  local names = {}
  for _,plr in ipairs(P:GetPlayers()) do
    if plr ~= LP then table.insert(names, plr.Name) end
  end
  print("[SF_TP] players: " .. table.concat(names, ", "))
end)

-- API por script: getgenv().SF_TP.to_player("Nome") / .to_coords(x,y,z)
local function to_player(name)
  local t = P:FindFirstChild(name)
  local thrp = t and t.Character and t.Character:FindFirstChild("HumanoidRootPart")
  local my = my_hrp()
  if thrp and my then my.CFrame = thrp.CFrame * CFrame.new(0,0,3); return true end
  return false
end
local function to_coords(x,y,z)
  local my = my_hrp()
  if my then my.CFrame = CFrame.new(x,y,z); return true end
  return false
end

getgenv().SF_TP = { gui = gui, to_player = to_player, to_coords = to_coords }
print("[SF_TP] pronto — use getgenv().SF_TP.to_player(\\"Nome\\")")`
};
