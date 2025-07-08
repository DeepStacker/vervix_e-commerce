@echo off
echo =======================================================
echo    VERVIX E-COMMERCE SETUP - Luxury Fashion Platform
echo =======================================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if MongoDB is installed
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB is not installed or not in PATH
    echo Please install MongoDB from https://www.mongodb.com/try/download/community
    echo.
)

echo Setting up Vervix E-commerce Platform...
echo.

:: Backend Setup
echo [1/4] Setting up Backend...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)

:: Create uploads directory
if not exist uploads mkdir uploads
if not exist uploads\products mkdir uploads\products
if not exist uploads\users mkdir uploads\users
if not exist uploads\categories mkdir uploads\categories

echo Backend setup complete!
echo.

:: Frontend Setup
echo [2/4] Setting up Frontend...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)

echo Frontend setup complete!
echo.

:: Create TailwindCSS config
echo [3/4] Setting up TailwindCSS...
if not exist tailwind.config.js (
    npx tailwindcss init -p
)

:: Copy environment files
echo [4/4] Setting up environment files...
cd ..\backend
if not exist .env.local (
    copy .env .env.local
    echo Please update .env.local with your actual configuration values
)

cd ..\frontend
if not exist .env.local (
    echo REACT_APP_API_URL=http://localhost:5000/api > .env.local
    echo REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key >> .env.local
)

cd ..

echo.
echo =======================================================
echo                  SETUP COMPLETE!
echo =======================================================
echo.
echo Your Vervix E-commerce platform is ready!
echo.
echo NEXT STEPS:
echo.
echo 1. Update configuration files:
echo    - backend/.env.local (MongoDB URI, JWT secret, email settings)
echo    - frontend/.env.local (API URL, Stripe keys)
echo.
echo 2. Start MongoDB service:
echo    - Windows: net start MongoDB
echo    - Or run: mongod --dbpath "C:\data\db"
echo.
echo 3. Run the application:
echo    - Backend: cd backend && npm run dev
echo    - Frontend: cd frontend && npm start
echo.
echo 4. Access the application:
echo    - Website: http://localhost:3000
echo    - Admin Panel: http://localhost:3000/admin
echo    - API: http://localhost:5000/api
echo.
echo 5. Default Admin Credentials:
echo    - Email: admin@vervix.com
echo    - Password: admin123
echo    (Change these in production!)
echo.
echo For detailed documentation, check the README.md file.
echo.
pause
