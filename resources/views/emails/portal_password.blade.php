<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Student Portal Credentials</title>
</head>
<body>
    <p>Dear {{ $applicant->personalData->first_name }} {{ $applicant->personalData->last_name }},</p>

    <p>
        Your student portal account has been created. You can now access the student portal to view your grades, schedule, and other student information.
    </p>

    <p>
        <strong>Your credentials are as follows:</strong><br>
        Username: {{ $applicant->application_number }} (Use your Application Number temporarily)<br>
        Password: {{ $applicant->personalData->last_name }} (Default password is your Last Name in ALL CAPS)
    </p>

    <p>
        Please change your password immediately upon your first login for security purposes.
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
