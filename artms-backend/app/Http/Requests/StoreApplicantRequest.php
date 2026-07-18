<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public route — anyone can apply
    }

    public function rules(): array
    {
        return [
            'job_posting_id'   => ['required', 'exists:job_postings,id'],
            'first_name'       => ['required', 'string', 'max:100'],
            'last_name'        => ['required', 'string', 'max:100'],
            'middle_name'      => ['nullable', 'string', 'max:100'],
            'email'            => ['required', 'email', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:20'],
            'date_of_birth'    => ['nullable', 'date', 'before:today'],
            'address'          => ['nullable', 'string', 'max:500'],
            'gender'           => ['nullable', 'string'],
            'civil_status'     => ['nullable', 'string'],
            'nationality'      => ['nullable', 'string'],
            'resume'           => ['required', 'file', 'mimes:pdf,doc,docx,txt', 'max:5120'],
            'informed_consent' => ['required'],
        ];
    }

    public function messages(): array
    {
        return [
            'resume.required'             => 'Please upload your resume.',
            'resume.mimes'                => 'Resume must be a PDF, DOC, DOCX, or TXT file.',
            'resume.max'                  => 'Resume must not exceed 5MB.',
            'informed_consent.required'   => 'You must accept the informed consent to proceed.',
        ];
    }

    /**
     * Normalize informed_consent so both "1", true, and "true" are accepted.
     */
    protected function prepareForValidation(): void
    {
        $raw = $this->input('informed_consent');
        $this->merge([
            'informed_consent' => in_array($raw, ['1', 1, 'true', true], true) ? '1' : $raw,
        ]);
    }
}
