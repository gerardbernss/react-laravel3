<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Application Final Result</title>
</head>
<body>
    <p>Dear {{ $applicant->personalData->first_name }} {{ $applicant->personalData->last_name }},</p>

    <p>
        This email is to inform you about the final result of your application (Application No: {{ $applicant->application_number }}).
    </p>

    <p>
        <strong>Status: {{ $applicant->application_status }}</strong>
    </p>

    <p>
        Please log in to your applicant portal for more details or contact the admissions office if you have any questions.
    </p>

    <p>
        Regards,<br>
        Admissions Office
    </p>

    <p>
        <small>*This email is system-generated, please do not reply.*</small>
    </p>
</body>
</html>
