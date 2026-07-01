@echo off
cd /d "%~dp0"
echo [1/2] Demarrage de MySQL...
start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone --skip-grant-tables
timeout /T 10 /NOBREAK >nul
echo [2/2] Demarrage de SmartSchool...
node app.js
pause
