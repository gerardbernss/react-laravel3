<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10px;
        color: #000;
    }

    .page {
        width: 100%;
        padding: 20px 24px;
        page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }

    /* ── Header ── */
    .header {
        text-align: center;
        margin-bottom: 10px;
        border-bottom: 2px solid #000;
        padding-bottom: 8px;
    }
    .school-name {
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .report-title {
        font-size: 12px;
        font-weight: bold;
        margin-top: 2px;
        letter-spacing: 2px;
        text-transform: uppercase;
    }
    .school-year {
        font-size: 10px;
        margin-top: 2px;
        color: #333;
    }

    /* ── Student info ── */
    .student-info {
        display: table;
        width: 100%;
        margin-bottom: 10px;
        border: 1px solid #999;
    }
    .info-row {
        display: table-row;
    }
    .info-cell {
        display: table-cell;
        padding: 3px 6px;
        border-right: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        vertical-align: middle;
    }
    .info-cell:last-child { border-right: none; }
    .info-label {
        font-size: 7px;
        text-transform: uppercase;
        color: #666;
        display: block;
    }
    .info-value {
        font-size: 10px;
        font-weight: bold;
    }

    /* ── Grades table ── */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }
    th, td {
        border: 1px solid #aaa;
        padding: 3px 5px;
        text-align: center;
        font-size: 9px;
    }
    th {
        background-color: #e8e8e8;
        font-weight: bold;
        font-size: 8px;
        text-transform: uppercase;
    }
    td.subject-name {
        text-align: left;
        font-size: 9px;
    }
    .passed { color: #1a5c1a; font-weight: bold; }
    .failed  { color: #b00000; font-weight: bold; }
    .gwa-row td {
        background: #f0f0f0;
        font-weight: bold;
        font-size: 10px;
    }
    .section-header td {
        background: #d0d8e8;
        font-weight: bold;
        font-size: 8px;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* ── Conduct ── */
    .conduct-section { margin-bottom: 10px; }
    .conduct-title {
        font-weight: bold;
        font-size: 9px;
        text-transform: uppercase;
        margin-bottom: 4px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 2px;
    }

    /* ── Signature block ── */
    .signatures {
        display: table;
        width: 100%;
        margin-top: 16px;
    }
    .sig-cell {
        display: table-cell;
        width: 33%;
        text-align: center;
        padding: 0 8px;
        vertical-align: bottom;
    }
    .sig-line {
        border-top: 1px solid #000;
        margin-top: 24px;
        padding-top: 3px;
        font-size: 9px;
    }
    .sig-label {
        font-size: 8px;
        color: #555;
        margin-top: 1px;
    }

    .no-grade { color: #999; }
</style>
</head>
<body>

@foreach($students as $student)
<div class="page">

    {{-- ══════════ HEADER ══════════ --}}
    <div class="header">
        <div class="school-name">{{ config('app.school_name', 'LES School') }}</div>
        <div class="report-title">Report Card</div>
        <div class="school-year">
            School Year {{ $blockSection->school_year ?? '—' }}
            @if($blockSection->semester) &nbsp;•&nbsp; {{ $blockSection->semester }} @endif
        </div>
    </div>

    {{-- ══════════ STUDENT INFO ══════════ --}}
    <div class="student-info">
        <div class="info-row">
            <div class="info-cell" style="width:35%">
                <span class="info-label">Student Name</span>
                <span class="info-value">{{ $student['name'] }}</span>
            </div>
            <div class="info-cell" style="width:15%">
                <span class="info-label">Student ID</span>
                <span class="info-value">{{ $student['student_id_number'] ?? '—' }}</span>
            </div>
            <div class="info-cell" style="width:20%">
                <span class="info-label">LRN</span>
                <span class="info-value">{{ $student['lrn'] ?? '—' }}</span>
            </div>
            <div class="info-cell" style="width:15%">
                <span class="info-label">Grade Level</span>
                <span class="info-value">{{ $blockSection->grade_level ?? '—' }}</span>
            </div>
            <div class="info-cell" style="width:15%">
                <span class="info-label">Section</span>
                <span class="info-value">{{ $blockSection->code }}</span>
            </div>
        </div>
    </div>

    {{-- ══════════ GRADES TABLE ══════════ --}}
    <table>
        <thead>
            <tr>
                <th style="text-align:left; width:35%">Subject</th>
                @foreach($quarters as $q)
                    <th>{{ $q }}</th>
                @endforeach
                <th>Final Grade</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($student['subjects'] as $row)
                <tr>
                    <td class="subject-name">
                        {{ $row['name'] }}
                        <span style="color:#888; font-size:8px;">({{ $row['code'] }})</span>
                    </td>
                    @foreach($quarters as $q)
                        <td>
                            @if($row['quarter_grades'][$q] !== null)
                                {{ number_format($row['quarter_grades'][$q], 2) }}
                            @else
                                <span class="no-grade">—</span>
                            @endif
                        </td>
                    @endforeach
                    <td>
                        @if($row['final_grade'] !== null)
                            <strong>{{ number_format($row['final_grade'], 2) }}</strong>
                        @else
                            <span class="no-grade">—</span>
                        @endif
                    </td>
                    <td class="{{ $row['status'] === 'Passed' ? 'passed' : ($row['status'] === 'Failed' ? 'failed' : '') }}">
                        {{ $row['status'] ?? '—' }}
                    </td>
                </tr>
            @endforeach

            <tr class="gwa-row">
                <td class="subject-name" colspan="{{ count($quarters) + 1 }}">
                    General Weighted Average (GWA)
                </td>
                <td colspan="2">
                    @if($student['gwa'] !== null)
                        {{ number_format($student['gwa'], 2) }}
                        &nbsp;
                        <span class="{{ $student['gwa'] >= 75 ? 'passed' : 'failed' }}">
                            ({{ $student['gwa'] >= 75 ? 'PASSED' : 'FAILED' }})
                        </span>
                    @else
                        <span class="no-grade">—</span>
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    {{-- ══════════ CONDUCT ══════════ --}}
    @if(count($student['conduct']) > 0)
    <div class="conduct-section">
        <div class="conduct-title">Conduct / Behavior Assessment</div>
        <table>
            <thead>
                <tr>
                    <th style="text-align:left; width:40%">Criteria</th>
                    @foreach($quarters as $q)
                        <th>{{ $q }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($student['conduct'] as $category => $criteria)
                    <tr class="section-header">
                        <td colspan="{{ count($quarters) + 1 }}">{{ $category }}</td>
                    </tr>
                    @foreach($criteria as $criterion)
                        <tr>
                            <td class="subject-name">{{ $criterion['name'] }}</td>
                            @foreach($quarters as $q)
                                <td>
                                    @if($criterion['scores'][$q] !== null)
                                        {{ number_format($criterion['scores'][$q], 0) }}
                                    @else
                                        <span class="no-grade">—</span>
                                    @endif
                                </td>
                            @endforeach
                        </tr>
                    @endforeach
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- ══════════ SIGNATURES ══════════ --}}
    <div class="signatures">
        <div class="sig-cell">
            <div class="sig-line">Class Adviser</div>
            <div class="sig-label">Signature over Printed Name / Date</div>
        </div>
        <div class="sig-cell">
            <div class="sig-line">Parent / Guardian</div>
            <div class="sig-label">Signature over Printed Name / Date</div>
        </div>
        <div class="sig-cell">
            <div class="sig-line">School Principal</div>
            <div class="sig-label">Signature over Printed Name / Date</div>
        </div>
    </div>

</div>
@endforeach

</body>
</html>
