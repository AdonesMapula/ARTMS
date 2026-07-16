<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user')
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->module, fn ($q) => $q->where('module', $request->module))
            ->when($request->action, fn ($q) => $q->where('action', $request->action))
            ->when($request->date_from, fn ($q) => $q->where('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->where('created_at', '<=', $request->date_to))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($logs);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        return response()->json(['log' => $auditLog->load('user')]);
    }
}
