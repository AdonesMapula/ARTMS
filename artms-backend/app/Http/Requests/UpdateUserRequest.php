<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('first_name') && is_string($this->first_name)) {
            $merge['first_name'] = trim($this->first_name);
        }
        if ($this->has('middle_name')) {
            $merge['middle_name'] = (is_string($this->middle_name) && trim($this->middle_name) !== '') ? trim($this->middle_name) : null;
        }
        if ($this->has('last_name') && is_string($this->last_name)) {
            $merge['last_name'] = trim($this->last_name);
        }
        if ($this->has('email') && is_string($this->email)) {
            $merge['email'] = strtolower(trim($this->email));
        }
        if ($this->has('password') && is_string($this->password)) {
            $merge['password'] = trim($this->password) !== '' ? trim($this->password) : null;
        }
        if ($this->has('password_confirmation') && is_string($this->password_confirmation)) {
            $merge['password_confirmation'] = trim($this->password_confirmation) !== '' ? trim($this->password_confirmation) : null;
        }
        if ($this->has('department_id')) {
            $deptId = $this->department_id;
            if ($deptId === '' || $deptId === '0' || $deptId === 0 || $deptId === 'null' || $deptId === 'undefined') {
                $deptId = null;
            }
            $merge['department_id'] = $deptId;
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $user = $this->route('user');
        $userId = $user instanceof \App\Models\User ? $user->id : $user;

        return [
            'first_name'    => ['sometimes', 'string', 'max:255'],
            'middle_name'   => ['nullable', 'string', 'max:255'],
            'last_name'     => ['sometimes', 'string', 'max:255'],
            'email'         => ['sometimes', 'email', 'max:255'],
            'password'      => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role'          => ['sometimes', 'string', function ($attribute, $value, $fail) {
                $standard = ['super_admin', 'developer', 'hr_admin', 'coo', 'department_head', 'employee'];
                if (in_array($value, $standard, true)) {
                    return;
                }
                if (DB::table('custom_roles')->where('key', $value)->orWhere('name', $value)->exists()) {
                    return;
                }
                $fail("The selected role ({$value}) is invalid.");
            }],
            'department_id' => ['nullable', 'exists:departments,id'],
            'is_active'     => ['sometimes', 'boolean'],
            'avatar'        => ['nullable'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = $this->route('user');
            $userId = $user instanceof \App\Models\User ? $user->id : (int) $user;

            // 1. Check email uniqueness against other users (active or archived)
            if ($this->filled('email')) {
                $email = strtolower(trim($this->email));
                $existingUser = DB::table('users')
                    ->where('email', $email)
                    ->where('id', '!=', $userId)
                    ->first();
                if ($existingUser) {
                    if ($existingUser->deleted_at !== null) {
                        $validator->errors()->add('email', 'This email address belongs to an archived account. Please restore the user or choose a different email.');
                    } else {
                        $validator->errors()->add('email', 'The email address has already been taken.');
                    }
                }
            }
            
            // 2. Only check if name fields are actually being changed
            $nameChanged = false;
            if ($this->filled('first_name') && $this->first_name !== ($user?->first_name ?? null)) {
                $nameChanged = true;
            }
            if ($this->filled('middle_name') && $this->middle_name !== ($user?->middle_name ?? null)) {
                $nameChanged = true;
            }
            if ($this->filled('last_name') && $this->last_name !== ($user?->last_name ?? null)) {
                $nameChanged = true;
            }
            
            if ($nameChanged) {
                $firstName = $this->filled('first_name') ? trim($this->first_name) : ($user?->first_name ?? '');
                $middleName = $this->filled('middle_name') ? trim($this->middle_name) : ($user?->middle_name ?? '');
                $lastName = $this->filled('last_name') ? trim($this->last_name) : ($user?->last_name ?? '');
                
                if ($firstName || $lastName) {
                    $fullName = trim(preg_replace('/\s+/', ' ', "{$firstName} {$middleName} {$lastName}"));
                    
                    $exists = DB::table('users')
                        ->where('name', $fullName)
                        ->where('id', '!=', $userId)
                        ->whereNull('deleted_at')
                        ->exists();
                    
                    if ($exists) {
                        $validator->errors()->add('name', 'An active user with this name already exists.');
                        $validator->errors()->add('first_name', 'An active user with this full name already exists.');
                    }
                }
            }
        });
    }
}
