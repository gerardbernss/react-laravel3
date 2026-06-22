import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText, Printer, XCircle } from 'lucide-react';
import { useState } from 'react';

interface PersonalData {
    id: number;
    last_name: string; first_name: string; middle_name: string | null; suffix: string | null;
    learner_reference_number: string | null; gender: string; citizenship: string; religion: string;
    date_of_birth: string; place_of_birth: string | null;
    email: string; alt_email: string | null; mobile_number: string | null;
    present_street: string | null; present_brgy: string | null; present_city: string | null;
    present_province: string | null; present_zip: string | null;
    permanent_street: string | null; permanent_brgy: string | null; permanent_city: string | null;
    permanent_province: string | null; permanent_zip: string | null;
    stopped_studying: string | null; accelerated: string | null;
    health_conditions: string[] | string | null;
    has_doctors_note: boolean | null;
    doctors_note_file: string | null;
}

interface FamilyBackground {
    father_lname: string | null; father_fname: string | null; father_mname: string | null;
    father_living: string | null; father_contact_no: string | null; father_email: string | null;
    father_occupation: string | null;
    mother_lname: string | null; mother_fname: string | null; mother_mname: string | null;
    mother_living: string | null; mother_contact_no: string | null; mother_email: string | null;
    mother_occupation: string | null;
    guardian_lname: string | null; guardian_fname: string | null;
    guardian_relationship: string | null; guardian_contact_no: string | null; guardian_email: string | null;
    emergency_contact_name: string | null; emergency_relationship: string | null;
    emergency_mobile_phone: string | null; emergency_home_phone: string | null;
}

interface Sibling {
    sibling_full_name: string | null; sibling_grade_level: string | null; sibling_id_number: string | null;
}

interface EducationalBackground {
    id: number;
    school_name: string | null; school_address: string | null;
    from_grade: string | null; to_grade: string | null;
    from_year: string | null; to_year: string | null;
    honors_awards: string | null; general_average: string | null;
    class_rank: string | null; class_size: string | null;
}

interface Documents {
    certificate_of_enrollment: string | null;
    birth_certificate: string | null;
    latest_report_card_front: string | null;
    latest_report_card_back: string | null;
}

interface Enrollment {
    id: number; school_year: string; semester: string; year_level: string; status: string;
}

interface StudentRecord {
    id: number; student_id_number: string | null; enrollment_status: string | null;
    current_year_level: string | null; current_school_year: string | null;
    current_semester: string | null; enrollment_date: string | null; source: string;
}

interface Withdrawal {
    withdrawal_type: string;
    refund_amount: number;
    reason: string | null;
    processed_by: string | null;
    created_at: string;
}

interface Props {
    student: StudentRecord;
    personalData: PersonalData | null;
    familyBackground: FamilyBackground | null;
    siblings: Sibling[];
    educationalBackground: EducationalBackground[];
    documents: Documents | null;
    enrollments: Enrollment[];
    withdrawal: Withdrawal | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/students' },
    { title: 'Student Profile', href: '#' },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            <span className="w-44 shrink-0 text-sm font-medium text-gray-500">{label}</span>
            <span className="text-sm text-gray-800">{value ?? <span className="text-gray-400">—</span>}</span>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-800">{title}</h2>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function formatAddress(...parts: (string | null | undefined)[]) {
    return parts.filter(Boolean).join(', ') || '—';
}

