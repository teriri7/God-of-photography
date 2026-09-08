Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\src\assets\icon.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

$sizes = @(
    @{ Path = "android\app\src\main\res\mipmap-mdpi\ic_launcher.png"; Size = 48 },
    @{ Path = "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png"; Size = 48 },
    @{ Path = "android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png"; Size = 48 },
    @{ Path = "android\app\src\main\res\mipmap-hdpi\ic_launcher.png"; Size = 72 },
    @{ Path = "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png"; Size = 72 },
    @{ Path = "android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png"; Size = 72 },
    @{ Path = "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png"; Size = 96 },
    @{ Path = "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"; Size = 96 },
    @{ Path = "android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png"; Size = 96 },
    @{ Path = "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"; Size = 144 },
    @{ Path = "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"; Size = 144 },
    @{ Path = "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png"; Size = 144 },
    @{ Path = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"; Size = 192 },
    @{ Path = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"; Size = 192 },
    @{ Path = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png"; Size = 192 },
    @{ Path = "public\icon.png"; Size = 512 },
    @{ Path = "public\favicon.png"; Size = 128 },
    @{ Path = "src\assets\hero.png"; Size = 512 }
)

foreach ($item in $sizes) {
    $fullPath = Join-Path "D:\code\mb" $item.Path
    $dir = [System.IO.Path]::GetDirectoryName($fullPath)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    
    $bmp = New-Object System.Drawing.Bitmap($item.Size, $item.Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $item.Size, $item.Size)
    $bmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $($item.Path)"
}

$src.Dispose()
Write-Host "All icons generated successfully!"
