from __future__ import annotations

MOCK_STUDENT_DATA = {
    "student": "Duman",
    "subjects": [
        {
            "name": "Physics",
            "grades": [5, 4, 3, 3],
            "attendance": 0.7,
            "topics": ["Kinematics", "Forces"],
        },
        {
            "name": "Mathematics",
            "grades": [4, 4, 4, 5],
            "attendance": 0.92,
            "topics": ["Algebra", "Functions"],
        },
        {
            "name": "History",
            "grades": [3, 3, 4, 3],
            "attendance": 0.82,
            "topics": ["World War II", "Cold War"],
        },
    ],
}

MOCK_TIMETABLE = {
    "source": "edupage_like_mock",
    "school": "Aqbobek Lyceum",
    "timezone": "Asia/Qyzylorda",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "entries": [
        {"day": "Monday", "slot": "08:30", "class_id": "10A", "subject": "Mathematics", "teacher": "Damir Nursultan", "room": "201"},
        {"day": "Monday", "slot": "09:25", "class_id": "10A", "subject": "Physics", "teacher": "Aidana Sarsen", "room": "Lab-1"},
        {"day": "Monday", "slot": "10:20", "class_id": "10A", "subject": "History", "teacher": "Aruzhan Kudaibergen", "room": "105"},
        {"day": "Monday", "slot": "11:15", "class_id": "10A", "subject": "English", "teacher": "Dana Rakhim", "room": "304"},
        {"day": "Monday", "slot": "09:25", "class_id": "10B", "subject": "Physics", "teacher": "Aidana Sarsen", "room": "Lab-1"},
        {"day": "Monday", "slot": "10:20", "class_id": "10B", "subject": "Chemistry", "teacher": "Madi Akhmet", "room": "Lab-2"},
        {"day": "Monday", "slot": "11:15", "class_id": "10B", "subject": "Mathematics", "teacher": "Damir Nursultan", "room": "202"},
        {"day": "Monday", "slot": "12:10", "class_id": "10C", "subject": "History", "teacher": "Aruzhan Kudaibergen", "room": "105"},
        {"day": "Tuesday", "slot": "08:30", "class_id": "10A", "subject": "Informatics", "teacher": "Ainur Duisen", "room": "IT-1"},
        {"day": "Tuesday", "slot": "09:25", "class_id": "10A", "subject": "Physics", "teacher": "Aidana Sarsen", "room": "Lab-1"},
        {"day": "Tuesday", "slot": "10:20", "class_id": "10B", "subject": "Physics", "teacher": "Aidana Sarsen", "room": "Lab-1"},
        {"day": "Tuesday", "slot": "11:15", "class_id": "10C", "subject": "Mathematics", "teacher": "Damir Nursultan", "room": "201"},
        {"day": "Wednesday", "slot": "08:30", "class_id": "10A", "subject": "Biology", "teacher": "Mira Tursyn", "room": "308"},
        {"day": "Wednesday", "slot": "09:25", "class_id": "10B", "subject": "English", "teacher": "Dana Rakhim", "room": "304"},
        {"day": "Wednesday", "slot": "10:20", "class_id": "10C", "subject": "Physics", "teacher": "Arman Bekov", "room": "Lab-2"},
        {"day": "Thursday", "slot": "08:30", "class_id": "10A", "subject": "Chemistry", "teacher": "Madi Akhmet", "room": "Lab-2"},
        {"day": "Thursday", "slot": "09:25", "class_id": "10B", "subject": "Informatics", "teacher": "Ainur Duisen", "room": "IT-1"},
        {"day": "Thursday", "slot": "10:20", "class_id": "10C", "subject": "History", "teacher": "Aruzhan Kudaibergen", "room": "105"},
        {"day": "Friday", "slot": "08:30", "class_id": "10A", "subject": "Physics", "teacher": "Aidana Sarsen", "room": "Lab-1"},
        {"day": "Friday", "slot": "09:25", "class_id": "10B", "subject": "Mathematics", "teacher": "Damir Nursultan", "room": "202"},
        {"day": "Friday", "slot": "10:20", "class_id": "10C", "subject": "English", "teacher": "Dana Rakhim", "room": "304"},
    ],
}

