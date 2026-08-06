# Fix S3 CORS for document upload

$BUCKET_NAME = "aisss-dev-knowledge-docs-314175685812"

Write-Host "Fixing S3 CORS for bucket: $BUCKET_NAME" -ForegroundColor Cyan
Write-Host ""

# Create CORS configuration
$corsConfig = @'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
      "AllowedOrigins": [
        "https://dev.dwfkamikpgffo.amplifyapp.com",
        "https://staging.dwfkamikpgffo.amplifyapp.com",
        "https://dwfkamikpgffo.amplifyapp.com",
        "http://localhost:5173",
        "http://localhost:3000"
      ],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
'@

# Save to temp file (UTF8 without BOM)
$tempFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempFile, $corsConfig, (New-Object System.Text.UTF8Encoding $false))

try {
    Write-Host "Applying CORS configuration..." -ForegroundColor Yellow
    aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration "file://$tempFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CORS configuration applied successfully!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Verifying CORS configuration..." -ForegroundColor Yellow
        aws s3api get-bucket-cors --bucket $BUCKET_NAME
        
        Write-Host ""
        Write-Host "Document upload should now work!" -ForegroundColor Green
        Write-Host "Test at: https://dev.dwfkamikpgffo.amplifyapp.com/admin" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to apply CORS configuration" -ForegroundColor Red
        Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    }
} finally {
    # Clean up temp file
    Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
}
