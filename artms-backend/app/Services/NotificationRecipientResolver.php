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
     * Resolve targeted internal user recipients based on the event and entity.
     *
     * @param string $event The event key (e.g., 'mdr.created', 'mdr.approved')
     * @param mixed $entity The domain model associated with the event
     * @param User|null $actor The user who performed the action
     * @return Collection<User> Collection of unique, active User instances who should receive the notification
     */
    public static function resolve(string $event, mixed $entity = null, ?User $actor = null): Collection
    {
        $recipients = collect();

        switch ($event) {
            // ── Manpower Requests (MDR / PRF) ───────────────────────────
            case 'mdr.created':
                if ($entity instanceof ManpowerRequest) {
                    // 1. In-app receipt to Requester
                    if ($entity->requester && $entity->requester->is_active) {
                        $recipients->push($entity->requester);
                    }
                    // 2. Executive Approvers (COO)
                    $coos = User::where('role', 'coo')->where('is_active', true)->get();
                    $recipients = $recipients->merge($coos);
                }
                break;

            case 'mdr.approved':
                if ($entity instanceof ManpowerRequest) {
                    // 1. Requester (Department Head)
                    if ($entity->requester && $entity->requester->is_active) {
                        $recipients->push($entity->requester);
                    }
                    // 2. Approver (COO)
                    if ($entity->approver && $entity->approver->is_active) {
                        $recipients->push($entity->approver);
                    }
                    // 3. HR Admins responsible for creating job posting (or department HR)
                    $hrUsers = User::where('role', 'hr_admin')->where('is_active', true)->take(3)->get();
                    $recipients = $recipients->merge($hrUsers);
                }
                break;

            case 'mdr.rejected':
            case 'mdr.revised':
                if ($entity instanceof ManpowerRequest) {
                    // 1. Requester (Department Head)
                    if ($entity->requester && $entity->requester->is_active) {
                        $recipients->push($entity->requester);
                    }
                    // 2. Approver (COO)
                    if ($entity->approver && $entity->approver->is_active) {
                        $recipients->push($entity->approver);
                    }
                }
                break;

            // ── Job Library ─────────────────────────────────────────────
            case 'job_library.created':
                if ($entity instanceof JobLibrary) {
                    if ($entity->creator && $entity->creator->is_active) {
                        $recipients->push($entity->creator);
                    }
                    // Executive Approvers (COO)
                    $coos = User::where('role', 'coo')->where('is_active', true)->get();
                    $recipients = $recipients->merge($coos);
                }
                break;

            case 'job_library.approved':
            case 'job_library.rejected':
            case 'job_library.revised':
                if ($entity instanceof JobLibrary) {
                    // Creator (HR who created or revised it)
                    if ($entity->creator && $entity->creator->is_active) {
                        $recipients->push($entity->creator);
                    }
                    // Approver (COO)
                    if ($entity->approver && $entity->approver->is_active) {
                        $recipients->push($entity->approver);
                    }
                }
                break;

            // ── Job Postings ────────────────────────────────────────────
            case 'job_posting.created':
            case 'job_posting.approved':
                if ($entity instanceof JobPosting) {
                    if ($entity->requester && $entity->requester->is_active) {
                        $recipients->push($entity->requester);
                    }
                    if ($entity->approver && $entity->approver->is_active) {
                        $recipients->push($entity->approver);
                    }
                }
                break;

            // ── Interviews ──────────────────────────────────────────────
            case 'interview.scheduled':
            case 'interview.reminder':
            case 'interview.completed':
                if ($entity instanceof Interview) {
                    // 1. Assigned Interviewer
                    if ($entity->interviewer && $entity->interviewer->is_active) {
                        $recipients->push($entity->interviewer);
                    }
                    // 2. Job posting requester / recruiter
                    $recruiter = $entity->jobPosting?->requester;
                    if ($recruiter && $recruiter->is_active) {
                        $recipients->push($recruiter);
                    }
                }
                break;

            // ── Applicants & ATS ────────────────────────────────────────
            case 'applicant.applied':
            case 'applicant.shortlisted':
            case 'applicant.status_updated':
                if ($entity instanceof Applicant) {
                    // Recruiter / HR who created the job posting
                    $recruiter = $entity->jobPosting?->requester;
                    if ($recruiter && $recruiter->is_active) {
                        $recipients->push($recruiter);
                    } else {
                        // Fallback to active HR Admins if no specific creator assigned
                        $hrAdmins = User::where('role', 'hr_admin')->where('is_active', true)->take(2)->get();
                        $recipients = $recipients->merge($hrAdmins);
                    }
                }
                break;

            case 'applicant.hired':
                if ($entity instanceof Applicant) {
                    // 1. Recruiter
                    $recruiter = $entity->jobPosting?->requester;
                    if ($recruiter && $recruiter->is_active) {
                        $recipients->push($recruiter);
                    }
                    // 2. Department Head for that department
                    $deptId = $entity->jobPosting?->department_id;
                    if ($deptId) {
                        $deptHeads = User::where('department_id', $deptId)
                            ->where('role', 'department_head')
                            ->where('is_active', true)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }
                }
                break;

            // ── Leaves ──────────────────────────────────────────────────
            case 'leave.created':
                if ($entity instanceof LeaveRequest) {
                    // 1. Employee User
                    $empUser = $entity->employee?->user;
                    if ($empUser && $empUser->is_active) {
                        $recipients->push($empUser);
                    }
                    // 2. Department Head of employee
                    $deptId = $entity->employee?->department_id;
                    if ($deptId) {
                        $deptHeads = User::where('department_id', $deptId)
                            ->where('role', 'department_head')
                            ->where('is_active', true)
                            ->get();
                        $recipients = $recipients->merge($deptHeads);
                    }
                }
                break;

            case 'leave.approved':
            case 'leave.rejected':
                if ($entity instanceof LeaveRequest) {
                    // Employee User
                    $empUser = $entity->employee?->user;
                    if ($empUser && $empUser->is_active) {
                        $recipients->push($empUser);
                    }
                    // Approver
                    if ($entity->approver && $entity->approver->is_active) {
                        $recipients->push($entity->approver);
                    }
                }
                break;

            default:
                if ($entity instanceof User && $entity->is_active) {
                    $recipients->push($entity);
                }
                break;
        }

        // Return unique users by ID, filtered for active accounts
        return $recipients->filter(fn($u) => $u instanceof User && $u->is_active)->unique('id')->values();
    }
}
