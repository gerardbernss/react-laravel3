<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Exam Results</title>
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        h2 { color: #1a1a2e; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        .result-passed { display: inline-block; padding: 4px 14px; background: #dcfce7; color: #166534; border-radius: 9999px; font-weight: 600; }
        .result-failed { display: inline-block; padding: 4px 14px; background: #fee2e2; color: #991b1b; border-radius: 9999px; font-weight: 600; }
        .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
<div class="container">
    <h2>Exam Results</h2>

    <p>Dear {{ $personalData->first_name }} {{ $personalData->last_name }},</p>

    <p>
        We are pleased to share the results of your entrance examination
        @if($examResult->applicant_number)
            (Application No: <strong>{{ $examResult->applicant_number }}</strong>)
        @endif
        .
    </p>

    @if($examResult->exam_date || $examResult->exam_venue)
    <p>
        @if($examResult->exam_date)
            <strong>Exam Date:</strong> {{ \Carbon\Carbon::parse($examResult->exam_date)->format('F j, Y') }}
            @if($examResult->exam_time) at {{ $examResult->exam_time }} @endif
            &nbsp;&nbsp;
        @endif
        @if($examResult->exam_venue)
            <strong>Venue:</strong> {{ $examResult->exam_venue }}
        @endif
    </p>
    @endif

    <table>
        <thead>
            <tr>
                <th>Subject</th>
                <th style="text-align:right">Score</th>
            </tr>
        </thead>
        <tbody>
            @if($examResult->math_score !== null)
            <tr>
                <td>Mathematics</td>
                <td style="text-align:right">{{ number_format($examResult->math_score, 2) }}</td>
            </tr>
            @endif
            @if($examResult->english_score !== null)
            <tr>
                <td>English</td>
                <td style="text-align:right">{{ number_format($examResult->english_score, 2) }}</td>
            </tr>
            @endif
            @if($examResult->science_score !== null)
            <tr>
                <td>Science</td>
                <td style="text-align:right">{{ number_format($examResult->science_score, 2) }}</td>
            </tr>
            @endif
            @if($examResult->total_score !== null)
            <tr>
                <td><strong>Total Score</strong></td>
                <td style="text-align:right"><strong>{{ number_format($examResult->total_score, 2) }}</strong></td>
            </tr>
            @endif
            @if($examResult->percentage_score !== null)
            <tr>
                <td><strong>Percentage</strong></td>
                <td style="text-align:right"><strong>{{ number_format($examResult->percentage_score, 2) }}%</strong></td>
            </tr>
            @endif
        </tbody>
    </table>

    <p>
        <strong>Result:</strong>&nbsp;
        @if($examResult->result)
            @if(strtolower($examResult->result) === 'passed')
                <span class="result-passed">Passed</span>
            @else
                <span class="result-failed">Failed</span>
            @endif
        @else
            <em>Pending</em>
        @endif
        @if($examResult->ranking)
            &nbsp;&nbsp;<strong>Rank:</strong> #{{ $examResult->ranking }}
        @endif
    </p>

    <p>Please contact the admissions office if you have any questions about your results.</p>

    <p>Regards,<br>Admissions Office</p>

    <div class="footer">
        <p>*This email is system-generated, please do not reply.*</p>
    </div>
</div>
</body>
</html>
