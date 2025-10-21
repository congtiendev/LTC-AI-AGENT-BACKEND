# Test email API request
$body = @{
    to = "lecongtien.dev@gmail.com"
    template = "welcome"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/test/email" -Method Post -Body $body -ContentType "application/json"