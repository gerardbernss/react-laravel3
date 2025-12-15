<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function __construct()
    {
        // Authorization is handled in individual methods
    }

    public function index()
    {
        Gate::authorize('viewAny', User::class);

        $users = User::with(['roles', 'role'])->get();
        $roles = Role::where('is_active', true)->get();

        return Inertia::render('Users/Index', compact('users', 'roles'));
    }

    public function create()
    {
        Gate::authorize('create', User::class);

        $roles = Role::where('is_active', true)->get();

        return Inertia::render('Users/Create', compact('roles'));
    }

    public function store(Request $request)
    {
        Gate::authorize('create', User::class);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
        ]);

        // Always sync many-to-many roles, include primary role_id if provided
        $roleIds = collect($request->input('roles', []));
        if ($request->filled('role_id')) {
            $roleIds->push((int) $request->role_id);
        }
        $user->roles()->sync($roleIds->unique()->all());

        return redirect()->route('users.index')->with('message', 'User created successfully!');
    }

    public function edit(User $user)
    {
        Gate::authorize('view', $user);

        $user->load(['roles', 'role']);
        $roles = Role::where('is_active', true)->get();

        return Inertia::render('Users/Edit', compact('user', 'roles'));
    }

    public function update(Request $request, User $user)
    {
        Gate::authorize('update', $user);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role_id' => $request->role_id,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        // Always sync many-to-many roles, include primary role_id if provided
        $roleIds = collect($request->input('roles', []));
        if ($request->filled('role_id')) {
            $roleIds->push((int) $request->role_id);
        }
        $user->roles()->sync($roleIds->unique()->all());

        return redirect()->route('users.index')->with('message', 'User updated successfully!');
    }

    public function destroy(User $user)
    {
        Gate::authorize('delete', $user);

        $user->delete();

        return redirect()->route('users.index')->with('message', 'User deleted successfully!');
    }

    /**
     * Assign a role to a user.
     */
    public function assignRole(Request $request, User $user)
    {
        Gate::authorize('assignRole', $user);

        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::findOrFail($request->role_id);
        $user->assignRole($role);

        return redirect()->back()->with('message', 'Role assigned successfully!');
    }

    /**
     * Remove a role from a user.
     */
    public function removeRole(Request $request, User $user)
    {
        Gate::authorize('removeRole', $user);

        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::findOrFail($request->role_id);
        $user->removeRole($role);

        return redirect()->back()->with('message', 'Role removed successfully!');
    }
}
