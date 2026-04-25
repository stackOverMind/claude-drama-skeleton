# AI 漫剧制作环境 - Windows 自动安装脚本
# 以管理员身份运行 PowerShell 后执行: .\install-windows.ps1

$ErrorActionPreference = "Stop"

function Test-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n>>> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Pause-ForUser {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Yellow
    Read-Host "按 Enter 键继续..."
}

# ==================== 检查管理员权限 ====================
Write-Step "检查管理员权限..."
if (-not (Test-Admin)) {
    Write-Error "请以管理员身份运行 PowerShell，然后重新执行此脚本。"
    Write-Host "右键点击 PowerShell → 选择'以管理员身份运行'"
    exit 1
}
Write-Success "已以管理员身份运行"

# ==================== 步骤 1: 设置执行策略 ====================
Write-Step "设置 PowerShell 执行策略..."
$policy = Get-ExecutionPolicy
if ($policy -eq "Unrestricted" -or $policy -eq "RemoteSigned" -or $policy -eq "Bypass") {
    Write-Success "执行策略已是 $policy，无需修改"
} else {
    Write-Host "当前执行策略: $policy，需要设置为 Unrestricted"
    Set-ExecutionPolicy Unrestricted -Scope Process -Force
    Write-Success "执行策略已设置为 Unrestricted"
}

# ==================== 步骤 2: 检查并安装 Node.js ====================
Write-Step "检查 Node.js..."
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    $nodeVersion = node --version
    Write-Success "Node.js 已安装: $nodeVersion"
} else {
    Write-Warn "未检测到 Node.js"
    Write-Host "请前往 https://nodejs.org/ 下载并安装 LTS 版本"
    Write-Host "安装时勾选'Add to PATH'选项"
    Pause-ForUser "安装完 Node.js 后"

    # 重新检查
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodePath) {
        Write-Error "仍未检测到 Node.js，请确认已正确安装并添加到 PATH"
        exit 1
    }
    $nodeVersion = node --version
    Write-Success "Node.js 已安装: $nodeVersion"
}

# ==================== 步骤 3: 检查并安装 Git ====================
Write-Step "检查 Git..."
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if ($gitPath) {
    $gitVersion = git --version
    Write-Success "Git 已安装: $gitVersion"
} else {
    Write-Warn "未检测到 Git"
    Write-Host "正在下载 Git for Windows..."
    $gitInstaller = "$env:TEMP\Git-Installer.exe"
    try {
        Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" -OutFile $gitInstaller -UseBasicParsing
        Write-Host "正在安装 Git..."
        Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS=icons,ext\reg\shellhere,assoc,assoc_sh" -Wait
        Write-Success "Git 安装完成"

        # 刷新环境变量
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

        $gitPath = Get-Command git -ErrorAction SilentlyContinue
        if (-not $gitPath) {
            Write-Error "Git 安装后仍无法检测，请手动重启 PowerShell 后重试"
            exit 1
        }
    } catch {
        Write-Error "自动下载 Git 失败，请手动下载安装: https://git-scm.com/downloads/win"
        Pause-ForUser "安装完 Git 后"
    }
}

# ==================== 步骤 4: 安装 Claude Code CLI ====================
Write-Step "安装 Claude Code CLI..."
$claudePath = Get-Command claude -ErrorAction SilentlyContinue
if ($claudePath) {
    $claudeVersion = claude --version 2>$null
    Write-Success "Claude Code 已安装: $claudeVersion"
    $updateChoice = Read-Host "是否更新到最新版本? (y/N)"
    if ($updateChoice -eq "y" -or $updateChoice -eq "Y") {
        npm install -g @anthropic-ai/claude-code
        Write-Success "Claude Code 已更新"
    }
} else {
    Write-Host "正在安装 Claude Code..."
    npm install -g @anthropic-ai/claude-code
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Claude Code 安装失败"
        exit 1
    }
    Write-Success "Claude Code 安装完成"
}

# 验证安装
$claudeVersion = claude --version 2>$null
Write-Success "Claude Code 版本: $claudeVersion"

# ==================== 步骤 5: 配置跳过登录 ====================
Write-Step "配置 Claude Code 跳过官方登录..."
$claudeJsonPath = "$env:USERPROFILE\.claude.json"
$claudeDir = "$env:USERPROFILE\.claude"

if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

$claudeJsonContent = @"
{
  "hasCompletedOnboarding": true
}
"@