function FileLink({ path, label }: { path: string | null; label: string }) {
    if (!path) return <span className="text-gray-400">Not uploaded</span>;
    const filename = path.split('/').pop() ?? path;
    return (
        <a
            href={`/storage/${path}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
            <FileText className="h-3.5 w-3.5" />
            {label} <span className="text-xs text-gray-400">({filename})</span>
        </a>
    );
}

export default function ShowStudent({ student, personalData, familyBackground, siblings, educationalBackground, documents, enrollments, withdrawal }: Props) {
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const withdrawForm = useForm({ withdrawal_type: 'during_enrollment', refund_amount: '0', reason: '' });

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        withdrawForm.post(`/students/${student.id}/withdraw`, {
            onSuccess: () => { setShowWithdrawDialog(false); withdrawForm.reset(); },
        });
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    const fullName = personalData
        ? `${personalData.last_name}, ${personalData.first_name}${personalData.middle_name ? ` ${personalData.middle_name}` : ''}${personalData.suffix ? `, ${personalData.suffix}` : ''}`
        : 'Unknown';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Student — ${fullName}`} />

            <div className="space-y-6 p-4 md:p-6">
                <Link href="/students" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Students
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            {student.student_id_number && <span className="font-mono">{student.student_id_number}</span>}
                            {student.enrollment_status && (
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                    student.enrollment_status === 'Active' ? 'bg-green-100 text-green-700' :
                                    student.enrollment_status === 'Withdrawn' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {student.enrollment_status}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {student.enrollment_status !== 'Withdrawn' && (
                            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowWithdrawDialog(true)}>
                                <XCircle className="mr-2 h-4 w-4" /> Withdraw
                            </Button>
                        )}
                        <Link href={`/students/${student.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                {withdrawal && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <p className="text-sm font-semibold text-red-800">Student Withdrawn</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-red-700">
                            <span>Type: <strong>{withdrawal.withdrawal_type === 'during_enrollment' ? 'During Enrollment' : 'After Classes Started'}</strong></span>
                            <span>Refund: <strong>{formatCurrency(withdrawal.refund_amount)}</strong></span>
                            {withdrawal.reason && <span className="col-span-2">Reason: {withdrawal.reason}</span>}
                            <span className="col-span-2 text-xs text-red-500">Processed by {withdrawal.processed_by ?? '—'} on {withdrawal.created_at}</span>
                        </div>
                    </div>
                )}

                {/* Enrollment Info */}
                <Section title="Enrollment Information">
                    <Row label="Year Level" value={student.current_year_level} />
                    <Row label="School Year" value={student.current_school_year} />
                    <Row label="Semester" value={student.current_semester} />
                    <Row label="Enrollment Date" value={student.enrollment_date} />
                </Section>

                {/* Personal Info */}
                {personalData && (
                    <Section title="Personal Information">
                        <Row label="Full Name" value={fullName} />
                        <Row label="LRN" value={personalData.learner_reference_number} />
                        <Row label="Gender" value={personalData.gender} />
                        <Row label="Citizenship" value={personalData.citizenship} />
                        <Row label="Religion" value={personalData.religion} />
                        <Row label="Date of Birth" value={personalData.date_of_birth} />
                        <Row label="Place of Birth" value={personalData.place_of_birth} />
                        <Row label="Email" value={personalData.email} />
                        <Row label="Alt Email" value={personalData.alt_email} />
                        <Row label="Mobile" value={personalData.mobile_number} />
                        <Row label="Present Address" value={formatAddress(personalData.present_street, personalData.present_brgy, personalData.present_city, personalData.present_province, personalData.present_zip)} />
                        <Row label="Permanent Address" value={formatAddress(personalData.permanent_street, personalData.permanent_brgy, personalData.permanent_city, personalData.permanent_province, personalData.permanent_zip)} />
                        {(() => {
                            let hc: string[] = [];
                            if (Array.isArray(personalData.health_conditions)) {
                                hc = personalData.health_conditions;
                            } else if (typeof personalData.health_conditions === 'string') {
                                try { hc = JSON.parse(personalData.health_conditions); } catch { hc = []; }
                            }
                            return (
                                <>
                                    <Row label="Health Conditions" value={hc.length > 0 ? hc.join(', ') : 'None'} />
                                    {personalData.has_doctors_note && personalData.doctors_note_file && (
                                        <Row label="Doctor's Note" value={<FileLink path={personalData.doctors_note_file} label="View Doctor's Note" />} />
                                    )}
                                </>
                            );
                        })()}
                    </Section>
                )}

                {/* Family Background */}
                {familyBackground && (
                    <Section title="Family Background">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Father</p>
                        <Row label="Name" value={[familyBackground.father_lname, familyBackground.father_fname, familyBackground.father_mname].filter(Boolean).join(', ')} />
                        <Row label="Status" value={familyBackground.father_living} />
                        <Row label="Occupation" value={familyBackground.father_occupation} />
                        <Row label="Contact" value={familyBackground.father_contact_no} />
                        <Row label="Email" value={familyBackground.father_email} />

                        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Mother</p>
                        <Row label="Name" value={[familyBackground.mother_lname, familyBackground.mother_fname, familyBackground.mother_mname].filter(Boolean).join(', ')} />
                        <Row label="Status" value={familyBackground.mother_living} />
                        <Row label="Occupation" value={familyBackground.mother_occupation} />
                        <Row label="Contact" value={familyBackground.mother_contact_no} />
                        <Row label="Email" value={familyBackground.mother_email} />

                        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Guardian / Emergency</p>
                        <Row label="Guardian Name" value={[familyBackground.guardian_lname, familyBackground.guardian_fname].filter(Boolean).join(', ')} />
                        <Row label="Relationship" value={familyBackground.guardian_relationship} />
                        <Row label="Contact" value={familyBackground.guardian_contact_no} />
                        <Row label="Emergency Contact" value={familyBackground.emergency_contact_name} />
                        <Row label="Emergency Mobile" value={familyBackground.emergency_mobile_phone} />
                    </Section>
                )}

                {/* Siblings */}
                <Section title="Siblings">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr className="border-b border-gray-100">
                                    <th className="py-2 text-left font-semibold text-gray-500">Name</th>
                                    <th className="py-2 text-left font-semibold text-gray-500">Grade Level</th>
                                    <th className="py-2 text-left font-semibold text-gray-500">ID Number</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {siblings.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-sm text-gray-400">No siblings added.</td>
                                    </tr>
                                ) : siblings.map((s, i) => (
                                    <tr key={i}>
                                        <td className="py-1.5 text-gray-800">{s.sibling_full_name ?? '—'}</td>
                                        <td className="py-1.5 text-gray-600">{s.sibling_grade_level ?? '—'}</td>
                                        <td className="py-1.5 font-mono text-gray-600">{s.sibling_id_number ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                {/* Educational Background */}
                <Section title="Educational Background">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr className="border-b border-gray-100">
                                    <th className="py-2 pr-4 text-left font-semibold text-gray-500">School</th>
                                    <th className="py-2 pr-4 text-left font-semibold text-gray-500">Address</th>
                                    <th className="py-2 pr-4 text-left font-semibold text-gray-500">Grade</th>
                                    <th className="py-2 pr-4 text-left font-semibold text-gray-500">Year</th>
                                    <th className="py-2 pr-4 text-left font-semibold text-gray-500">Gen. Avg.</th>
                                    <th className="py-2 text-left font-semibold text-gray-500">Honors / Awards</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {educationalBackground.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-sm text-gray-400">No educational background added.</td>
                                    </tr>
                                ) : educationalBackground.map((eb) => (
                                        <tr key={eb.id}>
                                            <td className="py-1.5 pr-4 text-gray-800">{eb.school_name ?? '—'}</td>
                                            <td className="py-1.5 pr-4 text-gray-600">{eb.school_address ?? '—'}</td>
                                            <td className="py-1.5 pr-4 text-gray-600 whitespace-nowrap">
                                                {eb.from_grade && eb.to_grade ? `${eb.from_grade} – ${eb.to_grade}` : (eb.from_grade ?? eb.to_grade ?? '—')}
                                            </td>
                                            <td className="py-1.5 pr-4 text-gray-600 whitespace-nowrap">
                                                {eb.from_year && eb.to_year ? `${eb.from_year} – ${eb.to_year}` : (eb.from_year ?? eb.to_year ?? '—')}
                                            </td>
                                            <td className="py-1.5 pr-4 text-gray-600">{eb.general_average ?? '—'}</td>
                                            <td className="py-1.5 text-gray-600">{eb.honors_awards ?? '—'}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                {/* Documents */}
                {documents && (
                    <Section title="Uploaded Documents">
                        <div className="space-y-3">
                            <Row label="Certificate of Enrollment" value={<FileLink path={documents.certificate_of_enrollment} label="View" />} />
                            <Row label="Birth Certificate" value={<FileLink path={documents.birth_certificate} label="View" />} />
                            <Row label="Report Card (Front)" value={<FileLink path={documents.latest_report_card_front} label="View" />} />
                            <Row label="Report Card (Back)" value={<FileLink path={documents.latest_report_card_back} label="View" />} />
                        </div>
                    </Section>
                )}

                {/* Enrollment History */}
                {enrollments.length > 0 && (
                    <Section title="Enrollment History">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="min-w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr className="border-b border-gray-100">
                                        <th className="py-2 text-left font-semibold text-gray-500">School Year</th>
                                        <th className="py-2 text-left font-semibold text-gray-500">Semester</th>
                                        <th className="py-2 text-left font-semibold text-gray-500">Year Level</th>
                                        <th className="py-2 text-left font-semibold text-gray-500">Status</th>
                                        <th className="py-2 text-left font-semibold text-gray-500">Report Card</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {enrollments.map((e) => (
                                        <tr key={e.id}>
                                            <td className="py-1.5 text-gray-700">{e.school_year}</td>
                                            <td className="py-1.5 text-gray-700">{e.semester}</td>
                                            <td className="py-1.5 text-gray-700">{e.year_level}</td>
                                            <td className="py-1.5">
                                                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{e.status}</span>
                                            </td>
                                            <td className="py-1.5">
                                                <a href={`/reports/report-card/${e.id}`} target="_blank" rel="noreferrer">
                                                    <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                                                        <Printer className="h-3 w-3" />
                                                        Print
                                                    </Button>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}
            </div>

            <Dialog open={showWithdrawDialog} onOpenChange={(open) => { if (!withdrawForm.processing) setShowWithdrawDialog(open); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-700">Withdraw Student</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleWithdraw} className="space-y-4">
                        <p className="text-sm text-gray-600">This action is permanent and cannot be undone.</p>
                        <div>
                            <Label htmlFor="s_withdrawal_type">Withdrawal Type</Label>
                            <Select value={withdrawForm.data.withdrawal_type} onValueChange={(v) => withdrawForm.setData('withdrawal_type', v)}>
                                <SelectTrigger id="s_withdrawal_type" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="during_enrollment">During Enrollment Period</SelectItem>
                                    <SelectItem value="after_classes">After Classes Have Started</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="s_refund_amount">Refund Amount (₱)</Label>
                            <Input
                                id="s_refund_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={withdrawForm.data.refund_amount}
                                onChange={(e) => withdrawForm.setData('refund_amount', e.target.value)}
                                className="mt-1"
                            />
                            {withdrawForm.errors.refund_amount && <p className="mt-1 text-sm text-red-600">{withdrawForm.errors.refund_amount}</p>}
                        </div>
                        <div>
                            <Label htmlFor="s_reason">Reason (optional)</Label>
                            <textarea
                                id="s_reason"
                                rows={3}
                                value={withdrawForm.data.reason}
                                onChange={(e) => withdrawForm.setData('reason', e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="Optional reason for withdrawal"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowWithdrawDialog(false)} disabled={withdrawForm.processing}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={withdrawForm.processing}>
                                {withdrawForm.processing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
