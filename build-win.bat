@echo off
echo ===================================================
echo        Minecraft 客户端 Windows 构建脚本
echo ===================================================
echo.

:: 设置错误处理
setlocal enabledelayedexpansion

:: 创建日志目录
if not exist "logs" mkdir logs
set LOG_FILE=logs\build-%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

:: 记录开始时间
echo 构建开始时间: %DATE% %TIME% > %LOG_FILE%

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js。 | tee -a %LOG_FILE%
    goto :error
)

echo [信息] 检测到Node.js版本:
node -v
echo Node.js版本: >> %LOG_FILE%
node -v >> %LOG_FILE%

echo [信息] 检测到npm版本:
npm -v
echo npm版本: >> %LOG_FILE%
npm -v >> %LOG_FILE%

echo.
echo [步骤 1/5] 清理旧的构建文件...
if exist "dist" (
    rmdir /s /q dist
    echo [信息] 已删除旧的dist目录 | tee -a %LOG_FILE%
) else (
    echo [信息] dist目录不存在，无需清理 | tee -a %LOG_FILE%
)

echo.
echo [步骤 2/5] 安装依赖项...
call npm ci
if %ERRORLEVEL% neq 0 (
    echo [错误] 安装依赖项失败 | tee -a %LOG_FILE%
    goto :error
)
echo [成功] 依赖项已安装 | tee -a %LOG_FILE%

echo.
echo [步骤 3/5] 构建项目...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [错误] 项目构建失败 | tee -a %LOG_FILE%
    goto :error
)
echo [成功] 项目构建完成 | tee -a %LOG_FILE%

echo.
echo [步骤 4/5] 打包Windows应用程序...
call npm run dist:win
if %ERRORLEVEL% neq 0 (
    echo [错误] 应用程序打包失败 | tee -a %LOG_FILE%
    goto :error
)
echo [成功] Windows应用程序打包完成 | tee -a %LOG_FILE%

echo.
echo [步骤 5/5] 验证构建输出...
if not exist "dist\*.exe" (
    echo [警告] 未找到生成的exe安装文件 | tee -a %LOG_FILE%
    goto :error
) else (
    for %%f in (dist\*.exe) do (
        echo [信息] 已生成安装文件: %%f | tee -a %LOG_FILE%
        set "INSTALLER_FILE=%%f"
    )
)

echo.
echo ===================================================
echo [成功] Windows 应用程序构建成功！
echo 安装文件位置: %INSTALLER_FILE%
echo ===================================================
echo.
echo 构建完成时间: %DATE% %TIME% >> %LOG_FILE%
echo 安装文件: %INSTALLER_FILE% >> %LOG_FILE%
goto :end

:error
echo.
echo ===================================================
echo [失败] 构建过程中出现错误！
echo 请查看日志文件: %LOG_FILE%
echo ===================================================
echo 构建失败时间: %DATE% %TIME% >> %LOG_FILE%
exit /b 1

:end
exit /b 0