<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Services\Admin\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(private ReportService $reportService)
    {
    }

    public function classRecord(BlockSection $blockSection, Subject $subject, string $quarter): Response
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $data = $this->reportService->classRecordData($blockSection, $subject, $quarter);

        return $this->toCsvResponse($data['header'], $data['rows'], "class-record-{$blockSection->code}-{$subject->code}-{$quarter}.csv");
    }

    public function gradingSheet(BlockSection $blockSection): Response
    {
        $data = $this->reportService->gradingSheetData($blockSection);

        return $this->toCsvResponse($data['header'], $data['rows'], "grading-sheet-{$blockSection->code}.csv");
    }

    public function reportCard(StudentEnrollment $studentEnrollment)
    {
        $data = $this->reportService->reportCardData($studentEnrollment);

        $pdf = Pdf::loadView('reports.report-card', $data['view'])->setPaper('a4', 'portrait');

        return $pdf->download($data['filename']);
    }

    public function attendanceSummary(BlockSection $blockSection, Subject $subject): Response
    {
        $data = $this->reportService->attendanceSummaryData($blockSection, $subject);

        return $this->toCsvResponse($data['header'], $data['rows'], "attendance-{$blockSection->code}-{$subject->code}.csv");
    }

    private function toCsvResponse(array $header, array $rows, string $filename): Response
    {
        $output = fopen('php://temp', 'r+');
        fputcsv($output, $header);
        foreach ($rows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
