<?php
/**
 * Better Breakfast — cPanel deploy script
 *
 * Triggered by GitHub Actions after a successful build.
 * Place this file outside public/ and protect it with a secret token.
 *
 * Usage: POST https://betterbreakfast.ro/deploy.php
 *        Header: X-Deploy-Token: <DEPLOY_SECRET>
 */

$secret = getenv('DEPLOY_SECRET') ?: '';
$token  = $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '';

if (! $secret || ! hash_equals($secret, $token)) {
    http_response_code(403);
    exit('Forbidden');
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

$output = [];
foreach ($commands as $cmd) {
    $result = shell_exec($cmd);
    $output[] = "$ {$cmd}\n{$result}";
}

header('Content-Type: text/plain');
echo implode("\n---\n", $output);
