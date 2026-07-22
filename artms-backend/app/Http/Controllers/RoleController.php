<?php

namespace App\Http\Controllers;

use App\Models\CustomRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Get all roles (default system roles + custom roles)
     */
    public function index()
    {
        // Default system roles
        $systemRoles = [
            ['key' => 'super_admin', 'name' => 'Super Admin', 'is_system' => true],
            ['key' => 'hr_admin', 'name' => 'HR Admin', 'is_system' => true],
            ['key' => 'coo', 'name' => 'COO', 'is_system' => true],
            ['key' => 'department_head', 'name' => 'Department Head', 'is_system' => true],
            ['key' => 'employee', 'name' => 'Employee', 'is_system' => true],
        ];

        // Custom roles from database
        $customRoles = CustomRole::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'key' => $role->key,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => false,
                ];
            })
            ->toArray();

        return response()->json([
            'roles' => array_merge($systemRoles, $customRoles),
        ]);
    }

    /**
     * Create a new custom role
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:255|unique:custom_roles,key|regex:/^[a-z_]+$/',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if key matches system role
        $systemRoleKeys = ['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'];
        if (in_array($request->key, $systemRoleKeys)) {
            return response()->json([
                'message' => 'This role key is reserved for system roles.',
            ], 422);
        }

        $role = CustomRole::create([
            'name' => $request->name,
            'key' => $request->key,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Custom role created successfully',
            'role' => [
                'id' => $role->id,
                'key' => $role->key,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => false,
            ],
        ], 201);
    }

    /**
     * Update an existing custom role
     */
    public function update(Request $request, $id)
    {
        $role = CustomRole::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'key' => 'sometimes|required|string|max:255|regex:/^[a-z_]+$/|unique:custom_roles,key,' . $id,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $role->update($request->only(['name', 'key', 'description']));

        return response()->json([
            'message' => 'Custom role updated successfully',
            'role' => [
                'id' => $role->id,
                'key' => $role->key,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => false,
            ],
        ]);
    }

    /**
     * Delete a custom role
     */
    public function destroy($id)
    {
        $role = CustomRole::findOrFail($id);
        $role->delete();

        return response()->json([
            'message' => 'Custom role deleted successfully',
        ]);
    }
}
