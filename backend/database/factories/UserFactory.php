<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'email'             => fake()->unique()->safeEmail(),
            'display_name'      => fake()->name(),
            'hashed_password'   => Hash::make('Password!123'),
            'is_admin'          => false,
            'mfa_enabled'       => false,
            'email_verified_at' => now(),
        ];
    }
}