MOCK_SCHEDULE = {
    "student": {
        "role": "student",
        "day": "Monday",
        "lessons": [
            {"time": "08:30", "subject": "Mathematics", "room": "201"},
            {"time": "09:25", "subject": "Physics", "room": "Lab-1"},
            {"time": "10:20", "subject": "History", "room": "105"},
        ],
    },
    "teacher": {
        "role": "teacher",
        "day": "Monday",
        "lessons": [
            {"time": "08:30", "subject": "Physics 10A", "room": "Lab-1"},
            {"time": "09:25", "subject": "Physics 11B", "room": "Lab-1"},
            {"time": "10:20", "subject": "Mentor Hour", "room": "312"},
        ],
    },
    "admin": {
        "role": "admin",
        "day": "Monday",
        "events": [
            {"time": "08:00", "title": "Staff Briefing", "location": "Conference"},
            {"time": "11:00", "title": "Schedule Review", "location": "Office"},
        ],
    },
    "parent": {
        "role": "parent",
        "day": "Monday",
        "events": [
            {"time": "18:00", "title": "Weekly Parent Digest", "location": "Mobile app"},
            {"time": "19:00", "title": "Consultation Booking Window", "location": "Portal"},
        ],
    },
}

MOCK_KIOSK_CONTENT = {
    "announcements": [
        {
            "id": "ann-1",
            "title": "Olympiad Registration",
            "message": "Regional math olympiad registration closes on April 3. Apply in room 204.",
            "priority": "high",
            "valid_until": "2026-04-03",
        },
        {
            "id": "ann-2",
            "title": "Uniform Reminder",
            "message": "Spring uniform format is active from Monday, April 6.",
            "priority": "medium",
            "valid_until": "2026-04-10",
        },
        {
            "id": "ann-3",
            "title": "Library Drive",
            "message": "Donate one English or Kazakh book this week to support the reading marathon.",
            "priority": "low",
            "valid_until": "2026-04-12",
        },
    ],
    "top_students": [
        {
            "id": "stu-1",
            "name": "Aigerim Sadyk",
            "class_id": "10A",
            "score": 98,
            "achievement": "Top weekly GPA and full attendance",
        },
        {
            "id": "stu-2",
            "name": "Nurtas Beisen",
            "class_id": "11B",
            "score": 96,
            "achievement": "Physics contest winner",
        },
        {
            "id": "stu-3",
            "name": "Kamila Omar",
            "class_id": "9A",
            "score": 95,
            "achievement": "Best progress in mathematics",
        },
        {
            "id": "stu-4",
            "name": "Yerzhan Mukan",
            "class_id": "12A",
            "score": 94,
            "achievement": "Student mentor volunteer",
        },
    ],
    "events": [
        {
            "id": "evt-1",
            "date": "2026-04-01",
            "time": "15:00",
            "title": "Debate Club Finals",
            "location": "Assembly Hall",
            "audience": "Grades 9-12",
        },
        {
            "id": "evt-2",
            "date": "2026-04-02",
            "time": "12:30",
            "title": "Open Lab: Robotics",
            "location": "IT-2",
            "audience": "Grades 7-11",
        },
        {
            "id": "evt-3",
            "date": "2026-04-04",
            "time": "10:00",
            "title": "Parent Consultation Day",
            "location": "Main Building",
            "audience": "Parents",
        },
    ],
    "replacements": [
        {
            "id": "rep-1",
            "day": "Monday",
            "slot": "09:25",
            "class_id": "10A",
            "subject": "Physics",
            "type": "substitute_teacher",
            "teacher_name": "Damir Nursultan",
            "note": "Substitution approved by admin",
        },
        {
            "id": "rep-2",
            "day": "Monday",
            "slot": "11:15",
            "class_id": "10C",
            "subject": "Physics",
            "type": "self_study",
            "teacher_name": None,
            "note": "Independent work packet assigned",
        },
    ],
}
