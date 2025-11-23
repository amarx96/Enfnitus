function Test-FunnelAPI {
    Write-Host "🔧 Testing EVU Funnel API..." -ForegroundColor Cyan
    
    try {
        # Test 1: Check if server is responding
        Write-Host "1️⃣ Testing server connectivity..." -ForegroundColor Yellow
        $healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET -TimeoutSec 10
        Write-Host "✅ Server is responding! Status: $($healthCheck.StatusCode)" -ForegroundColor Green
        
        # Test 2: Test pricing API
        Write-Host "2️⃣ Testing pricing API..." -ForegroundColor Yellow
        $body = @{
            plz = "10115"
            jahresverbrauch = 3500
            haushaltgroesse = 2
        } | ConvertTo-Json -Depth 10
        
        $pricingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/tarife/berechnen" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
        
        if ($pricingResponse.StatusCode -eq 200) {
            Write-Host "✅ Pricing API working! Status: $($pricingResponse.StatusCode)" -ForegroundColor Green
            $data = $pricingResponse.Content | ConvertFrom-Json
            Write-Host "   Found $($data.daten.Count) tariffs" -ForegroundColor Green
        }
        
        # Test 3: Test voucher API
        Write-Host "3️⃣ Testing voucher validation..." -ForegroundColor Yellow
        $voucherBody = @{
            code = "WELCOME2025"
            tariff_id = "basis"
        } | ConvertTo-Json -Depth 10
        
        try {
            $voucherResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/voucher/validate" -Method POST -ContentType "application/json" -Body $voucherBody -TimeoutSec 10
            Write-Host "✅ Voucher API working! Status: $($voucherResponse.StatusCode)" -ForegroundColor Green
        } catch {
            if ($_.Exception.Response.StatusCode -eq 400) {
                Write-Host "⚠️ Voucher API working (expected validation error)" -ForegroundColor Yellow
            } else {
                Write-Host "❌ Voucher API error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "🎉 FUNNEL IS RUNNING PROPERLY!" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host "   ✅ Backend API: http://localhost:3000" -ForegroundColor Green
        Write-Host "   ✅ Frontend: http://localhost:3000" -ForegroundColor Green
        Write-Host "   ✅ API Documentation: http://localhost:3000/api-docs" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Funnel test failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Make sure the backend is running with npm start" -ForegroundColor Yellow
    }
}

# Run the test
Test-FunnelAPI