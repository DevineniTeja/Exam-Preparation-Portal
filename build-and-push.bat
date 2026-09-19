@echo off
echo =========================================
echo Building and Pushing Docker Images
echo =========================================
echo.

REM Set your Docker Hub username
set DOCKER_USERNAME=fayivor

echo Step 1: Logging into Docker Hub...
echo Please enter your password when prompted
docker login -u %DOCKER_USERNAME%

if %ERRORLEVEL% NEQ 0 (
    echo Login failed! Please check your credentials.
    pause
    exit /b 1
)

echo.
echo Step 2: Building Backend Image...
cd backend
docker build -t %DOCKER_USERNAME%/exam-prep-backend:latest -t %DOCKER_USERNAME%/exam-prep-backend:v1.0 .

if %ERRORLEVEL% NEQ 0 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Building Frontend Image...
cd ..\frontend
docker build -t %DOCKER_USERNAME%/exam-prep-frontend:latest -t %DOCKER_USERNAME%/exam-prep-frontend:v1.0 .

if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

cd ..

echo.
echo Step 4: Pushing Backend Image...
docker push %DOCKER_USERNAME%/exam-prep-backend:latest
docker push %DOCKER_USERNAME%/exam-prep-backend:v1.0

if %ERRORLEVEL% NEQ 0 (
    echo Backend push failed!
    pause
    exit /b 1
)

echo.
echo Step 5: Pushing Frontend Image...
docker push %DOCKER_USERNAME%/exam-prep-frontend:latest
docker push %DOCKER_USERNAME%/exam-prep-frontend:v1.0

if %ERRORLEVEL% NEQ 0 (
    echo Frontend push failed!
    pause
    exit /b 1
)

echo.
echo =========================================
echo SUCCESS! Images pushed to Docker Hub
echo =========================================
echo.
echo Images available at:
echo - docker.io/%DOCKER_USERNAME%/exam-prep-backend:latest
echo - docker.io/%DOCKER_USERNAME%/exam-prep-frontend:latest
echo.
echo You can now pull these on EC2 with:
echo   docker pull %DOCKER_USERNAME%/exam-prep-backend:latest
echo   docker pull %DOCKER_USERNAME%/exam-prep-frontend:latest
echo.
pause
