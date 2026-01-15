<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Application Confirmation</title>
</head>
<body>
    <p>Dear {{ $applicant->personalData->first_name }} {{ $applicant->personalData->last_name }},</p>

    <p>
        Thank you for submitting your application to Saint Louis University.
        Your application (Application No: {{ $applicant->application_number }}) has been received and is currently under review.
    </p>

    <p>
        We will notify you of the result of your application once the evaluation process is complete.
        Please keep your application number for future reference.
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
