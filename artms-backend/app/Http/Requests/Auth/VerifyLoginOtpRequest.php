<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyLoginOtpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'verification_id' => ['required', 'string', 'max:64'],
            'otp'             => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ];
    }

    /**
     * Custom error messages.
     */
    public function messages(): array
    {
        return [
            'verification_id.required' => 'The verification session ID is required.',
            'otp.required'             => 'Please enter the 6-digit verification code.',
            'otp.size'                 => 'The verification code must be exactly 6 digits.',
            'otp.regex'                => 'The verification code must contain numbers only.',
        ];
    }
}
