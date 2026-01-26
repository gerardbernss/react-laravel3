<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntranceExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_application_info_id',
        'applicant_personal_data_id',
        'exam_scheduled_date',
        'exam_time',
        'exam_venue',
        'exam_room_number',
        'seat_number',
        'exam_status',
        'exam_completed_date',
        'raw_score',
        'total_marks',
        'percentage_score',
        'result',
        'section_scores',
        'subject_scores',
        'passing_score',
        'exam_remarks',
        'invigilator_remarks',
        'invigilator_name',
        'exam_answer_sheet_path',
        'exam_result_certificate_path',
    ];

    protected $casts = [
        'exam_scheduled_date' => 'datetime',
        'exam_completed_date' => 'datetime',
        'raw_score'           => 'decimal:2',
        'total_marks'         => 'decimal:2',
        'percentage_score'    => 'decimal:2',
        'passing_score'       => 'decimal:2',
        'section_scores'      => 'array',
        'subject_scores'      => 'array',
    ];

    /**
     * Relationships
     */
    public function application()
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    /**
     * Scopes
     */
    public function scopeScheduled($query)
    {
        return $query->where('exam_status', 'Scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('exam_status', 'Completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('exam_status', 'Cancelled');
    }

    public function scopeNoShow($query)
    {
        return $query->where('exam_status', 'No-show');
    }

    public function scopePassed($query)
    {
        return $query->where('result', 'Pass');
    }

    public function scopeFailed($query)
    {
        return $query->where('result', 'Fail');
    }

    public function scopePending($query)
    {
        return $query->where('result', 'Pending');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('exam_scheduled_date', '>=', now())
            ->where('exam_status', '!=', 'Cancelled');
    }

    public function scopeOverdue($query)
    {
        return $query->where('exam_scheduled_date', '<', now())
            ->where('exam_status', '!=', 'Completed')
            ->where('exam_status', '!=', 'Cancelled');
    }

    /**
     * Methods
     */

    /**
     * Calculate percentage score from raw score
     */
    public function calculatePercentage()
    {
        if ($this->total_marks == 0) {
            return 0;
        }
        $percentage = ($this->raw_score / $this->total_marks) * 100;
        return round($percentage, 2);
    }

    /**
     * Determine if applicant passed based on passing score
     */
    public function determineResult()
    {
        if ($this->percentage_score === null) {
            $percentage = $this->calculatePercentage();
            $this->setAttribute('percentage_score', (string) $percentage);
        }

        if ($this->passing_score === null) {
            $this->setAttribute('passing_score', '50');
        }

        $this->result = (float) $this->percentage_score >= (float) $this->passing_score ? 'Pass' : 'Fail';
        return $this->result;
    }

    /**
     * Mark exam as completed and calculate results
     */
    public function markCompleted($rawScore, $totalMarks = 100, $passingScore = 50)
    {
        $this->update([
            'raw_score'           => $rawScore,
            'total_marks'         => $totalMarks,
            'passing_score'       => $passingScore,
            'exam_status'         => 'Completed',
            'exam_completed_date' => now(),
        ]);

        $percentage = $this->calculatePercentage();
        $this->setAttribute('percentage_score', (string) $percentage);
        $this->result = $this->determineResult();
        $this->save();

        return $this;
    }

    /**
     * Mark exam as cancelled
     */
    public function markCancelled($reason = null)
    {
        $this->update([
            'exam_status'  => 'Cancelled',
            'exam_remarks' => $reason,
        ]);
    }

    /**
     * Mark applicant as no-show
     */
    public function markNoShow($reason = null)
    {
        $this->update([
            'exam_status'  => 'No-show',
            'exam_remarks' => $reason,
            'result'       => 'Fail',
        ]);
    }

    /**
     * Check if exam is within the scheduled date/time
     */
    public function isWithinExamWindow($bufferMinutes = 15)
    {
        if (! $this->exam_scheduled_date) {
            return false;
        }

        $now       = now();
        $examStart = $this->exam_scheduled_date;
        $examEnd   = $this->exam_scheduled_date->addMinutes($bufferMinutes);

        return $now >= $examStart && $now <= $examEnd;
    }

    /**
     * Get time until exam
     */
    public function getTimeUntilExam()
    {
        if (! $this->exam_scheduled_date) {
            return null;
        }

        $now = now();
        if ($now > $this->exam_scheduled_date) {
            return null; // Exam has passed
        }

        return $this->exam_scheduled_date->diffForHumans($now);
    }

    /**
     * Get section score
     */
    public function getSectionScore($sectionName)
    {
        if (! $this->section_scores) {
            return null;
        }

        return $this->section_scores[$sectionName] ?? null;
    }

    /**
     * Get subject score
     */
    public function getSubjectScore($subjectName)
    {
        if (! $this->subject_scores) {
            return null;
        }

        return $this->subject_scores[$subjectName] ?? null;
    }

    /**
     * Add section score
     */
    public function addSectionScore($sectionName, $score)
    {
        $sections               = $this->section_scores ?? [];
        $sections[$sectionName] = $score;
        $this->section_scores   = $sections;
        $this->save();

        return $this;
    }

    /**
     * Add subject score
     */
    public function addSubjectScore($subjectName, $score)
    {
        $subjects               = $this->subject_scores ?? [];
        $subjects[$subjectName] = $score;
        $this->subject_scores   = $subjects;
        $this->save();

        return $this;
    }
}
