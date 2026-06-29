<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignRoleRequest;
use App\Http\Requests\Admin\RemoveRoleRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use App\Services\Admin\UserService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function __construct(
        private UserRepository $userRepository,
        private RoleRepository $roleRepository,
        private UserService $userService,
    ) {
    }

    public function index()
    {
        Gate::authorize('viewAny', User::class);

        return Inertia::render('Admin/Users/Index', [
            'users' => $this->userRepository->allWithRoles(),
            'roles' => $this->roleRepository->allActive(),
        ]);
    }

    public function create()
    {
        Gate::authorize('create', User::class);

        return Inertia::render('Admin/Users/Create', [
            'roles' => $this->roleRepository->allActive(),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $this->userService->create($request->validated());

        return redirect()->route('users.index')->with('message', 'User created successfully!');
    }

    public function edit(User $user)
    {
        Gate::authorize('view', $user);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $this->userRepository->loadRoles($user),
            'roles' => $this->roleRepository->allActive(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->userService->update($user, $request->validated());

        return redirect()->route('users.index')->with('message', 'User updated successfully!');
    }

    public function destroy(User $user)
    {
        Gate::authorize('delete', $user);

        $this->userRepository->delete($user);

        return redirect()->route('users.index')->with('message', 'User deleted successfully!');
    }

    public function assignRole(AssignRoleRequest $request, User $user)
    {
        $this->userService->assignRole($user, $request->validated('role_id'));

        return redirect()->back()->with('message', 'Role assigned successfully!');
    }

    public function removeRole(RemoveRoleRequest $request, User $user)
    {
        $this->userService->removeRole($user, $request->validated('role_id'));

        return redirect()->back()->with('message', 'Role removed successfully!');
    }
}
