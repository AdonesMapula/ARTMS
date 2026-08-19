<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email'                 => is_string($this->email) ? trim($this->email) : $this->email,
            'otp'                   => is_string($this->otp) ? trim($this->otp) : $this->otp,
            'password'              => is_string($this->password) ? trim($this->password) : $this->password,
            'password_confirmation' => is_string($this->password_confirmation) ? trim($this->password_confirmation) : $this->password_confirmation,
        ]);
    }

    public function rules(): array
    {
        return [
            'email'                 => ['required', 'email', 'exists:users,email'],
            'otp'                   => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required'],
        ];
    }
}
