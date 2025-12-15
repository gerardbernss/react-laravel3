<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Student Admissions</title>
</head>
<body>
    <p>Hello, {{ $mailData['first_name'] }}. <br><br></p>
    <p>
        Please take note of your official SLU Student ID Number: <br><br><br> {{ $mailData['student_id_number'] }} <br><br><br>
        Your SLU Student ID Number will be your username in the Student Portal with the same password sent to you for enrollment. <br><br>
        May this also serve as a reminder not to share your credentials to anyone aside from your family members. <br> <br>
        Regards, <br><br><br>

        *This email is system-generated, please do not reply.*
    </p>


</body>
</html>
