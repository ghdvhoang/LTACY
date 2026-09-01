@echo off
cd /d "%~dp0"
echo Yen Center LMS FE Demo v2.0
echo Mo trinh duyet tai http://localhost:4173
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 4173
) else (
  python -m http.server 4173
)
