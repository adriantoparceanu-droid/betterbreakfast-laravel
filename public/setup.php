<?php
/**
 * Better Breakfast — first-run setup script
 *
 * Run ONCE after git clone:
 *   https://betterbreakfast.eu/setup.php?token=SECRET
 *
 * DELETE this file after setup is complete.
 */

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

$token = $_GET['token'] ?? '';

if (! $expected || ! hash_equals($expected, $token)) {
    http_response_code(403);
    header('Content-Type: text/plain');
    exit("403 Forbidden\n");
}

function run(string $cmd): array
{
    $desc = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $proc = proc_open($cmd, $desc, $pipes);
    if (! is_resource($proc)) return ['out' => '', 'code' => -1];
    $out  = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    $code = proc_close($proc);
    return ['out' => trim($out), 'code' => $code];
}

function findPhp(): string
{
    foreach ([
        '/opt/cpanel/ea-php84/root/usr/bin/php',
        '/opt/cpanel/ea-php83/root/usr/bin/php',
        '/usr/local/bin/php84',
        '/usr/local/bin/php83',
        '/opt/alt/php84/usr/bin/php',
    ] as $p) {
        if (is_executable($p)) return $p;
    }
    return PHP_BINARY;
}

function findComposer(string $php, string $root): string
{
    $candidates = [
        '/usr/local/bin/composer',
        '/usr/bin/composer',
        '/opt/cpanel/composer/bin/composer',
    ];
    foreach ($candidates as $path) {
        if (is_executable($path)) return $path;
    }
    $out = '';
    $desc = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $proc = proc_open('which composer', $desc, $pipes);
    if (is_resource($proc)) {
        $out = trim(stream_get_contents($pipes[1]));
        fclose($pipes[1]); fclose($pipes[2]);
        proc_close($proc);
    }
    if ($out && is_executable($out)) return $out;

    $homeDir = dirname($root);
    foreach (["$homeDir/composer.phar", "$root/composer.phar"] as $phar) {
        if (is_readable($phar)) return "$php $phar";
    }

    $phar = "$homeDir/composer.phar";
    $data = @file_get_contents('https://getcomposer.org/composer-stable.phar');
    if ($data !== false && file_put_contents($phar, $data) !== false) {
        return "$php $phar";
    }

    return 'composer';
}

$root     = dirname(__DIR__);
$php      = findPhp();
$composer = findComposer($php, $root);

$steps = [
    "cd $root && $composer install --no-dev --optimize-autoloader 2>&1",
    "$php $root/artisan key:generate --force",
    "$php $root/artisan migrate --force",
    "$php $root/artisan db:seed --force",
    "$php $root/artisan optimize",
];

$output = [
    'php_used'    => $php,
    'php_version' => trim(run("$php -r 'echo PHP_VERSION;'"  )['out']),
    'steps'       => [],
    'note'        => 'DELETE public/setup.php after this runs successfully!',
];

foreach ($steps as $cmd) {
    $result            = run($cmd);
    $output['steps'][] = ['cmd' => $cmd, 'out' => $result['out'], 'code' => $result['code']];
    if ($result['code'] !== 0) break;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
