# Cognito Diagnostic Script
# This script will check your Cognito setup and identify issues with user management

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cognito Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: List User Pools
Write-Host "Step 1: Finding Cognito User Pools..." -ForegroundColor Yellow
Write-Host ""

$userPools = aws cognito-idp list-user-pools --max-results 10 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to list user pools" -ForegroundColor Red
    Write-Host "Make sure AWS CLI is configured with valid credentials" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}

$poolsJson = $userPools | ConvertFrom-Json
$aissPools = $poolsJson.UserPools | Where-Object { $_.Name -like "*aisss*" }

if ($aissPools.Count -eq 0) {
    Write-Host "No AISSS user pools found!" -ForegroundColor Red
    Write-Host "All user pools:" -ForegroundColor Yellow
    $poolsJson.UserPools | ForEach-Object {
        Write-Host "  - $($_.Name) (ID: $($_.Id))" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Please enter your User Pool ID manually:" -ForegroundColor Yellow
    $USER_POOL_ID = Read-Host "User Pool ID"
} else {
    Write-Host "Found AISSS User Pools:" -ForegroundColor Green
    $aissPools | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Green
        Write-Host "    ID: $($_.Id)" -ForegroundColor Cyan
        Write-Host "    Created: $($_.CreationDate)" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($aissPools.Count -eq 1) {
        $USER_POOL_ID = $aissPools[0].Id
        Write-Host "Using User Pool ID: $USER_POOL_ID" -ForegroundColor Green
    } else {
        Write-Host "Using first pool: $($aissPools[0].Name)" -ForegroundColor Yellow
        $USER_POOL_ID = $aissPools[0].Id
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Check for Groups
Write-Host "Step 2: Checking for User Groups..." -ForegroundColor Yellow
Write-Host ""

$groups = aws cognito-idp list-groups --user-pool-id $USER_POOL_ID 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to list groups" -ForegroundColor Red
    Write-Host $groups -ForegroundColor Red
    exit 1
}

$groupsJson = $groups | ConvertFrom-Json

if ($groupsJson.Groups.Count -eq 0) {
    Write-Host "NO GROUPS FOUND!" -ForegroundColor Red
    Write-Host ""
    Write-Host "This is likely the issue!" -ForegroundColor Yellow
    Write-Host "The Lambda expects 'Administrators' and 'Students' groups" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Would you like me to create them now? (Y/N)" -ForegroundColor Cyan
    $createGroups = Read-Host
    
    if ($createGroups -eq "Y" -or $createGroups -eq "y") {
        Write-Host ""
        Write-Host "Creating 'Administrators' group..." -ForegroundColor Yellow
        aws cognito-idp create-group `
            --group-name "Administrators" `
            --user-pool-id $USER_POOL_ID `
            --description "Admin users with full access" `
            --precedence 1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Created 'Administrators' group" -ForegroundColor Green
        } else {
            Write-Host "  Failed to create 'Administrators' group" -ForegroundColor Red
        }
        
        Write-Host "Creating 'Students' group..." -ForegroundColor Yellow
        aws cognito-idp create-group `
            --group-name "Students" `
            --user-pool-id $USER_POOL_ID `
            --description "Regular student users" `
            --precedence 2
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Created 'Students' group" -ForegroundColor Green
        } else {
            Write-Host "  Failed to create 'Students' group" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Groups created successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "Found $($groupsJson.Groups.Count) group(s):" -ForegroundColor Green
    Write-Host ""
    
    $hasAdministrators = $false
    $hasStudents = $false
    
    foreach ($group in $groupsJson.Groups) {
        Write-Host "  Group: $($group.GroupName)" -ForegroundColor Cyan
        Write-Host "    Description: $($group.Description)" -ForegroundColor Gray
        Write-Host "    Created: $($group.CreationDate)" -ForegroundColor Gray
        Write-Host ""
        
        if ($group.GroupName -eq "Administrators") { $hasAdministrators = $true }
        if ($group.GroupName -eq "Students") { $hasStudents = $true }
    }
    
    if (-not $hasAdministrators) {
        Write-Host "WARNING: 'Administrators' group is missing!" -ForegroundColor Red
        Write-Host "Create it? (Y/N)" -ForegroundColor Yellow
        $create = Read-Host
        if ($create -eq "Y" -or $create -eq "y") {
            aws cognito-idp create-group --group-name "Administrators" --user-pool-id $USER_POOL_ID --description "Admin users" --precedence 1
            Write-Host "  Created 'Administrators' group" -ForegroundColor Green
        }
    } else {
        Write-Host "  'Administrators' group exists" -ForegroundColor Green
    }
    
    if (-not $hasStudents) {
        Write-Host "WARNING: 'Students' group is missing!" -ForegroundColor Red
        Write-Host "Create it? (Y/N)" -ForegroundColor Yellow
        $create = Read-Host
        if ($create -eq "Y" -or $create -eq "y") {
            aws cognito-idp create-group --group-name "Students" --user-pool-id $USER_POOL_ID --description "Student users" --precedence 2
            Write-Host "  Created 'Students' group" -ForegroundColor Green
        }
    } else {
        Write-Host "  'Students' group exists" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Check Users
Write-Host "Step 3: Checking Users..." -ForegroundColor Yellow
Write-Host ""

$users = aws cognito-idp list-users --user-pool-id $USER_POOL_ID --limit 10 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to list users" -ForegroundColor Red
    Write-Host $users -ForegroundColor Red
    exit 1
}

$usersJson = $users | ConvertFrom-Json

Write-Host "Found $($usersJson.Users.Count) user(s):" -ForegroundColor Green
Write-Host ""

foreach ($user in $usersJson.Users) {
    Write-Host "  Username: $($user.Username)" -ForegroundColor Cyan
    Write-Host "    Status: $($user.UserStatus)" -ForegroundColor Gray
    Write-Host "    Enabled: $($user.Enabled)" -ForegroundColor Gray
    Write-Host "    Created: $($user.UserCreateDate)" -ForegroundColor Gray
    
    # Get attributes
    $email = ($user.Attributes | Where-Object { $_.Name -eq "email" }).Value
    $givenName = ($user.Attributes | Where-Object { $_.Name -eq "given_name" }).Value
    $familyName = ($user.Attributes | Where-Object { $_.Name -eq "family_name" }).Value
    
    if ($email) { Write-Host "    Email: $email" -ForegroundColor Gray }
    if ($givenName -or $familyName) { 
        Write-Host "    Name: $givenName $familyName" -ForegroundColor Gray 
    }
    
    # Check groups
    $userGroups = aws cognito-idp admin-list-groups-for-user --username $user.Username --user-pool-id $USER_POOL_ID 2>&1 | ConvertFrom-Json
    if ($userGroups.Groups.Count -gt 0) {
        Write-Host "    Groups: $($userGroups.Groups.GroupName -join ', ')" -ForegroundColor Yellow
    } else {
        Write-Host "    Groups: (none)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Username Format Check
Write-Host "Step 4: Username Format Analysis" -ForegroundColor Yellow
Write-Host ""

$isEmail = $false
$isUUID = $false

foreach ($user in $usersJson.Users) {
    if ($user.Username -match "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$") {
        $isUUID = $true
    } elseif ($user.Username -match "@") {
        $isEmail = $true
    }
}

if ($isUUID) {
    Write-Host "  Username format: UUID (e.g., '550e8400-e29b-41d4-a716-446655440000')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ISSUE FOUND!" -ForegroundColor Red
    Write-Host "  The Lambda uses 'email' as the Cognito username," -ForegroundColor Yellow
    Write-Host "  but Cognito is using UUIDs (sub) as usernames." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  FIX NEEDED: Update Lambda to use userId (sub) instead of email" -ForegroundColor Yellow
} elseif ($isEmail) {
    Write-Host "  Username format: Email" -ForegroundColor Green
    Write-Host "  This matches what the Lambda expects" -ForegroundColor Green
} else {
    Write-Host "  Username format: Unknown" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 5: Summary
Write-Host "DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "User Pool ID: $USER_POOL_ID" -ForegroundColor White
Write-Host ""

# Check issues
$issues = @()
$fixes = @()

if ($groupsJson.Groups.Count -eq 0) {
    $issues += "No groups exist"
    $fixes += "Create 'Administrators' and 'Students' groups (prompted above)"
}

$hasAdminGroup = $groupsJson.Groups | Where-Object { $_.GroupName -eq "Administrators" }
$hasStudentGroup = $groupsJson.Groups | Where-Object { $_.GroupName -eq "Students" }

if (-not $hasAdminGroup) {
    $issues += "'Administrators' group missing"
    $fixes += "Create 'Administrators' group (prompted above)"
}

if (-not $hasStudentGroup) {
    $issues += "'Students' group missing"
    $fixes += "Create 'Students' group (prompted above)"
}

if ($isUUID) {
    $issues += "Username format mismatch (Lambda expects email, Cognito uses UUID)"
    $fixes += "Update Lambda to use userId (sub) instead of email"
}

if ($usersJson.Users.Count -eq 0) {
    $issues += "No users found in the pool"
    $fixes += "Create test users via Cognito console or CLI"
}

if ($issues.Count -eq 0) {
    Write-Host "No issues found!" -ForegroundColor Green
    Write-Host "User management should work correctly." -ForegroundColor Green
} else {
    Write-Host "Issues Found:" -ForegroundColor Red
    Write-Host ""
    for ($i = 0; $i -lt $issues.Count; $i++) {
        Write-Host "  $($i + 1). $($issues[$i])" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Recommended Fixes:" -ForegroundColor Cyan
    Write-Host ""
    for ($i = 0; $i -lt $fixes.Count; $i++) {
        Write-Host "  $($i + 1). $($fixes[$i])" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Save report
$reportFile = "cognito-diagnostic-report.txt"
$report = @"
COGNITO DIAGNOSTIC REPORT
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

User Pool ID: $USER_POOL_ID

GROUPS:
$($groupsJson.Groups | ForEach-Object { "  - $($_.GroupName)" } | Out-String)

USERS:
$($usersJson.Users | ForEach-Object { 
    "  Username: $($_.Username)`n" +
    "  Email: $(($_.Attributes | Where-Object { $_.Name -eq 'email' }).Value)`n" +
    "  Status: $($_.UserStatus)`n"
} | Out-String)

USERNAME FORMAT:
$(if ($isUUID) { "  UUID (sub)" } elseif ($isEmail) { "  Email" } else { "  Unknown" })

ISSUES FOUND:
$($issues | ForEach-Object { "  - $_" } | Out-String)

RECOMMENDED FIXES:
$($fixes | ForEach-Object { "  - $_" } | Out-String)
"@

$report | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "Report saved to: $reportFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. If groups were created, test user management in the web UI" -ForegroundColor White
Write-Host "  2. If username mismatch exists, I'll update the Lambda code" -ForegroundColor White
Write-Host "  3. Share the report file if you need help" -ForegroundColor White
Write-Host ""
