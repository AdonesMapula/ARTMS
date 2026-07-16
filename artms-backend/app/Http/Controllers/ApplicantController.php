<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicantRequest;
use App\Models\AuditLog;
use App\Models\Applicant;
use App\Models\ApplicantDocument;
use App\Models\ApplicantNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ApplicantController extends Controller
{
    /**
     * GET /api/applicants — HR admin view with filters
     */
    public function index(Request $request): JsonResponse
    {
        $applicants = Applicant::with(['jobPosting.jobLibrary', 'jobPosting.department', 'aiEvaluation'])
            ->when($request->search, fn ($q) =>
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('application_id', 'like', "%{$request->search}%")
            )
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->job_posting_id, fn ($q) => $q->where('job_posting_id', $request->job_posting_id))
            ->when($request->is_shortlisted, fn ($q) => $q->where('is_shortlisted', true))
            ->orderByDesc(fn ($q) => $q->select('overall_score')->from('ai_evaluations')->whereColumn('applicant_id', 'applicants.id'))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($applicants);
    }

    /**
     * POST /api/applicants — Public submission
     */
    public function store(StoreApplicantRequest $request): JsonResponse
    {
        // Generate unique application ID
        $appId = 'APP-' . now()->year . '-' . str_pad(Applicant::withTrashed()->count() + 1, 5, '0', STR_PAD_LEFT);

        // Handle resume upload
        $resumePath = null;
        $originalName = null;
        if ($request->hasFile('resume')) {
            $file = $request->file('resume');
            $resumePath   = $file->store("resumes/{$appId}", 'local');
            $originalName = $file->getClientOriginalName();
        }

        $applicant = Applicant::create([
            'application_id'       => $appId,
            'job_posting_id'       => $request->job_posting_id,
            'first_name'           => $request->first_name,
            'last_name'            => $request->last_name,
            'middle_name'          => $request->middle_name,
            'email'                => $request->email,
            'phone'                => $request->phone,
            'date_of_birth'        => $request->date_of_birth,
            'address'              => $request->address,
            'gender'               => $request->gender,
            'civil_status'         => $request->civil_status,
            'nationality'          => $request->nationality,
            'resume_path'          => $resumePath,
            'resume_original_name' => $originalName,
            'informed_consent'     => true,
            'status'               => 'applied',
        ]);

        // Notify HR via email
        try {
            Mail::send('emails.new_application', ['applicant' => $applicant], function ($mail) {
                $mail->to(config('mail.hr_email', config('mail.from.address')))
                     ->subject("New Application Received — {$applicant->application_id}");
            });
        } catch (\Exception $e) {
            // Non-fatal: log but don't fail the submission
        }

        return response()->json([
            'message'        => 'Application submitted successfully.',
            'application_id' => $appId,
        ], 201);
    }

    public function show(Applicant $applicant): JsonResponse
    {
        return response()->json([
            'applicant' => $applicant->load(
                'jobPosting.jobLibrary',
                'jobPosting.department',
                'documents',
                'aiEvaluation',
                'interviews',
                'notes.author'
            ),
        ]);
    }

    public function update(Request $request, Applicant $applicant): JsonResponse
    {
        $data = $request->validate([
            'status'         => ['sometimes', 'string'],
            'is_shortlisted' => ['sometimes', 'boolean'],
            'ranking'        => ['nullable', 'integer'],
        ]);

        $applicant->update($data);

        return response()->json(['message' => 'Applicant updated.', 'applicant' => $applicant->fresh()]);
    }

    /**
     * PATCH /api/applicants/{id}/hire
     */
    public function hire(Applicant $applicant): JsonResponse
    {
        $applicant->update(['status' => 'hired']);

        // Notify applicant
        try {
            Mail::send('emails.hired', ['applicant' => $applicant], function ($mail) use ($applicant) {
                $mail->to($applicant->email)
                     ->subject('Congratulations! Job Offer — ARTMS');
            });
        } catch (\Exception $e) {
            // Non-fatal
        }

        AuditLog::record('hire', 'applicant', "Applicant hired: {$applicant->application_id}");

        return response()->json(['message' => 'Applicant marked as hired. Email notification sent.']);
    }

    /**
     * PATCH /api/applicants/{id}/reject
     */
    public function reject(Request $request, Applicant $applicant): JsonResponse
    {
        $request->validate(['remarks' => ['nullable', 'string']]);

        $applicant->update(['status' => 'rejected']);

        AuditLog::record('reject', 'applicant', "Applicant rejected: {$applicant->application_id}");

        return response()->json(['message' => 'Applicant rejected.']);
    }

    /**
     * POST /api/applicants/{id}/notes
     */
    public function addNote(Request $request, Applicant $applicant): JsonResponse
    {
        $request->validate(['note' => ['required', 'string']]);

        $note = ApplicantNote::create([
            'applicant_id' => $applicant->id,
            'created_by'   => auth()->id(),
            'note'         => $request->note,
        ]);

        return response()->json(['message' => 'Note added.', 'note' => $note->load('author')], 201);
    }

    /**
     * GET /api/applicants/{id}/track — public tracking by application_id token
     */
    public function track(Request $request): JsonResponse
    {
        $request->validate(['application_id' => ['required', 'string']]);

        $applicant = Applicant::where('application_id', $request->application_id)
            ->select('application_id', 'first_name', 'last_name', 'status', 'created_at')
            ->firstOrFail();

        return response()->json(['application' => $applicant]);
    }
}
