<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\JobLibrary;
use App\Models\JobPosting;
use App\Models\LeaveRequest;
use App\Models\ManpowerRequest;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationRecipientResolver
{
    /**
     * Resolve the exact target recipients (Collection of User models) for a given event and entity.
     *
     * @param string $event E.g. 'manpower_request.approved', 'interview.scheduled'
     * @param mixed $entity The Eloquent model associated with the event
     * @param User|null $actor The user who triggered the event (optional)
     * @return Collection<int, User>
     */
    public static function resolve(string $event, mixed $entity = null, ?User $actor = null): Collection
    {
        $recipients = collect();

        switch ($event) {
            // ── Manpower Requisitions (PRF / MDR) ──────────────────────────
            case 'manpower_request.created':
                // Notify COO(s) and Super Admins responsible for approvals
                $recipients = User::where('is_active', true)
                    ->whereIn('role', ['coo', 'super_admin'])
                    ->get();
                break;

            case 'manpower_request.approved':
                /** @var ManpowerRequest $entity */
                if ($entity instanceof ManpowerRequest) {
                    // 1. The original requester (Department Head)
                    if ($entity->requester && $entity->requester->is_active) {
                        $recipients->push($entity->requester);
                    }
                    // 2. HR Admin(s) who need to create the job posting
                    $hrUsers = User::where('is_active', true)
                        ->where('role', 'hr_admin')
                        ->get();
                    $recipients = $recipients->merge($hrUsers);
                }
                break;

            case 'manpower_request.rejected':
                /** @var ManpowerRequest $entity */
                if ($entity instanceof ManpowerRequest && $entity->requester && $entity->requester->is_active) {
                    $recipients->push($entity->requester);
                }
                break;

            case 'manpower_request.revised':
                /** @var ManpowerRequest $entity */
                if ($entity instanceof ManpowerRequest) {
                    if ($entity->requester && $entity->requester->is_active) {
                        $recipients->push($entity->requester);
                    }
                    $hrUsers = User::where('is_active', true)
                        ->where('role', 'hr_admin')
                        ->get();
                    $recipients = $recipients->merge($hrUsers);
                }
                break;

            // ── Interviews ──────────────────────────────────────────────────
            case 'interview.scheduled':
            case 'interview.reminder':
                /** @var Interview $entity */
                if ($entity instanceof Interview) {
                    // 1. Assigned interviewer
                    if ($entity->interviewer && $entity->interviewer->is_active) {
                        $recipients->push($entity->interviewer);
                    }
                    // 2. Scheduled by user / recruiter
                    if ($entity->creator && $entity->creator->is_active && (! $actor || $entity->creator->id !== $actor->id)) {
                        $recipients->push($entity->creator);
                    }
                }
                break;

            // ── Job Library Templates ───────────────────────────────────────
            case 'job_library.created':
            case 'job_library.revised':
                // Notify COO(s) and Super Admins for review
                $recipients = User::where('is_active', true)
                    ->whereIn('role', ['coo', 'super_admin'])
                    ->get();
                break;

            case 'job_library.approved':
            case 'job_library.rejected':
                /** @var JobLibrary $entity */
                if ($entity instanceof JobLibrary && $entity->creator && $entity->creator->is_active) {
                    $recipients->push($entity->creator);
                }
                break;

            // ── Job Postings ────────────────────────────────────────────────
            case 'job_posting.created':
            case 'job_posting.approved':
                /** @var JobPosting $entity */
                if ($entity instanceof JobPosting) {
                    if ($entity->creator && $entity->creator->is_active && (! $actor || $entity->creator->id !== $actor->id)) {
                        $recipients->push($entity->creator);
                    }
                }
                break;

            // ── Applicants & ATS ────────────────────────────────────────────
            case 'applicant.applied':
                // Notify HR recruiters responsible for the job posting or active HR admins
                /** @var Applicant $entity */
                if ($entity instanceof Applicant) {
                    $jobCreator = $entity->jobPosting?->creator;
                    if ($jobCreator && $jobCreator->is_active) {
                        $recipients->push($jobCreator);
                    } else {
                        $hrUsers = User::where('is_active', true)
                            ->where('role', 'hr_admin')
                            ->get();
                        $recipients = $recipients->merge($hrUsers);
                    }
                }
                break;

            case 'applicant.status_updated':
            case 'applicant.ready_for_interview':
            case 'applicant.hired':
                /** @var Applicant $entity */
                if ($entity instanceof Applicant) {
                    $jobCreator = $entity->jobPosting?->creator;
                    if ($jobCreator && $jobCreator->is_active && (! $actor || $jobCreator->id !== $actor->id)) {
                        $recipients->push($jobCreator);
                    }
                }
                break;

            // ── Leave Requests ──────────────────────────────────────────────
            case 'leave.created':
                /** @var LeaveRequest $entity */
                if ($entity instanceof LeaveRequest) {
                    // Notify Department Head of employee's department
                    $deptId = $entity->employee?->department_id ?? $entity->user?->department_id;
                    if ($deptId) {
                        $deptHeads = User::where('is_active', true)
                            ->where('role', 'department_head')
                            ->where('department_id', $deptId)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }
                }
                break;

            case 'leave.approved':
            case 'leave.rejected':
                /** @var LeaveRequest $entity */
                if ($entity instanceof LeaveRequest && $entity->user && $entity->user->is_active) {
                    $recipients->push($entity->user);
                }
                break;

            default:
                break;
        }

        // Exclude the acting user from receiving self-notifications unless explicitly desired
        if ($actor) {
            $recipients = $recipients->reject(fn (User $u) => $u->id === $actor->id);
        }

        // Return unique users by ID
        return $recipients->unique('id')->values();
    }
}
