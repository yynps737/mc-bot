@echo off
REM 一键构建脚本 - 简化版

echo [32m=== 开始构建过程 ===[0m

echo [36m1. 清理之前的构建...[0m
call rimraf dist

echo [36m2. 构建主进程...[0m
call tsc -p tsconfig.electron.json

echo [36m3. 构建渲染进程...[0m
call vite build

echo [36m4. 检查构建文件...[0m

mkdir dist\renderer 2>nul
type nul > dist\renderer\index.html
echo ^<!DOCTYPE html^> > dist\renderer\index.html
echo ^<html lang="zh-CN"^> >> dist\renderer\index.html
echo ^<head^> >> dist\renderer\index.html
echo     ^<meta charset="UTF-8"^> >> dist\renderer\index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> dist\renderer\index.html
echo     ^<title^>我的世界客户端^</title^> >> dist\renderer\index.html
echo ^</head^> >> dist\renderer\index.html
echo ^<body^> >> dist\renderer\index.html
echo     ^<div id="root"^>^</div^> >> dist\renderer\index.html
echo ^</body^> >> dist\renderer\index.html
echo ^</html^> >> dist\renderer\index.html

echo [36m5. 打包应用...[0m
call electron-builder

echo [32m=== 构建完成 ===[0m