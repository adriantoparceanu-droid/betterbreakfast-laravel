<?php
/**
 * Better Breakfast — cPanel deploy script
 *
 * Accepts token via:
 *   - Browser:        GET https://betterbreakfast.eu/deploy.php?token=SECRET
 *   - GitHub Actions: POST with header X-Deploy-Token: SECRET
 *
 * Set DEPLOY_SECRET in .env on the server.
 */

// Read token from URL param (browser) or header (GitHub Actions)
$secret = '';
if (function_exists('getenv')) {
    $secret = getenv('DEPLOY_SECRET') ?: '';
}
// Fallback: read directly from .env if getenv not populated
if (! $secret) {
    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        foreach (file($envFile) as $line) {
            if (str_starts_with(trim($line), 'DEPLOY_SECRET=')) {
                $secret = trim(explode('=', $line, 2)[1]);
                break;
            }
        }
    }
}

$token = $_GET['token'] ?? $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '';

if (! $secret || ! hash_equals($secret, $token)) {
    http_response_code(403);
    header('Content-Type: text/plain');
    exit("403 Forbidden\n");
}

$projectRoot = __DIR__;
$php         = PHP_BINARY;

$commands = [
    "cd {$projectRoot} && git pull origin main 2>&1",
    "{$php} {$projectRoot}/artisan down --retry=5 2>&1",
    "{$php} {$projectRoot}/artisan migrate --force 2>&1",
    "{$php} {$projectRoot}/artisan config:cache 2>&1",
    "{$php} {$projectRoot}/artisan route:cache 2>&1",
    "{$php} {$projectRoot}/artisan view:cache 2>&1",
    "{$php} {$projectRoot}/artisan up 2>&1",
];

header('Content-Type: text/plain; charset=utf-8');
foreach ($commands as $cmd) {
    echo "$ {$cmd}\n";
    echo shell_exec($cmd);
    echo "\n---\n";
    flush();
}
echo "Deploy complete.\n";
