@echo off
echo === 超简单构建脚本 ===

echo 清理目录...
rmdir /s /q dist
mkdir dist
mkdir dist\main
mkdir dist\renderer

echo 构建主进程...
call tsc -p tsconfig.electron.json
call node scripts/copy-main-files.js

echo 创建HTML...
echo ^<!DOCTYPE html^> > dist\renderer\index.html
echo ^<html^>^<head^>^<meta charset="UTF-8"^>^<title^>我的世界客户端^</title^>^</head^>^<body^>^<div id="root"^>^</div^>^</body^>^</html^> >> dist\renderer\index.html

echo 打包应用...
electron-builder