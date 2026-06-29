<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePermissionRequest;
use App\Http\Requests\Admin\UpdatePermissionRequest;
use App\Models\Permission;
use App\Repositories\PermissionRepository;
use App\Services\Admin\PermissionService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function __construct(
        private PermissionRepository $permissionRepository,
        private PermissionService $permissionService,
    ) {
    }

    public function index()
    {
        Gate::authorize('viewAny', Permission::class);

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $this->permissionRepository->allWithRoleCount(),
        ]);
    }

    public function create()
    {
        Gate::authorize('create', Permission::class);

        return Inertia::render('Admin/Permissions/Create');
    }

    public function store(StorePermissionRequest $request)
    {
        $this->permissionService->create($request->validated());

        return redirect()->route('permissions.index')->with('message', 'Permission created successfully!');
    }

    public function show(Permission $permission)
    {
        Gate::authorize('view', $permission);

        return Inertia::render('Admin/Permissions/Show', [
            'permission' => $this->permissionRepository->loadRolesWithUsers($permission),
        ]);
    }

    public function edit(Permission $permission)
    {
        Gate::authorize('update', $permission);

        return Inertia::render('Admin/Permissions/Edit', compact('permission'));
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $this->permissionService->update($permission, $request->validated());

        return redirect()->route('permissions.index')->with('message', 'Permission updated successfully!');
    }

    public function destroy(Permission $permission)
    {
        Gate::authorize('delete', $permission);

        $this->permissionRepository->delete($permission);

        return redirect()->route('permissions.index')->with('message', 'Permission deleted successfully!');
    }
}
