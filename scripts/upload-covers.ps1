# Upload local cover images to the production server.
# Usage: .\scripts\upload-covers.ps1 -ServerUrl https://your-server.com [-SourceDir <path>] [-Pattern *.jpg]
#
# Examples:
#   Upload named Audiobookshelf covers (recommended):
#     .\scripts\upload-covers.ps1 -ServerUrl https://bookclub.example.com -SourceDir "C:\Users\panda\OneDrive\Audiobookshelf\audiobooks" -Recurse
#
#   Upload flat Books folder:
#     .\scripts\upload-covers.ps1 -ServerUrl https://bookclub.example.com -SourceDir "C:\Users\panda\OneDrive\Pictures\Books"

param(
    [Parameter(Mandatory)]
    [string]$ServerUrl,

    [string]$SourceDir = "C:\Users\panda\OneDrive\Audiobookshelf\audiobooks",

    [string]$Pattern = "*.jpg",

    [switch]$Recurse,

    [switch]$DryRun
)

$uploadUrl = "$($ServerUrl.TrimEnd('/'))/api/upload"

$getParams = @{ Path = $SourceDir; Filter = $Pattern }
if ($Recurse) { $getParams.Recurse = $true }

$files = Get-ChildItem @getParams -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' }

Write-Host "Found $($files.Count) image(s) in '$SourceDir'"
if ($DryRun) { Write-Host "[DRY RUN] No files will be uploaded.`n" }

$success = 0; $skipped = 0; $failed = 0

foreach ($file in $files) {
    if ($DryRun) {
        Write-Host "  [DRY] Would upload: $($file.Name)"
        continue
    }
    try {
        $form = [System.Net.Http.MultipartFormDataContent]::new()
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
        $mimeType = if ($file.Extension -eq '.png') { 'image/png' } else { 'image/jpeg' }
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new($mimeType)
        $form.Add($fileContent, 'file', $file.Name)

        $client = [System.Net.Http.HttpClient]::new()
        $response = $client.PostAsync($uploadUrl, $form).Result
        $body = $response.Content.ReadAsStringAsync().Result

        if ($response.IsSuccessStatusCode) {
            Write-Host "  [OK] $($file.Name) → $body"
            $success++
        } else {
            Write-Warning "  [FAIL] $($file.Name) — HTTP $($response.StatusCode): $body"
            $failed++
        }
        $client.Dispose()
    } catch {
        Write-Warning "  [ERROR] $($file.Name): $_"
        $failed++
    }
}

Write-Host "`nDone. Success: $success  Failed: $failed  Skipped: $skipped"
