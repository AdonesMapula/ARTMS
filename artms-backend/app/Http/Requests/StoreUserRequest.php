<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $deptId = $this->department_id;
        if ($deptId === '' || $deptId === '0' || $deptId === 0 || $deptId === 'null' || $deptId === 'undefined') {
            $deptId = null;
        }

        $this->merge([
            'first_name'    => is_string($this->first_name) ? trim($this->first_name) : $this->first_name,
            'middle_name'   => (is_string($this->middle_name) && trim($this->middle_name) !== '') ? trim($this->middle_name) : null,
            'last_name'     => is_string($this->last_name) ? trim($this->last_name) : $this->last_name,
            'email'         => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
            'password'      => (is_string($this->password) && trim($this->password) !== '') ? trim($this->password) : null,
            'department_id' => $deptId,
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name'    => ['required', 'string', 'max:255'],
            'middle_name'   => ['nullable', 'string', 'max:255'],
            'last_name'     => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'password'      => $this->filled('password') ? ['string', 'min:8'] : ['nullable'],
            'role'          => ['required', 'string', function ($attribute, $value, $fail) {
                $standard = ['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'];
                if (in_array($value, $standard, true)) {
                    return;
                }
                if (DB::table('custom_roles')->where('key', $value)->orWhere('name', $value)->exists()) {
                    return;
                }
                $fail("The selected role ({$value}) is invalid.");
            }],
            'department_id' => ['nullable', 'exists:departments,id'],
            'avatar'        => ['nullable'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Only check if all name fields are present
            if ($this->filled('first_name') && $this->filled('last_name')) {
                $firstName = trim($this->first_name);
                $middleName = trim($this->middle_name ?? '');
                $lastName = trim($this->last_name);
                
                // Construct full name
                $fullName = trim(preg_replace('/\s+/', ' ', "{$firstName} {$middleName} {$lastName}"));
                
                // Check if an active user with the same full name already exists
                $exists = DB::table('users')
                    ->where('name', $fullName)
                    ->whereNull('deleted_at')
                    ->exists();
                
                if ($exists) {
                    $validator->errors()->add('name', 'An active user with this name already exists.');
                }
            }
        });
    }
}
