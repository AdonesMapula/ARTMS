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

    public function rules(): array
    {
        return [
            'first_name'    => ['required', 'string', 'max:255'],
            'middle_name'   => ['nullable', 'string', 'max:255'],
            'last_name'     => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'unique:users,email'],
            'password'      => $this->filled('password') ? ['string', 'min:8'] : ['nullable'],
            'role'          => ['required', Rule::in(['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'])],
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
                $fullName = trim($firstName . ' ' . $middleName . ' ' . $lastName);
                
                // Check if a user with the same full name already exists
                $exists = DB::table('users')
                    ->where('name', $fullName)
                    ->exists();
                
                if ($exists) {
                    $validator->errors()->add('name', 'A user with this name already exists.');
                }
            }
        });
    }
}
