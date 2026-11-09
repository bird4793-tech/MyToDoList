# MyToDoList - 輕量本機 HTTP 伺服器 (PowerShell)
# 支援 Windows 原生環境，無需安裝 Node.js 或 Python

$port = 5000
$root = $PSScriptRoot

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  MyToDoList - Firebase 多人協作待辦清單本機伺服器" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "專案目錄: $root" -ForegroundColor Gray
Write-Host "監聽網址: http://localhost:$port/" -ForegroundColor Yellow
Write-Host "請在瀏覽器中開啟上方網址，按 Ctrl+C 可停止伺服器" -ForegroundColor DarkGray
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
}

# 優先嘗試 HttpListener
$useHttpListener = [System.Net.HttpListener]::IsSupported

if ($useHttpListener) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Prefixes.Add("http://127.0.0.1:$port/")
        $listener.Start()
        Write-Host "HTTP 伺服器已啟動 (模式: HttpListener)" -ForegroundColor Green

        # 自動開啟預設瀏覽器
        Start-Process "http://localhost:$port"

        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $urlPath = $request.Url.LocalPath
            if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
                $urlPath = "/index.html"
            }

            $localPath = [System.IO.Path]::Combine($root, $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar))

            if ([System.IO.File]::Exists($localPath)) {
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                
                $response.ContentType = $contentType
                $response.StatusCode = 200
                $response.Headers.Add("Access-Control-Allow-Origin", "*")

                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }

            $response.OutputStream.Close()
        }
    } catch {
        Write-Host "HttpListener 啟動受限，切換至 TcpListener 模式..." -ForegroundColor Yellow
        $useHttpListener = $false
        if ($listener -and $listener.IsListening) { $listener.Stop() }
    }
}

if (-not $useHttpListener) {
    $ip = [System.Net.IPAddress]::Loopback
    $tcpListener = New-Object System.Net.Sockets.TcpListener($ip, $port)
    $tcpListener.Start()
    Write-Host "HTTP 伺服器已啟動 (模式: TcpListener)" -ForegroundColor Green
    
    Start-Process "http://localhost:$port"

    while ($true) {
        $client = $tcpListener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        $requestLine = $reader.ReadLine()
        if ($requestLine) {
            $parts = $requestLine.Split(" ")
            if ($parts.Length -ge 2) {
                $rawPath = $parts[1]
                $cleanPath = $rawPath.Split("?")[0]
                if ($cleanPath -eq "/" -or [string]::IsNullOrWhiteSpace($cleanPath)) {
                    $cleanPath = "/index.html"
                }
                $localPath = [System.IO.Path]::Combine($root, $cleanPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar))

                if ([System.IO.File]::Exists($localPath)) {
                    $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                    $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                    $bytes = [System.IO.File]::ReadAllBytes($localPath)

                    $header = "HTTP/1.1 200 OK`r`n" +
                              "Content-Type: $contentType`r`n" +
                              "Content-Length: $($bytes.Length)`r`n" +
                              "Access-Control-Allow-Origin: *`r`n" +
                              "Connection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                } else {
                    $notFound = "HTTP/1.1 404 Not Found`r`nContent-Length: 13`r`nConnection: close`r`n`r`n404 Not Found"
                    $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
                    $stream.Write($notFoundBytes, 0, $notFoundBytes.Length)
                }
            }
        }
        $client.Close()
    }
}

