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
     * Resolve unique target User recipients for a given event and entity.
     *
     * @param string $event
     * @param mixed $entity
     * @param User|null $actor The user triggering the event (excluded from receiving duplicate passive alerts if appropriate)
     * @return Collection<User>
     */
    public static function resolve(string $event, mixed $entity = null, ?User $actor = null): Collection
    {
        $recipients = collect();

        switch ($event) {
            // ── Manpower Requisitions (MDR / PRF) ──────────────────────────
            case 'manpower_request.created':
                if ($entity instanceof ManpowerRequest) {
                    // Notify COO(s) responsible for PRF approvals
                    $coos = User::where('role', 'coo')->where('is_active', true)->get();
                    $recipients = $recipients->merge($coos);

                    // Also include the requester if they are not the actor
                    if ($entity->requester && (! $actor || $actor->id !== $entity->requester->id)) {
                        $recipients->push($entity->requester);
                    }
                }
                break;

            case 'manpower_request.approved':
                if ($entity instanceof ManpowerRequest) {
                    // Notify Requester (Department Head)
                    if ($entity->requester) {
                        $recipients->push($entity->requester);
                    }
                    // Notify HR Admins responsible for creating job postings
                    $hrUsers = User::where('role', 'hr_admin')->where('is_active', true)->get();
                    $recipients = $recipients->merge($hrUsers);
                }
                break;

            case 'manpower_request.rejected':
            case 'manpower_request.revised':
                if ($entity instanceof ManpowerRequest) {
                    // Notify Requester (Department Head) directly
                    if ($entity->requester) {
                        $recipients->push($entity->requester);
                    }
                }
                break;

            // ── Job Library Templates ──────────────────────────────────────
            case 'job_library.submitted':
            case 'job_library.resubmitted':
                if ($entity instanceof JobLibrary) {
                    // Notify COO(s) for template approval
                    $coos = User::where('role', 'coo')->where('is_active', true)->get();
                    $recipients = $recipients->merge($coos);
                }
                break;

            case 'job_library.approved':
            case 'job_library.rejected':
            case 'job_library.revised':
                if ($entity instanceof JobLibrary) {
                    // Notify the creator of the job library template
                    if ($entity->creator) {
                        $recipients->push($entity->creator);
                    }
                }
                break;

            // ── Job Postings ───────────────────────────────────────────────
            case 'job_posting.published':
                if ($entity instanceof JobPosting) {
                    // Notify the department head of the relevant department
                    if ($entity->department_id) {
                        $deptHeads = User::where('role', 'department_head')
                            ->where('department_id', $entity->department_id)
                            ->where('is_active', true)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }
                }
                break;

            // ── Applicants & ATS ───────────────────────────────────────────
            case 'applicant.applied':
            case 'applicant.shortlisted':
            case 'applicant.ready_for_interview':
            case 'applicant.status_updated':
            case 'applicant.hired':
                if ($entity instanceof Applicant) {
                    // If the job posting belongs to a department, notify that department head
                    $deptId = $entity->jobPosting?->department_id;
                    if ($deptId && in_array($event, ['applicant.shortlisted', 'applicant.hired'])) {
                        $deptHeads = User::where('role', 'department_head')
                            ->where('department_id', $deptId)
                            ->where('is_active', true)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }

                    // Include active HR Admin(s) handling recruitment
                    $hrAdmins = User::where('role', 'hr_admin')->where('is_active', true)->get();
                    $recipients = $recipients->merge($hrAdmins);
                }
                break;

            // ── Interviews ─────────────────────────────────────────────────
            case 'interview.scheduled':
            case 'interview.reminder':
            case 'interview.completed':
                if ($entity instanceof Interview) {
                    // 1. Notify the explicitly assigned interviewer
                    if ($entity->interviewer) {
                        $recipients->push($entity->interviewer);
                    }

                    // 2. Notify the department head of the applicant's department (if different from interviewer)
                    $deptId = $entity->applicant?->jobPosting?->department_id;
                    if ($deptId) {
                        $deptHeads = User::where('role', 'department_head')
                            ->where('department_id', $deptId)
                            ->where('is_active', true)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }
                }
                break;

            // ── Leaves ─────────────────────────────────────────────────────
            case 'leave.submitted':
                if ($entity instanceof LeaveRequest) {
                    // Notify the employee's department head or HR Admin
                    if ($entity->employee?->department_id) {
                        $deptHeads = User::where('role', 'department_head')
                            ->where('department_id', $entity->employee->department_id)
                            ->where('is_active', true)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }
                }
                break;

            case 'leave.approved':
            case 'leave.rejected':
                if ($entity instanceof LeaveRequest) {
                    // Notify the employee who requested the leave
                    if ($entity->employee?->user) {
                        $recipients->push($entity->employee->user);
                    }
                }
                break;

            default:
                break;
        }

        // Return unique, active users only
        return $recipients
            ->filter(fn ($u) => $u instanceof User && $u->is_active)
            ->unique('id')
            ->values();
    }
}
