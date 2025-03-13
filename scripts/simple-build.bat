@echo off
REM 极简构建脚本

echo === 清理 ===
rmdir /s /q dist
mkdir dist
mkdir dist\main
mkdir dist\renderer

echo === 复制主进程文件 ===
call tsc -p tsconfig.electron.json

echo === 创建基本HTML ===
echo ^<!DOCTYPE html^> > dist\renderer\index.html
echo ^<html^>^<head^>^<title^>我的世界客户端^</title^>^</head^>^<body^>^<div id="root"^>^</div^>^</body^>^</html^> >> dist\renderer\index.html

echo === 显示构建的文件 ===
dir dist /s

echo === 打包应用 ===
electron-builder --dir