<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignPermissionRequest;
use App\Http\Requests\Admin\RemovePermissionRequest;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Models\Role;
use App\Repositories\PermissionRepository;
use App\Repositories\RoleRepository;
use App\Services\Admin\RoleService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class RolesController extends Controller
{
    public function __construct(
        private RoleRepository $roleRepository,
        private PermissionRepository $permissionRepository,
        private RoleService $roleService,
    ) {
    }

    public function index()
    {
        Gate::authorize('viewAny', Role::class);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $this->roleRepository->allWithPermissionsAndUsers(),
            'permissions' => $this->permissionRepository->all(),
        ]);
    }

    public function create()
    {
        Gate::authorize('create', Role::class);

        return Inertia::render('Admin/Roles/Create', [
            'permissions' => $this->permissionRepository->all(),
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);

        $this->roleService->create($data);

        return redirect()->route('admin.roles.index')->with('message', 'Role created successfully!');
    }

    public function show(Role $role)
    {
        Gate::authorize('view', $role);

        return Inertia::render('Admin/Roles/Show', [
            'role' => $this->roleRepository->loadPermissionsAndUsers($role),
        ]);
    }

    public function edit(Role $role)
    {
        Gate::authorize('view', $role);

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $this->roleRepository->loadPermissions($role),
            'permissions' => $this->permissionRepository->all(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);

        $this->roleService->update($role, $data);

        return redirect()->route('admin.roles.index')->with('message', 'Role updated successfully!');
    }

    public function destroy(Role $role)
    {
        Gate::authorize('delete', $role);

        $this->roleRepository->delete($role);

        return redirect()->route('admin.roles.index')->with('message', 'Role deleted successfully!');
    }

    public function assignPermission(AssignPermissionRequest $request, Role $role)
    {
        $this->roleService->assignPermission($role, $request->validated('permission_id'));

        return redirect()->back()->with('message', 'Permission assigned successfully!');
    }

    public function removePermission(RemovePermissionRequest $request, Role $role)
    {
        $this->roleService->removePermission($role, $request->validated('permission_id'));

        return redirect()->back()->with('message', 'Permission removed successfully!');
    }
}
