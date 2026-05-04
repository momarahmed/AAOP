<?php

namespace App\Services\Policy;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * T-F12-01 — evaluate stored Rego via OPA CLI (embedded binary in Docker image).
 *
 * Policies MUST expose `package aaop` with boolean `allow` and optional `violations`
 * set (`violations[msg] { ... }`). Example: `allow { count(violations) == 0 }`.
 */
final class OpaPolicyEvaluator
{
    public function __construct(private readonly string $opaBinary = '') {}

    public static function make(): self
    {
        return new self((string) config('services.opa.binary', 'opa'));
    }

    /**
     * @param  array<string, mixed>  $payload  merged under `input.payload` for Rego
     * @return array{allow: bool, violations: list<string>, raw?: mixed, evaluator: string}
     */
    public function evaluate(?string $rego, array $payload): array
    {
        $rego = $rego !== null ? trim($rego) : '';

        if ($rego === '') {
            return [
                'allow'      => true,
                'violations' => [],
                'evaluator'  => 'no-rego',
            ];
        }

        $binary = $this->resolveBinary();
        if ($binary === null) {
            if (config('services.opa.permissive_without_binary') === true) {
                return [
                    'allow'      => true,
                    'violations' => [],
                    'evaluator'  => 'opa_missing_permissive',
                ];
            }

            return [
                'allow'      => false,
                'violations' => ['opa_binary_unavailable'],
                'evaluator'  => 'opa_missing',
            ];
        }

        $regoFile = tempnam(sys_get_temp_dir(), 'aaop_r_');
        $inFile = tempnam(sys_get_temp_dir(), 'aaop_i_');
        if ($regoFile === false || $inFile === false) {
            return [
                'allow'      => false,
                'violations' => ['opa_temp_file_failed'],
                'evaluator'  => 'opa_error',
            ];
        }

        try {
            file_put_contents($regoFile, $rego."\n");
            $document = ['payload' => $payload];
            file_put_contents($inFile, json_encode($document, JSON_THROW_ON_ERROR));

            $process = new Process([
                $binary, 'eval',
                '-f', 'json',
                '-d', $regoFile,
                '-i', $inFile,
                'data.aaop',
            ]);
            $process->setTimeout(8);
            $process->run();

            if (! $process->isSuccessful()) {
                Log::notice('OPA eval failed', [
                    'stderr' => $process->getErrorOutput(),
                    'stdout' => $process->getOutput(),
                ]);

                return [
                    'allow'      => false,
                    'violations' => ['opa_eval_failed'],
                    'evaluator'  => 'opa_error',
                    'raw'        => $process->getErrorOutput() ?: $process->getOutput(),
                ];
            }

            $decoded = json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR);
            $aaop = $this->unwrapOpaResult($decoded);

            $violations = [];
            if (isset($aaop['violations'])) {
                $violations = is_array($aaop['violations'])
                    ? array_values(array_map('strval', $aaop['violations']))
                    : [strval($aaop['violations'])];
            }

            if ($aaop === []) {
                return [
                    'allow'      => false,
                    'violations' => ['opa_empty_result'],
                    'evaluator'  => 'opa_error',
                    'raw'        => $decoded,
                ];
            }

            $allow = array_key_exists('allow', $aaop)
                ? (bool) $aaop['allow']
                : ($violations === []);

            return [
                'allow'      => $allow,
                'violations' => $violations,
                'evaluator'  => 'opa',
                'raw'        => $aaop,
            ];
        } catch (Throwable $e) {
            Log::notice('OPA eval exception', ['e' => $e->getMessage()]);

            return [
                'allow'      => false,
                'violations' => ['opa_exception'],
                'evaluator'  => 'opa_error',
                'raw'        => $e->getMessage(),
            ];
        } finally {
            @unlink($regoFile);
            @unlink($inFile);
        }
    }

    /**
     * @param  mixed  $decoded
     */
    private function unwrapOpaResult(mixed $decoded): array
    {
        if (! is_array($decoded)) {
            return [];
        }
        // `opa eval -f json data.aaop` → { "result": [ { "expressions": [ { "value": { ... } } ] } ] }
        if (isset($decoded['result'][0]['expressions'][0]['value']) && is_array($decoded['result'][0]['expressions'][0]['value'])) {
            return $decoded['result'][0]['expressions'][0]['value'];
        }
        // Sometimes direct object when using `-f values` callers — accept flat
        if (isset($decoded['allow'])) {
            return $decoded;
        }

        return [];
    }

    private function resolveBinary(): ?string
    {
        if ($this->opaBinary !== '' && is_executable($this->opaBinary)) {
            return $this->opaBinary;
        }
        if ($this->opaBinary !== '') {
            $p = (new ExecutableFinder())->find($this->opaBinary);
            if ($p !== null) {
                return $p;
            }
        }

        return (new ExecutableFinder())->find('opa');
    }
}
