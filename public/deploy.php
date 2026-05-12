<?php
/**
 * Better Breakfast — cPanel deploy script
 *
 * Browser:         GET https://betterbreakfast.eu/deploy.php?token=SECRET
 * GitHub Actions:  POST with header X-Deploy-Token: SECRET
 *
 * Optional params:
 *   ?log=1    — view last 150 lines of laravel.log
 *   ?info=1   — phpinfo() for diagnostics
 *
 * DEPLOY_TOKEN must be set in .env
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

$expected = '';
$envFile  = dirname(__DIR__) . '/.env';

if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), 'DEPLOY_TOKEN=')) {
            $expected = trim(substr($line, strpos($line, '=') + 1));
            break;
        }
    }
}

$token = $_GET['token'] ?? $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '';

if (! $expected || ! hash_equals($expected, $token)) {
    http_response_code(403);
    header('Content-Type: text/plain');
    exit("403 Forbidden\n");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(string $cmd): array
{
    $desc = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $proc = proc_open($cmd, $desc, $pipes);
    if (! is_resource($proc)) {
        return ['out' => '', 'code' => -1];
    }
    $out  = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    return ['out' => trim($out), 'code' => $code];
}

function findPhp(): string
{
    $candidates = [
        '/opt/cpanel/ea-php84/root/usr/bin/php',
        '/opt/cpanel/ea-php83/root/usr/bin/php',
        '/usr/local/bin/php84',
        '/usr/local/bin/php83',
        '/opt/alt/php84/usr/bin/php',
        '/opt/alt/php83/usr/bin/php',
    ];
    foreach ($candidates as $path) {
        if (is_executable($path)) return $path;
    }
    return PHP_BINARY;
}

function findGit(): string
{
    $cpanelGit = '/usr/local/cpanel/3rdparty/bin/git';
    if (is_executable($cpanelGit)) return $cpanelGit;
    $which = trim(run('which git')['out']);
    return $which ?: 'git';
}

// ── Diagnostic routes ─────────────────────────────────────────────────────────

$root = dirname(__DIR__);

if (isset($_GET['log'])) {
    $logFile = $root . '/storage/logs/laravel.log';
    header('Content-Type: text/plain; charset=utf-8');
    if (! is_readable($logFile)) { echo "Log not found: $logFile"; exit; }
    $lines = file($logFile, FILE_IGNORE_NEW_LINES);
    echo implode("\n", array_slice($lines, -150));
    exit;
}

if (isset($_GET['info'])) { phpinfo(); exit; }

// ── Deploy ────────────────────────────────────────────────────────────────────

$php = findPhp();
$git = findGit();

$commands = [
    "$git -C $root reset --hard HEAD",
    "$git -C $root pull origin main",
    "cd $root && composer install --no-dev --optimize-autoloader 2>&1",
    "$php $root/artisan migrate --force",
    "$php $root/artisan optimize",
];

$output = [
    'php_used'    => $php,
    'php_version' => trim(run("$php -r 'echo PHP_VERSION;'"  )['out']),
    'steps'       => [],
];

foreach ($commands as $cmd) {
    $result             = run($cmd);
    $output['steps'][]  = ['cmd' => $cmd, 'out' => $result['out'], 'code' => $result['code']];
    if ($result['code'] !== 0) break;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
