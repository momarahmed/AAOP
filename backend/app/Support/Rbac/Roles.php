<?php

namespace App\Support\Rbac;

/**
 * AAOP workspace roles per PRD §17.6 FR-F1 / Implementation Plan T-F02-05.
 *
 * Order is significant — `OWNER` has the strongest default permissions, then
 * descending. The DB CHECK constraint on `memberships.role` mirrors this set.
 */
final class Roles
{
    public const OWNER  = 'owner';
    public const ADMIN  = 'admin';
    public const EDITOR = 'editor';
    public const RUNNER = 'runner';
    public const VIEWER = 'viewer';

    public const ALL = [
        self::OWNER,
        self::ADMIN,
        self::EDITOR,
        self::RUNNER,
        self::VIEWER,
    ];

    /** Roles allowed to mutate workflow definitions. */
    public const EDITORS = [self::OWNER, self::ADMIN, self::EDITOR];

    /** Roles allowed to start runs. */
    public const RUNNERS = [self::OWNER, self::ADMIN, self::EDITOR, self::RUNNER];

    /** Roles allowed to administer the workspace itself. */
    public const ADMINS = [self::OWNER, self::ADMIN];

    public static function rank(string $role): int
    {
        return match ($role) {
            self::OWNER  => 50,
            self::ADMIN  => 40,
            self::EDITOR => 30,
            self::RUNNER => 20,
            self::VIEWER => 10,
            default      => 0,
        };
    }

    public static function atLeast(?string $have, string $required): bool
    {
        return $have !== null && self::rank($have) >= self::rank($required);
    }
}
