@echo off
chcp 65001 >nul
title MyToDoList 本機伺服器 (Firebase)
echo ======================================================
echo   正在啟動 MyToDoList 伺服器...
echo   網址: http://localhost:5000
echo ======================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

