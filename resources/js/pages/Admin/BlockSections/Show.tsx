import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, HELPER_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import {
    type AvailableStudent,
    type BlockSection,
    type EnrolledStudent,
    type Subject,
    studentFullName,
    useBlockSectionShow,
} from '@/hooks/useBlockSectionShow';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Edit, LayoutGrid, Plus, Search, Trash2, UserMinus, Users } from 'lucide-react';

interface Props {
    blockSection: BlockSection;
    enrolledStudents: EnrolledStudent[];
    availableStudents: AvailableStudent[];
}

/** Admin block section detail page showing enrolled students and allowing student enrolment or removal. */
export default function Show({ blockSection, enrolledStudents, availableStudents }: Props) {
    const {
        processing,
        showDeleteDialog,
        setShowDeleteDialog,
        activeTab,
        setActiveTab,
        showAddDialog,
        closeAddDialog,
        addSearch,
        setAddSearch,
        selectedStudentId,
        setSelectedStudentId,
        addProcessing,
        studentsPage,
        setStudentsPage,
        studentsPageSize,
        setStudentsPageSize,
        subjectsPage,
        setSubjectsPage,
        subjectsPageSize,
        setSubjectsPageSize,
        studentSearch,
        setStudentSearch,
        enrollmentToRemove,
        setEnrollmentToRemove,
        breadcrumbs,
        totalUnits,
        isFull,
        filteredAvailable,
        filteredEnrolled,
        paginatedEnrolled,
        paginatedSubjects,
        openAddDialog,
        handleAddStudent,
        confirmDelete,
        confirmRemove,
    } = useBlockSectionShow({ blockSection, enrolledStudents, availableStudents });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${blockSection.code} - ${blockSection.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/block-sections" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Block Sections
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className={PAGE_TITLE}>{blockSection.name}</h1>
                                <AppBadge status={blockSection.is_active ? 'active' : 'inactive'}>
                                    {blockSection.is_active ? 'Active' : 'Inactive'}
                                </AppBadge>
                            </div>
                            <p className={`mt-1 ${BODY_TEXT}`}>
                                {blockSection.code} • {blockSection.grade_level} • {blockSection.school_year}
                                {blockSection.semester && ` • ${blockSection.semester}`}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/admin/block-sections/${blockSection.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={processing || blockSection.current_enrollment > 0}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-2">
                    <div className={`${CARD} p-4`}>
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <LayoutGrid className="h-4 w-4" />
                            Section Details
                        </h2>
                        <dl className="space-y-2">
                            <div className="flex justify-between">
                                <dt className="text-xs text-gray-500">Section Code</dt>
                                <dd className="text-xs font-medium text-gray-900">{blockSection.code}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-xs text-gray-500">Grade Level</dt>
                                <dd className="text-xs font-medium text-gray-900">{blockSection.grade_level}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-xs text-gray-500">School Year</dt>
                                <dd className="text-xs font-medium text-gray-900">{blockSection.school_year}</dd>
                            </div>
                            {blockSection.semester && (
                                <div className="flex justify-between">
                                    <dt className="text-xs text-gray-500">Semester</dt>
                                    <dd className="text-xs font-medium text-gray-900">{blockSection.semester}</dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-xs text-gray-500">Adviser</dt>
                                <dd className="text-xs font-medium text-gray-900">{blockSection.adviser || '—'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-xs text-gray-500">Room</dt>
                                <dd className="text-xs font-medium text-gray-900">{blockSection.room || '—'}</dd>
                            </div>
                            {blockSection.schedule && (
                                <div className="border-t pt-2">
                                    <dt className="mb-1 text-xs text-gray-500">Schedule</dt>
                                    <dd className="text-xs text-gray-700">{blockSection.schedule}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className={`${CARD} p-4`}>
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Users className="h-4 w-4" />
                            Enrollment
                        </h2>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {blockSection.current_enrollment}
                                <span className="text-base text-gray-400">/{blockSection.capacity}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">Students Enrolled</p>

                            <div className="mt-3">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            isFull
                                                ? 'bg-red-500'
                                                : blockSection.current_enrollment >= blockSection.capacity * 0.8
                                                  ? 'bg-yellow-500'
                                                  : 'bg-green-500'
                                        }`}
                                        style={{
                                            width: `${Math.min((blockSection.current_enrollment / blockSection.capacity) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500">
                                    {blockSection.capacity - blockSection.current_enrollment} slots available
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 border-t pt-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Total Subjects</span>
                                <span className="font-medium">{blockSection.subjects.length}</span>
                            </div>
                            <div className="mt-1.5 flex justify-between text-xs">
                                <span className="text-gray-500">Total Units</span>
                                <span className="font-medium">{totalUnits}</span>
                            </div>
                        </div>

                        <div className="mt-3 border-t pt-3">
                            {isFull ? (
                                <div className="rounded-md bg-red-50 px-3 py-1.5 text-center text-xs font-medium text-red-600">
                                    Section is full — no slots available
                                </div>
                            ) : (
                                <Button size="sm" className="w-full" onClick={openAddDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Student to Section
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className={CARD}>
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'students'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            Students
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    activeTab === 'students' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {enrolledStudents.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('subjects')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'subjects'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <BookOpen className="h-4 w-4" />
                            Subjects
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    activeTab === 'subjects' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {blockSection.subjects.length}
                            </span>
                        </button>
                    </div>

                    {activeTab === 'students' && (
                        <div className="p-6">
                            <div className="mb-4">
                                <Input
                                    placeholder="Search by name or student ID..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="sm:max-w-xs"
                                />
                            </div>

                            {filteredEnrolled.length > 0 ? (
                                <div className={`overflow-hidden ${CARD}`}>
                                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 z-10 bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Student ID</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Full Name</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Enrolled On</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {paginatedEnrolled.map((e) => (
                                                    <tr key={e.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-mono text-sm text-gray-600">
                                                            {e.student.student_id_number}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {studentFullName(e.student.personal_data)}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {e.enrollment_date ? new Date(e.enrollment_date).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <AppBadge status={e.status}>{e.status}</AppBadge>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => setEnrollmentToRemove(e)}
                                                            >
                                                                <UserMinus className="mr-1 h-4 w-4" />
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <TablePagination
                                        total={filteredEnrolled.length}
                                        pageSize={studentsPageSize}
                                        currentPage={studentsPage}
                                        onPageChange={setStudentsPage}
                                        onPageSizeChange={(s) => {
                                            setStudentsPageSize(s);
                                            setStudentsPage(1);
                                        }}
                                    />
                                </div>
                            ) : enrolledStudents.length === 0 ? (
                                <div className="rounded-lg border border-dashed py-12 text-center">
                                    <Users className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-2 font-medium text-gray-700">No students assigned yet</p>
                                    <p className="mt-1 text-sm text-gray-500">Use the "Add Student" button above to assign students.</p>
                                </div>
                            ) : (
                                <div className={`py-8 text-center ${BODY_TEXT}`}>No students match your search.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div className="p-6">
                            {blockSection.subjects.length > 0 ? (
                                <div className={`overflow-hidden ${CARD}`}>
                                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 z-10 bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Code</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Subject Name</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Units</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Teacher</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Schedule</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Room</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {paginatedSubjects.map((subject: Subject) => (
                                                    <tr key={subject.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <Link
                                                                href={`/admin/subjects/${subject.id}`}
                                                                className="font-medium text-primary hover:underline"
                                                            >
                                                                {subject.code}
                                                            </Link>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-900">{subject.name}</td>
                                                        <td className="px-4 py-3 text-center">{subject.units}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline">{subject.type}</Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{subject.pivot.teacher || '—'}</td>
                                                        <td className="px-4 py-3 text-gray-600">{subject.pivot.schedule || '—'}</td>
                                                        <td className="px-4 py-3 text-gray-600">{subject.pivot.room || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                                                        Total
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-semibold">{totalUnits}</td>
                                                    <td colSpan={4}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <TablePagination
                                        total={blockSection.subjects.length}
                                        pageSize={subjectsPageSize}
                                        currentPage={subjectsPage}
                                        onPageChange={setSubjectsPage}
                                        onPageSizeChange={(s) => {
                                            setSubjectsPageSize(s);
                                            setSubjectsPage(1);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed py-12 text-center">
                                    <BookOpen className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-2 font-medium text-gray-700">No subjects assigned</p>
                                    <Link href={`/admin/block-sections/${blockSection.id}/edit`}>
                                        <Button variant="outline" className="mt-4">
                                            Assign Subjects
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeAddDialog(); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Student to {blockSection.name}</DialogTitle>
                    </DialogHeader>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search by name or student ID..."
                            value={addSearch}
                            onChange={(e) => { setAddSearch(e.target.value); setSelectedStudentId(null); }}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto rounded-lg border">
                        {availableStudents.length === 0 ? (
                            <div className={`px-4 py-10 text-center ${BODY_TEXT}`}>
                                No available students for this school year / semester.
                            </div>
                        ) : filteredAvailable.length === 0 ? (
                            <div className={`px-4 py-10 text-center ${BODY_TEXT}`}>No students match your search.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Student ID</th>
                                        <th className="px-4 py-2 text-left">Name</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAvailable.map((s) => (
                                        <tr
                                            key={s.id}
                                            onClick={() => setSelectedStudentId(s.id)}
                                            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                                                selectedStudentId === s.id ? 'bg-primary/10' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{s.student_id_number || '—'}</td>
                                            <td className="px-4 py-2.5 font-medium text-gray-900">
                                                {s.personal_data?.last_name}, {s.personal_data?.first_name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <p className={HELPER_TEXT}>
                        {filteredAvailable.length} student{filteredAvailable.length !== 1 ? 's' : ''} available
                    </p>

                    <div className="flex justify-end gap-2 border-t pt-2">
                        <Button variant="outline" onClick={closeAddDialog} disabled={addProcessing}>Cancel</Button>
                        <Button onClick={handleAddStudent} disabled={!selectedStudentId || addProcessing}>
                            {addProcessing ? 'Adding...' : 'Add Student'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Block Section"
                description={`Are you sure you want to delete "${blockSection.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />

            <ConfirmDialog
                open={!!enrollmentToRemove}
                onClose={() => setEnrollmentToRemove(null)}
                onConfirm={confirmRemove}
                title="Remove Student"
                description={`Remove ${studentFullName(enrollmentToRemove?.student.personal_data ?? null)} from this section? Their enrollment record and subject enrollments will be deleted.`}
                confirmLabel="Remove"
                processingLabel="Removing..."
                variant="warning"
            />
        </AppLayout>
    );
}