Set-Content -Path $claudeJsonPath -Value $claudeJsonContent -Force
Write-Success "已创建 $claudeJsonPath"

# ==================== 步骤 6: 配置 API 中转站 ====================
Write-Step "配置 API 中转站..."
$settingsPath = "$env:USERPROFILE\.claude\settings.json"

Write-Host "`n请提供以下信息:"
$apiKey = Read-Host "API 密钥 (向作者索取)"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Warn "未提供 API 密钥，跳过 settings.json 配置"
    Write-Host "稍后请手动创建文件: $settingsPath"
} else {
    $settingsContent = @"
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://175.27.225.233/",
    "ANTHROPIC_AUTH_TOKEN": "$apiKey",
    "ANTHROPIC_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-opus-4-6"
  }
}
"@
    Set-Content -Path $settingsPath -Value $settingsContent -Force
    Write-Success "已创建 $settingsPath"
}

# ==================== 步骤 7: 克隆项目 ====================
Write-Step "克隆 AI 漫剧项目..."
$defaultPath = "$env:USERPROFILE\claude-drama-skeleton"
$projectPath = Read-Host "输入项目存放路径 (默认: $defaultPath)"
if ([string]::IsNullOrWhiteSpace($projectPath)) {
    $projectPath = $defaultPath
}

if (Test-Path $projectPath) {
    Write-Warn "目录已存在: $projectPath"
    $overwrite = Read-Host "是否删除并重新克隆? (y/N)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        Remove-Item -Path $projectPath -Recurse -Force
        git clone https://github.com/stackOverMind/claude-drama-skeleton.git $projectPath
        Write-Success "项目已重新克隆到 $projectPath"
    } else {
        Write-Success "使用现有目录"
    }
} else {
    git clone https://github.com/stackOverMind/claude-drama-skeleton.git $projectPath
    Write-Success "项目已克隆到 $projectPath"
}

# ==================== 步骤 8: 配置项目环境变量 ====================
Write-Step "配置项目环境变量..."
$envExamplePath = "$projectPath\.env.example"
$envPath = "$projectPath\.env"

if (Test-Path $envExamplePath) {
    Copy-Item -Path $envExamplePath -Destination $envPath -Force
    Write-Success "已创建 .env 文件"
    Write-Warn "请用编辑器打开 $envPath 并填入你的真实 API Key"
} else {
    Write-Warn "未找到 .env.example 文件，跳过"
}

# ==================== 步骤 9: 安装 VS Code 插件提示 ====================
Write-Step "VS Code 插件安装"
Write-Host "请手动完成以下步骤:"
Write-Host "1. 打开 VS Code"
Write-Host "2. 按 Ctrl+Shift+X 打开插件面板"
Write-Host "3. 搜索 'Claude Code' 并安装"
Write-Host "4. 按 Ctrl+Shift+P，输入 'Open User Settings (JSON)'"
Write-Host "5. 添加以下配置:"
Write-Host @"

{
  "claudeCode.preferredLocation": "panel",
  "claudeCode.selectedModel": "claude-opus-4-6",
  "claudeCode.environmentVariables": [
    {"name": "ANTHROPIC_BASE_URL", "value": "http://175.27.225.233/"},
    {"name": "ANTHROPIC_AUTH_TOKEN", "value": "$apiKey"},
    {"name": "ANTHROPIC_DEFAULT_SONNET_MODEL", "value": "claude-opus-4-6"},
    {"name": "ANTHROPIC_DEFAULT_OPUS_MODEL", "value": "claude-opus-4-6"},
    {"name": "ANTHROPIC_DEFAULT_HAIKU_MODEL", "value": "claude-opus-4-6"}
  ]
}

"@ -ForegroundColor Cyan

# ==================== 完成 ====================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  安装完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n快速验证清单:"
Write-Host "  [ ] 终端运行 'claude --version' 显示版本号"
Write-Host "  [ ] '$claudeJsonPath' 已创建"
Write-Host "  [ ] '$settingsPath' 已配置"
Write-Host "  [ ] 终端运行 'claude' 能正常启动"
Write-Host "  [ ] VS Code 中 Claude Code 插件已安装"
Write-Host "  [ ] 项目已克隆到 $projectPath"

Write-Host "`n开始使用:"
Write-Host "  1. 在 VS Code 中打开项目文件夹: $projectPath"
Write-Host "  2. 点击 VS Code 右侧的 Claude Code 图标"
Write-Host "  3. 开始创作你的 AI 漫剧!"

Pause-ForUser "按 Enter 键退出"
