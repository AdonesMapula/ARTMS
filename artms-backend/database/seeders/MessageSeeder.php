<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = User::where('email', 'superadmin@artms.com')->orWhere('role', 'super_admin')->first();
        $hrAdmin = User::where('email', 'hradmin@artms.com')->orWhere('role', 'hr_admin')->first();
        $coo = User::where('email', 'coo@artms.com')->orWhere('role', 'coo')->first();
        $deptHead = User::where('email', 'depthead@artms.com')->orWhere('role', 'department_head')->first();
        $interviewer = User::where('email', 'interviewer@artms.com')->first();
        $employee = User::where('email', 'employee@artms.com')->orWhere('role', 'employee')->first();
        $customAdmin = User::where('email', 'adonesmapula1402@gmail.com')->first();

        if (!$hrAdmin || !$deptHead) {
            $this->command->warn('Required users not found for MessageSeeder. Skipping.');
            return;
        }

        $now = Carbon::now();

        $conversations = [
            // ── HR Admin <-> Department Head ─────────────────────────
            [
                'user1' => $hrAdmin,
                'user2' => $deptHead,
                'chats' => [
                    [
                        'sender' => $deptHead,
                        'receiver' => $hrAdmin,
                        'body' => "Hi HR Team, following up on our Manpower Request for the Senior Full Stack Developer position. Have we received qualified applicants yet?",
                        'time' => $now->copy()->subDays(2)->setHour(9)->setMinute(15),
                        'read' => true,
                    ],
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $deptHead,
                        'body' => "Hello! Yes, the AI Screening engine has evaluated 14 applicants so far. 3 candidates scored above our 85% match threshold.",
                        'time' => $now->copy()->subDays(2)->setHour(9)->setMinute(32),
                        'read' => true,
                    ],
                    [
                        'sender' => $deptHead,
                        'receiver' => $hrAdmin,
                        'body' => "Awesome. Can we schedule their technical interviews for this Thursday afternoon via the LiveKit room?",
                        'time' => $now->copy()->subDays(1)->setHour(14)->setMinute(5),
                        'read' => true,
                    ],
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $deptHead,
                        'body' => "Done! Calendar invites and automated reminder emails have been dispatched to the candidates. You can view the AI pre-screening insights in the Pipeline tab.",
                        'time' => $now->copy()->subHours(5),
                        'read' => true,
                    ],
                    [
                        'sender' => $deptHead,
                        'receiver' => $hrAdmin,
                        'body' => "Perfect, thank you! I'll review their resumes beforehand.",
                        'time' => $now->copy()->subMinutes(25),
                        'read' => false,
                    ],
                ]
            ],

            // ── HR Admin <-> COO ─────────────────────────────────────
            [
                'user1' => $hrAdmin,
                'user2' => $coo,
                'chats' => [
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $coo,
                        'body' => "Good morning Sir, we have submitted the Q3 Requisition Plan for the Operations and IT departments for your final sign-off.",
                        'time' => $now->copy()->subDays(3)->setHour(10)->setMinute(0),
                        'read' => true,
                    ],
                    [
                        'sender' => $coo,
                        'receiver' => $hrAdmin,
                        'body' => "Received. I reviewed the budget allocations and approved the 4 headcount additions for Customer Support and 2 for Engineering.",
                        'time' => $now->copy()->subDays(2)->setHour(16)->setMinute(45),
                        'read' => true,
                    ],
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $coo,
                        'body' => "Thank you Sir! The job postings have been published to the careers portal.",
                        'time' => $now->copy()->subDays(1)->setHour(8)->setMinute(30),
                        'read' => true,
                    ],
                    [
                        'sender' => $coo,
                        'receiver' => $hrAdmin,
                        'body' => "Great job. Please ensure the AI interview reports are compiled for our monthly executive review.",
                        'time' => $now->copy()->subHours(2),
                        'read' => false,
                    ],
                ]
            ],

            // ── Super Admin <-> HR Admin ──────────────────────────────
            [
                'user1' => $superAdmin,
                'user2' => $hrAdmin,
                'chats' => [
                    [
                        'sender' => $superAdmin,
                        'receiver' => $hrAdmin,
                        'body' => "Hi HR, we just enabled the new RBAC permissions and AI screening consolidated view. Please verify if everything looks good on your dashboard.",
                        'time' => $now->copy()->subDays(4)->setHour(11)->setMinute(0),
                        'read' => true,
                    ],
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $superAdmin,
                        'body' => "Confirmed! The new pipeline view and multi-file resume preview are working smoothly.",
                        'time' => $now->copy()->subDays(3)->setHour(13)->setMinute(20),
                        'read' => true,
                    ],
                    [
                        'sender' => $superAdmin,
                        'receiver' => $hrAdmin,
                        'body' => "Let me know if you notice any latency during bulk applicant processing or export actions.",
                        'time' => $now->copy()->subHours(4),
                        'read' => true,
                    ],
                ]
            ],

            // ── Department Head <-> Employee ─────────────────────────
            [
                'user1' => $deptHead,
                'user2' => $employee,
                'chats' => [
                    [
                        'sender' => $deptHead,
                        'receiver' => $employee,
                        'body' => "Hi! Welcome to the team. Please make sure to complete your profile documents in the Requirements tab by end of week.",
                        'time' => $now->copy()->subDays(3)->setHour(9)->setMinute(0),
                        'read' => true,
                    ],
                    [
                        'sender' => $employee,
                        'receiver' => $deptHead,
                        'body' => "Good day! Thank you for the warm welcome. I have uploaded my SSS, PhilHealth, and TIN certificates today.",
                        'time' => $now->copy()->subDays(2)->setHour(15)->setMinute(10),
                        'read' => true,
                    ],
                    [
                        'sender' => $deptHead,
                        'receiver' => $employee,
                        'body' => "Looks great. Feel free to message here if you need any assistance with setup or team assignments.",
                        'time' => $now->copy()->subHours(1),
                        'read' => false,
                    ],
                ]
            ],
        ];

        // If interviewer exists, add HR <-> Interviewer chat
        if ($interviewer && $hrAdmin) {
            $conversations[] = [
                'user1' => $hrAdmin,
                'user2' => $interviewer,
                'chats' => [
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $interviewer,
                        'body' => "Hi! You've been assigned as panel interviewer for 2 candidates tomorrow at 2:00 PM.",
                        'time' => $now->copy()->subHours(6),
                        'read' => true,
                    ],
                    [
                        'sender' => $interviewer,
                        'receiver' => $hrAdmin,
                        'body' => "Got it, I've checked the room link and rubric evaluation scorecards.",
                        'time' => $now->copy()->subMinutes(40),
                        'read' => false,
                    ],
                ]
            ];
        }

        // If custom user (Adones/Cristian) exists, add chats with HR & SuperAdmin
        if ($customAdmin && $hrAdmin && $customAdmin->id !== $hrAdmin->id) {
            $conversations[] = [
                'user1' => $hrAdmin,
                'user2' => $customAdmin,
                'chats' => [
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $customAdmin,
                        'body' => "Hello Cristian! The latest AI screening consolidation and messaging system have been deployed to the workspace.",
                        'time' => $now->copy()->subHours(3),
                        'read' => true,
                    ],
                    [
                        'sender' => $customAdmin,
                        'receiver' => $hrAdmin,
                        'body' => "Thanks for the update! Testing the real-time conversation thread and message notifications now.",
                        'time' => $now->copy()->subMinutes(15),
                        'read' => true,
                    ],
                    [
                        'sender' => $hrAdmin,
                        'receiver' => $customAdmin,
                        'body' => "Everything is connected to TiDB Cloud. Let me know if you need any test messages or data adjustments!",
                        'time' => $now->copy()->subMinutes(5),
                        'read' => false,
                    ],
                ]
            ];
        }

        // Insert messages
        foreach ($conversations as $conv) {
            if (!$conv['user1'] || !$conv['user2']) continue;

            foreach ($conv['chats'] as $chat) {
                if (!$chat['sender'] || !$chat['receiver']) continue;

                Message::firstOrCreate(
                    [
                        'sender_id'   => $chat['sender']->id,
                        'receiver_id' => $chat['receiver']->id,
                        'body'        => $chat['body'],
                    ],
                    [
                        'read_at'    => $chat['read'] ? $chat['time']->copy()->addMinutes(5) : null,
                        'created_at' => $chat['time'],
                        'updated_at' => $chat['time'],
                    ]
                );
            }
        }

        $this->command->info('✅ Mock messages and conversations seeded successfully.');
    }
}
