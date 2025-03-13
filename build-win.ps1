# Minecraft 客户端 Windows 构建脚本 (PowerShell版本)
# 更加现代化的PowerShell实现，提供更好的错误处理和日志记录

# 设置错误处理
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue" # 禁用进度条

# 创建日志目录和日志文件
$LogFolder = "logs"
if (-not (Test-Path $LogFolder)) {
    New-Item -Path $LogFolder -ItemType Directory | Out-Null
}
$LogFile = Join-Path $LogFolder "build-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [string]$Level = "INFO"
    )

    $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$TimeStamp] [$Level] $Message"

    # 输出到控制台
    if ($Level -eq "ERROR") {
        Write-Host $LogEntry -ForegroundColor Red
    } elseif ($Level -eq "WARNING") {
        Write-Host $LogEntry -ForegroundColor Yellow
    } elseif ($Level -eq "SUCCESS") {
        Write-Host $LogEntry -ForegroundColor Green
    } else {
        Write-Host $LogEntry
    }

    # 输出到日志文件
    Add-Content -Path $LogFile -Value $LogEntry
}

function Invoke-ProcessStep {
    param (
        [Parameter(Mandatory = $true)]
        [string]$StepName,

        [Parameter(Mandatory = $true)]
        [scriptblock]$ScriptBlock
    )

    Write-Log "开始执行步骤: $StepName" -Level "INFO"

    try {
        & $ScriptBlock
        Write-Log "步骤完成: $StepName" -Level "SUCCESS"
        return $true
    } catch {
        Write-Log "步骤失败: $StepName - $_" -Level "ERROR"
        return $false
    }
}

# 显示标题
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "       Minecraft 客户端 Windows 构建脚本         " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Log "构建过程开始" -Level "INFO"

# 检查Node.js是否安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Log "未检测到Node.js，请先安装Node.js。" -Level "ERROR"
    exit 1
}

$NodeVersion = (node -v)
$NpmVersion = (npm -v)
Write-Log "检测到Node.js版本: $NodeVersion" -Level "INFO"
Write-Log "检测到npm版本: $NpmVersion" -Level "INFO"

# 步骤1: 清理旧的构建文件
$step1 = Invoke-ProcessStep -StepName "清理旧的构建文件" -ScriptBlock {
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force
        Write-Log "已删除旧的dist目录" -Level "INFO"
    } else {
        Write-Log "dist目录不存在，无需清理" -Level "INFO"
    }
}

if (-not $step1) { exit 1 }

# 步骤2: 安装依赖项
$step2 = Invoke-ProcessStep -StepName "安装依赖项" -ScriptBlock {
    Write-Log "正在安装依赖项，这可能需要一些时间..." -Level "INFO"
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci 命令失败" }
}

if (-not $step2) { exit 1 }

# 步骤3: 构建项目
$step3 = Invoke-ProcessStep -StepName "构建项目" -ScriptBlock {
    Write-Log "正在构建项目..." -Level "INFO"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build 命令失败" }
}

if (-not $step3) { exit 1 }

# 步骤4: 打包Windows应用程序
$step4 = Invoke-ProcessStep -StepName "打包Windows应用程序" -ScriptBlock {
    Write-Log "正在打包Windows应用程序，这可能需要几分钟..." -Level "INFO"
    npm run dist:win
    if ($LASTEXITCODE -ne 0) { throw "npm run dist:win 命令失败" }
}

if (-not $step4) { exit 1 }

# 步骤5: 验证构建输出
$step5 = Invoke-ProcessStep -StepName "验证构建输出" -ScriptBlock {
    $exeFiles = Get-ChildItem -Path "dist" -Filter "*.exe" -Recurse

    if ($exeFiles.Count -eq 0) {
        throw "未找到生成的exe安装文件"
    } else {
        foreach ($file in $exeFiles) {
            Write-Log "已生成安装文件: $($file.FullName)" -Level "SUCCESS"
            $global:InstallerFile = $file.FullName
        }
    }
}

if (-not $step5) { exit 1 }

# 完成
Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "[成功] Windows 应用程序构建成功！" -ForegroundColor Green
Write-Host "安装文件位置: $global:InstallerFile" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Log "构建过程成功完成" -Level "SUCCESS"
Write-Log "安装文件: $global:InstallerFile" -Level "SUCCESS"