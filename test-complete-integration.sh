echo "Testing complete Supabase integration after table creation..."
echo "=========================================================="

echo ""
echo "1. Testing basic connection:"
node test-supabase.js

echo ""
echo "2. Testing table access:"
node create-supabase-tables.js

echo ""
echo "3. Running backend unit tests:"
cd tests
npm test -- --testNamePattern="Supabase Integration"

echo ""
echo "4. Testing frontend integration:"
cd ../frontend  
npm test -- --testPathPattern="supabase-basic.test.ts" --watchAll=false

echo ""
echo "=========================================================="
echo "Integration test completed!"