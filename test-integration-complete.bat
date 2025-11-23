@echo off
echo ==========================================
echo COMPREHENSIVE SUPABASE INTEGRATION TEST
echo ==========================================
echo.

echo Step 1: Testing basic connection
echo --------------------------------
node test-supabase.js
echo.

echo Step 2: Testing table access  
echo ----------------------------
node create-supabase-tables.js
echo.

echo Step 3: Backend integration tests
echo ---------------------------------
npm test -- --testPathPattern="supabase-integration.test.js" --verbose
echo.

echo Step 4: Frontend integration tests  
echo ----------------------------------
cd frontend
npm test -- --testPathPattern="supabase-basic.test.ts" --watchAll=false --verbose
cd ..
echo.

echo ==========================================
echo INTEGRATION TEST SUITE COMPLETED!
echo ==========================================
echo.
echo If all tests pass, your Supabase integration is complete!
echo If any tests fail, the output above will show what to fix.