@echo off
echo ==========================================
echo Testing Supabase Integration After Table Creation
echo ==========================================

echo.
echo 1. Testing basic connection...
node test-supabase.js

echo.
echo 2. Testing table existence check...  
node create-supabase-tables.js

echo.
echo 3. Running backend Supabase unit tests...
npm test -- --testPathPattern="supabase-integration.test.js"

echo.
echo 4. Testing frontend integration...
cd frontend
npm test -- --testPathPattern="supabase-basic.test.ts" --watchAll=false

echo.
echo ==========================================
echo All tests completed!
echo ==========================================