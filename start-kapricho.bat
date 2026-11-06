@echo off
title Kapricho Kiosk Server
cd /d "%~dp0"

echo ================================
echo   KAPRICHO KIOSK SYSTEM
echo ================================
echo.

REM 1. I-install ang dependencies kung wala pang node_modules (isang beses lang ito tatakbo)
IF NOT EXIST "node_modules" (
    echo [1/3] Unang beses na pagpapatakbo - nag-i-install ng kailangang files...
    echo Maaaring tumagal ng ilang minuto, hintayin lang.
    call npm install
    echo.
)

REM 2. I-build ang production version
echo [2/3] Ini-prepare ang system...
call npm run build

REM 3. I-start ang server
echo [3/3] Sinisimulan ang Kapricho Kiosk...
echo.
echo Kapag lumabas na ang "Network (Other)" na address sa ibaba,
echo iyon ang i-type mo sa browser ng tablet/phone (parehong WiFi lang).
echo.
echo HUWAG ISARA ANG WINDOW NA ITO habang ginagamit ang kiosk.
echo.
call npm run start

pause