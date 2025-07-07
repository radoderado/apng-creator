# Required dependencies
$dependencies = @(
    "https://cdn.jsdelivr.net/npm/pako@1.0.7/dist/pako.min.js",
    "https://cdn.jsdelivr.net/npm/upng-js@1.4.2/dist/upng.min.js",
    "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js"
)

# Download directory
$downloadDir = Join-Path $PSScriptRoot "dependencies"
if (-not (Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir
}

# Download each dependency
foreach ($url in $dependencies) {
    $filename = Split-Path $url -Leaf
    $targetPath = Join-Path $downloadDir $filename
    
    Write-Host "Downloading $filename..."
    Invoke-WebRequest -Uri $url -OutFile $targetPath
    
    Write-Host "$filename downloaded successfully"
}

# Copy downloaded files to root directory
Copy-Item (Join-Path $downloadDir "pako.min.js") -Destination "pako.v1.0.7.js"
Copy-Item (Join-Path $downloadDir "upng.min.js") -Destination "upng.v1.4.2.js"
Copy-Item (Join-Path $downloadDir "ffmpeg.min.js") -Destination "ffmpeg.min.js"
