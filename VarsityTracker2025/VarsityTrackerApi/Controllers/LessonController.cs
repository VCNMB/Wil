using Azure;
using Azure.Data.Tables;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.Reflection;
using VarsityTrackerApi.Models;
using VarsityTrackerApi.Models.Access;
using VarsityTrackerApi.Models.Lesson;
using VarsityTrackerApi.Models.Module;
using VarsityTrackerApi.Models.Report;

namespace VarsityTrackerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LessonController : ControllerBase
    {
        private readonly TableClient _lecturerTable;
        private readonly string _connectionString;
        private readonly TableClient _studentTable;
        private readonly TableClient _lessonTable;
        private readonly TableClient _moduleTable;
        private readonly TableClient _waitingList;
        private readonly TableClient _reportsTable;
        private readonly TableClient _studentModuleTable;
        private readonly TableClient _lessonListTable;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName = "qrcodes";
        private readonly TableClient _attendanceTable;

        public LessonController(IOptions<AzureTableStorageSettings> storageOptions)
        {
            _connectionString = storageOptions.Value.ConnectionString;
            _lecturerTable = new TableClient(_connectionString, "Lecturers");
            _studentTable = new TableClient(_connectionString, "Students");
            _lessonTable = new TableClient(_connectionString, "Lessons");
            _moduleTable = new TableClient(_connectionString, "Modules");
            _blobServiceClient = new BlobServiceClient(_connectionString);
            _waitingList = new TableClient(_connectionString, "WaitingList");
            _reportsTable = new TableClient(_connectionString, "Reports");
            _studentModuleTable = new TableClient(_connectionString, "StudentModules");
            _lessonListTable = new TableClient(_connectionString, "LessonList");
            _attendanceTable = new TableClient(_connectionString, "Attendance");
        }

        [HttpPost("create_lesson")]
        public async Task<IActionResult> Create_Lesson(LessonModel lesson)
        {
            // Validate that the date is not empty
            if (lesson.date == default)
            {
                return BadRequest("Lesson date is required and cannot be empty.");
            }

            lesson.date = DateTime.SpecifyKind(lesson.date, DateTimeKind.Utc);

            // Check if the date falls on a weekend (Saturday and Sunday)
            if (lesson.date.DayOfWeek == DayOfWeek.Saturday || lesson.date.DayOfWeek == DayOfWeek.Sunday)
            {
                return BadRequest("Lesson date cannot be scheduled on a weekend (Saturday or Sunday).");
            }

            // Check if the lesson date is being made in the past
            if (lesson.date.Date < DateTime.UtcNow.Date)
            {
                return BadRequest("Lesson date cannot be made in the past. Please select today or a future date.");
            }

            if (lesson == null)
                return BadRequest("Lesson payload is required.");
            if (lesson.date == default)
                return BadRequest("Lesson date is required.");

            await foreach (var existingLesson in _lessonTable.QueryAsync<Lesson>())
            {
                if (existingLesson.date == lesson.date && existingLesson.moduleCode == lesson.moduleCode && existingLesson.classroom == lesson.classroom.ToUpper())
                    return BadRequest($"Lesson with ID: {existingLesson.lessonID} already exists for {lesson.date} in {lesson.classroom.ToUpper()}.");
            }

            var lessons = new List<Lesson>();
            await foreach (var existing in _lessonTable.QueryAsync<Lesson>())
            {
                if (existing.moduleCode == lesson.moduleCode)
                    lessons.Add(existing);
            }

            var specifiedDate = DateTime.SpecifyKind(lesson.date, DateTimeKind.Utc);
            var lessonID = $"{lesson.moduleCode}-LES-{lessons.Count}";

            var newLesson = new Lesson
            {
                PartitionKey = "Lessons",
                RowKey = Guid.NewGuid().ToString(),
                lessonID = lessonID,
                lecturerID = lesson.lecturerID,
                moduleCode = lesson.moduleCode,
                courseCode = lesson.courseCode,
                date = specifiedDate,
                classroom = lesson.classroom.ToUpper(),
                started = false,
                finished = false
            };

            await _lessonTable.AddEntityAsync(newLesson);
            //// --- QR Code Generation (sharp 200x200) ---
            //string qrText = $"LessonID:{newLesson.lessonID}|Module:{newLesson.moduleCode}|Course:{newLesson.courseCode}|Date:{newLesson.date:O}";
            //using var qrGenerator = new QRCodeGenerator();
            //using var qrCodeData = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q);
            //using var qrCode = new QRCode(qrCodeData);

            //int moduleCount = qrCodeData.ModuleMatrix.Count;
            //int pixelsPerModule = Math.Max(1, 200 / moduleCount); // guard against 0

            //using Bitmap qrBitmap = qrCode.GetGraphic(pixelsPerModule, Color.Black, Color.White, drawQuietZones: false);

            //Bitmap finalQr = new Bitmap(200, 200);
            //using (Graphics g = Graphics.FromImage(finalQr))
            //{
            //    g.Clear(Color.White);
            //    int offsetX = (200 - qrBitmap.Width) / 2;
            //    int offsetY = (200 - qrBitmap.Height) / 2;
            //    g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
            //    g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;
            //    g.DrawImage(qrBitmap, offsetX, offsetY, qrBitmap.Width, qrBitmap.Height);
            //}

            //using var ms = new MemoryStream();
            //var encoder = ImageCodecInfo.GetImageEncoders().First(c => c.MimeType == "image/jpeg");
            //var encoderParams = new EncoderParameters(1);
            //encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, 50L);

            //finalQr.Save(ms, encoder, encoderParams);
            //ms.Position = 0;

            //var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            //await containerClient.CreateIfNotExistsAsync();

            //// If your storage account disallows public access, SetAccessPolicyAsync may fail.
            //// Catch and ignore so we don't fail the whole call; the blob URI will still be returned.
            //try
            //{
            //    await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);
            //}
            //catch (RequestFailedException)
            //{
            //    // ignore - account might prohibit public access; consider using SAS for access in production
            //}

            //// Overwrite file every time: lessonID.jpeg
            //string fileName = $"{lessonID}.jpeg";
            //var blobClient = containerClient.GetBlobClient(fileName);
            //ms.Position = 0;
            //await blobClient.UploadAsync(ms, overwrite: true);

            //// Save QR URL back to lesson — use Upsert so we don't need an in-memory ETag
            //newLesson.qrUrl = blobClient.Uri.ToString();
            await _lessonTable.UpsertEntityAsync(newLesson, TableUpdateMode.Replace);

            return Ok($"Lesson {lessonID} created successfully.");
        }

        //[HttpPost("generateQRCode/{lessonID}")]
        //public async Task<IActionResult> GenerateLessonQRCode(string lessonID)
        //{
        //    Lesson lesson = null;
        //    await foreach (var l in _lessonTable.QueryAsync<Lesson>(x => x.lessonID == lessonID))
        //    {
        //        lesson = l;
        //        break;
        //    }

        //    if (lesson == null)
        //        return NotFound("Lesson not found");

        //    string qrText = $"LessonID:{lesson.lessonID}|Module:{lesson.moduleCode}|Course:{lesson.courseCode}|Date:{lesson.date:O}";

        //    using var qrGenerator = new QRCodeGenerator();
        //    using var qrCodeData = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q);
        //    using var qrCode = new QRCode(qrCodeData);

        //    int moduleCount = qrCodeData.ModuleMatrix.Count;
        //    int pixelsPerModule = Math.Max(1, 200 / moduleCount);

        //    using Bitmap qrBitmap = qrCode.GetGraphic(pixelsPerModule, Color.Black, Color.White, drawQuietZones: false);

        //    Bitmap finalQr = new Bitmap(200, 200);
        //    using (Graphics g = Graphics.FromImage(finalQr))
        //    {
        //        g.Clear(Color.White);
        //        int offsetX = (200 - qrBitmap.Width) / 2;
        //        int offsetY = (200 - qrBitmap.Height) / 2;
        //        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
        //        g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;
        //        g.DrawImage(qrBitmap, offsetX, offsetY, qrBitmap.Width, qrBitmap.Height);
        //    }

        //    using var ms = new MemoryStream();
        //    var encoder = ImageCodecInfo.GetImageEncoders().First(c => c.MimeType == "image/jpeg");
        //    var encoderParams = new EncoderParameters(1);
        //    encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, 50L);

        //    finalQr.Save(ms, encoder, encoderParams);
        //    ms.Position = 0;

        //    var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        //    await containerClient.CreateIfNotExistsAsync();
        //    try
        //    {
        //        await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);
        //    }
        //    catch (RequestFailedException)
        //    {
        //        // ignore if public access blocked at account level
        //    }

        //    // Overwrite the canonical file name for the lesson
        //    string fileName = $"{lesson.lessonID}.jpeg";
        //    var blobClient = containerClient.GetBlobClient(fileName);
        //    ms.Position = 0;
        //    await blobClient.UploadAsync(ms, overwrite: true);

        //    string publicUrl = blobClient.Uri.ToString();

        //    // Persist qrUrl back to lesson using Upsert (no ETag required)
        //    lesson.qrUrl = publicUrl;
        //    await _lessonTable.UpsertEntityAsync(lesson, TableUpdateMode.Replace);

        //    return Ok(new { message = "QR Generated", qrCodeUrl = publicUrl });
        //}

        //[HttpPost("scanQRCode")]
        //public async Task<IActionResult> ScanQRCode([FromBody] QRScanRequest request)
        //{
        //    if (string.IsNullOrWhiteSpace(request.QRText))
        //        return BadRequest("QRText is required.");

        //    if (string.IsNullOrWhiteSpace(request.StudentID))
        //        return BadRequest("StudentID is required.");

        //    // Parse QR Format: LessonID:xyz|Module:abc|Course:def|Date:...
        //    var parts = request.QRText.Split('|', StringSplitOptions.RemoveEmptyEntries);
        //    var data = parts.ToDictionary(
        //        p => p.Split(':', 2)[0],
        //        p => p.Split(':', 2)[1]
        //    );

        //    if (!data.ContainsKey("LessonID"))
        //        return BadRequest("QRText does not contain LessonID.");

        //    string lessonID = data["LessonID"];

        //    // Find lesson
        //    Lesson lesson = null;
        //    await foreach (var l in _lessonTable.QueryAsync<Lesson>(x => x.lessonID == lessonID))
        //    {
        //        lesson = l;
        //        break;
        //    }

        //    if (lesson == null)
        //        return NotFound("Invalid QR - lesson not found.");

        //    if (!lesson.started)
        //        return BadRequest("Lesson has not started yet.");
        //    if (lesson.finished)
        //        return BadRequest("Lesson has already ended.");

        //    // Check attendance table for duplicates
        //    await foreach (var a in _attendanceTable.QueryAsync<Attendance>(x => x.lessonID == lessonID && x.studentID == request.StudentID))
        //    {
        //        return BadRequest("Already clocked-in.");
        //    }

        //    // Create attendance record
        //    var attendance = new Attendance
        //    {
        //        PartitionKey = "Attendance",
        //        RowKey = Guid.NewGuid().ToString(),
        //        lessonID = lessonID,
        //        studentID = request.StudentID,
        //        timestamp = DateTime.UtcNow
        //    };

        //    await _attendanceTable.AddEntityAsync(attendance);

        //    return Ok(new { message = "Clock-in successful!" });
        //}

        [HttpPost("clockin/{studentNumber}/{lessonID}")]
        public async Task<IActionResult> StudentList(string studentNumber, string lessonID)
        {
            try
            {
                if (_studentTable == null || _lessonTable == null || _lessonListTable == null)
                    return StatusCode(500, new { success = false, message = "Storage tables not initialized." });

                // Find the student (case-insensitive)
                Students student = null;
                var lookupStudentNumber = studentNumber?.ToUpper();
                await foreach (var s in _studentTable.QueryAsync<Students>(s => s.studentNumber == lookupStudentNumber))
                {
                    student = s;
                    break;
                }

                if (student == null)
                    return NotFound(new { success = false, message = "Student not found." });

                var now = DateTime.UtcNow;
                var todayStart = now.Date;
                var todayEnd = todayStart.AddDays(1);

                // Find an active lesson that started today
                Lesson lesson = null;
                await foreach (var s in _lessonTable.QueryAsync<Lesson>(s =>
                    s.started == true && s.date >= todayStart && s.date < todayEnd && s.lessonID == lessonID))
                {
                    lesson = s;
                    break;
                }

                if (lesson == null)
                    return NotFound(new { success = false, message = "Lesson not found or not active today." });

                // Check if the student is already in the LessonList for this lesson
                LessonList existingEntry = null;
                await foreach (var entry in _lessonListTable.QueryAsync<LessonList>(l =>
                    l.LessonID == lesson.lessonID && l.StudentID == student.studentNumber))
                {
                    existingEntry = entry;
                    break;
                }

                if (existingEntry != null && existingEntry.ClockInTime.HasValue && existingEntry.ClockOutTime == null)
                {
                    return BadRequest(new { success = false, message = "Student already clocked in for this lesson." });
                }

                if (existingEntry == null)
                {
                    // Add new LessonList record if none exists
                    var addStudent = new LessonList
                    {
                        PartitionKey = "LessonList",
                        RowKey = Guid.NewGuid().ToString(),
                        LessonID = lesson.lessonID,
                        StudentID = student.studentNumber,
                        LessonDate = lesson.date,
                        ClockInTime = now,
                        ClockOutTime = null
                    };

                    await _lessonListTable.AddEntityAsync(addStudent);
                }
                else
                {
                    // Update existing LessonList record's clock-in time
                    existingEntry.ClockInTime = now;
                    existingEntry.ClockOutTime = null;
                    await _lessonListTable.UpdateEntityAsync(existingEntry, existingEntry.ETag, TableUpdateMode.Replace);
                }

                return Ok(new
                {
                    success = true,
                    message = $"Student {studentNumber} clocked in successfully.",
                    lessonID = lesson.lessonID,
                    clockInTime = now
                });
            }
            catch (Exception ex)
            {
                // Log the exception (replace with your logging infrastructure)
                return StatusCode(500, new { success = false, message = "An error occurred while clocking in.", detail = ex.Message });
            }
        }

        [HttpPost("clockoutStudent/{studentNumber}")]
        public async Task<IActionResult> StudentListClockout(string studentNumber)
        {
            var today = DateTime.UtcNow.Date;

            StudentList recordToUpdate = null;

            await foreach (var record in _lessonListTable.QueryAsync<StudentList>(r =>
                r.PartitionKey == "LessonList" &&
                r.StudentID == studentNumber &&
                r.ClockInTime >= today))
            {
                recordToUpdate = record;
                break;
            }

            if (recordToUpdate.ClockInTime == null || recordToUpdate == null)
                return NotFound("No active clock-in found for today.");

            recordToUpdate.ClockOutTime = DateTime.UtcNow;

            await _lessonListTable.UpdateEntityAsync(recordToUpdate, recordToUpdate.ETag, TableUpdateMode.Replace);

            return Ok(new { success = true, message = "Student clocked out." });
        }

        [HttpPost("startLesson/{lessonID}")]
        public async Task<IActionResult> StartLesson(string lessonID)
        {
            // 1. Fetch Lesson Once
            Lesson lesson = null;
            await foreach (var l in _lessonTable.QueryAsync<Lesson>(x => x.lessonID == lessonID))
            {
                lesson = l;
                break;
            }

            if (lesson == null)
                return NotFound("Lesson not found.");

            var today = DateTime.UtcNow.Date;

            // 2. Get Clocked-in Students Today in One Pass
            var clockedInToday = new Dictionary<string, StudentList>();
            await foreach (var s in _waitingList.QueryAsync<StudentList>())
            {
                if (s.ClockInTime.HasValue && s.ClockInTime.Value.Date == today)
                    clockedInToday[s.StudentID] = s;
            }

            // 3. Get All Students Enrolled in This Module
            var enrolledStudents = new List<string>();
            await foreach (var sm in _studentModuleTable.QueryAsync<StudentModules>(m => m.moduleCode == lesson.moduleCode))
            {
                enrolledStudents.Add(sm.studentNumber);
            }

            // 4. Insert Attendance Records 
            foreach (var studentID in enrolledStudents)
            {
                bool exists = false;
                await foreach (var existingEntry in _lessonListTable.QueryAsync<LessonList>(l => l.LessonID == lesson.lessonID && l.StudentID == studentID))
                {
                    exists = true;
                    break;
                }

                if (exists) continue;

                var clocked = clockedInToday.TryGetValue(studentID, out var waitingEntry) ? waitingEntry : null;

                var entry = new LessonList
                {
                    PartitionKey = "LessonList",
                    RowKey = Guid.NewGuid().ToString(),
                    LessonID = lesson.lessonID,
                    StudentID = studentID,
                    LessonDate = lesson.date,
                    ClockInTime = clocked?.ClockInTime,
                    ClockOutTime = clocked?.ClockOutTime
                };

                await _lessonListTable.AddEntityAsync(entry);
            }

            // 5. Mark Lesson as Started 
            lesson.started = true;
            lesson.startedTime = DateTime.UtcNow;
            await _lessonTable.UpsertEntityAsync(lesson, TableUpdateMode.Replace);

            return Ok(new { success = true, message = "Lesson started. Students registered." });
        }

        [HttpGet("getQRCode/{lessonID}")]
        public async Task<IActionResult> GetQRCode(string lessonID)
        {
            Lesson lesson = null;
            await foreach (var l in _lessonTable.QueryAsync<Lesson>(x => x.lessonID == lessonID))
            {
                lesson = l;
                break;
            }

            if (lesson == null)
                return NotFound("Lesson not found");

            if (string.IsNullOrEmpty(lesson.qrUrl))
                return NotFound("QR code not generated yet for this lesson");

            return Ok(new { lessonID = lesson.lessonID, qrCodeUrl = lesson.qrUrl });
        }

        [HttpPost("endLesson/{lessonID}")]
        public async Task<IActionResult> EndLesson(string lessonID)
        {
            // Find the lesson
            Lesson lesson = null;
            await foreach (var s in _lessonTable.QueryAsync<Lesson>(s => s.lessonID == lessonID))
            {
                lesson = s;
                break;
            }

            if (lesson == null || lesson.finished == true)
                return NotFound("Lesson not found or has already ended.");

            // Process only students in this lesson
            var lessonStudents = new List<LessonList>();
            await foreach (var existing in _lessonListTable.QueryAsync<LessonList>(l => l.LessonID == lessonID))
            {
                lessonStudents.Add(existing);
            }

            foreach (var student in lessonStudents)
            {
                // If student has not clocked out, set ClockOutTime to now
                if (student.ClockInTime != null && student.ClockOutTime == null)
                {
                    student.ClockOutTime = DateTime.UtcNow;
                    // Update using Upsert to avoid any ETag issues
                    await _lessonListTable.UpsertEntityAsync(student, TableUpdateMode.Replace);
                }

                // Determine status based on presence
                string status = student.ClockInTime != null ? "Present" : "Absent";

                var report = new Reports
                {
                    PartitionKey = "Reports",
                    RowKey = Guid.NewGuid().ToString(),
                    reportID = $"{lesson.lessonID}-Report",
                    lessonID = lesson.lessonID,
                    studentNumber = student.StudentID,
                    status = status,
                    moduleCode = lesson.moduleCode,
                };

                // Add report
                await _reportsTable.AddEntityAsync(report);

                // Remove from LessonList
                if (!string.IsNullOrEmpty(student.PartitionKey) && !string.IsNullOrEmpty(student.RowKey))
                {
                    await _lessonListTable.DeleteEntityAsync(student.PartitionKey, student.RowKey);
                }
            }
            // Mark lesson as finished (use Upsert to avoid ETag mismatch)
            lesson.finished = true;
            await _lessonTable.UpdateEntityAsync(lesson, lesson.ETag);

            return Ok(new { success = true, message = "Lesson has ended and student statuses recorded." });
        }

        [HttpGet("all_lecturer_lessons")]
        public async Task<IActionResult> GetLessonsByLecturer(string lecturerID)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(lecturerID))
                {
                    return BadRequest("Lecturer ID is required.");
                }

                var lessonsList = new List<Lesson>();

                var filter = TableClient.CreateQueryFilter<Lesson>(m => m.lecturerID == lecturerID);

                await foreach (var module in _lessonTable.QueryAsync<Lesson>(filter))
                {
                    lessonsList.Add(module);
                }

                return Ok(lessonsList);
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error retrieving Lesson: {ex.Message}");
            }
        }

        [HttpGet("display_report")]
        public async Task<IActionResult> GetReportByID(string ReportID)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(ReportID))
                {
                    return BadRequest("Report ID is required.");
                }

                var reportList = new List<Reports>();

                var filter = TableClient.CreateQueryFilter<Reports>(m => m.reportID == ReportID);

                await foreach (var report in _reportsTable.QueryAsync<Reports>(filter))
                {
                    reportList.Add(report);
                }

                return Ok(reportList);
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error retrieving Report: {ex.Message}");
            }
        }

        [HttpGet("all_reports")]
        public async Task<IActionResult> GetAllReports()
        {
            try
            {
                var reportsList = new List<Reports>();

                await foreach (var reports in _reportsTable.QueryAsync<Reports>())
                {
                    reportsList.Add(reports);
                }

                return Ok(reportsList);
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error retrieving modules: {ex.Message}");
            }
        }

        [HttpGet("student_timetable/{studentNumber}")]
        public async Task<IActionResult> GetStudentTimetable(string studentNumber)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(studentNumber))
                    return BadRequest("Student number is required.");

                // Step 1: Get all modules for this student
                var studentModules = new List<StudentModules>();
                var filterModules = TableClient.CreateQueryFilter<StudentModules>(m => m.studentNumber == studentNumber);
                await foreach (var module in _studentModuleTable.QueryAsync<StudentModules>(filterModules))
                {
                    studentModules.Add(module);
                }

                if (studentModules.Count == 0)
                    return NotFound("No modules found for this student.");

                var moduleCodes = studentModules.Select(m => m.moduleCode).ToHashSet();

                // Step 2: Collect lessons for these modules
                var lessons = new List<Lesson>();
                await foreach (var lesson in _lessonTable.QueryAsync<Lesson>())
                {
                    if (moduleCodes.Contains(lesson.moduleCode))
                    {
                        lessons.Add(lesson);
                    }
                }

                if (lessons.Count == 0)
                    return NotFound("No lessons found for this student’s modules.");

                // Step 3: Order lessons by Date (and time if applicable)
                var timetable = lessons
                    .OrderBy(l => l.date) // ensures chronological order
                    .ToList();

                return Ok(timetable);
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error retrieving timetable: {ex.Message}");
            }
        }

        [HttpGet("lecturer_timetable/{lecturerID}")]
        public async Task<IActionResult> GetLecturerTimetable(string lecturerID)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(lecturerID))
                    return BadRequest("Lecturer ID is required.");

                // Step 1: Get all lessons for this lecturer
                var lecturerLessons = new List<Lesson>();
                var filter = TableClient.CreateQueryFilter<Lesson>(l => l.lecturerID == lecturerID);

                await foreach (var lesson in _lessonTable.QueryAsync<Lesson>(filter))
                {
                    lecturerLessons.Add(lesson);
                }

                if (!lecturerLessons.Any())
                    return NotFound("No lessons found for this lecturer.");

                // Step 2: Order lessons by date/time
                var timetable = lecturerLessons
                    .OrderBy(l => l.date)
                    .ToList();

                return Ok(timetable);
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error retrieving lecturer timetable: {ex.Message}");
            }
        }

        [HttpPut("update_report_status")]
        public async Task<IActionResult> UpdateReportStatus(string reportID, string studentNumber, string newStatus)
        {
            if (string.IsNullOrWhiteSpace(reportID) || string.IsNullOrWhiteSpace(studentNumber) || string.IsNullOrWhiteSpace(newStatus))
                return BadRequest("Report ID, student number, and new status are required.");

            try
            {
                // Find the specific report for this student
                Reports reportToUpdate = null;
                await foreach (var report in _reportsTable.QueryAsync<Reports>(r => r.reportID == reportID && r.studentNumber == studentNumber))
                {
                    reportToUpdate = report;
                    break;
                }

                if (reportToUpdate == null)
                    return NotFound($"Report for student {studentNumber} with ID {reportID} not found.");

                // Update the status
                reportToUpdate.status = newStatus;

                // Update in Azure Table Storage
                await _reportsTable.UpdateEntityAsync(reportToUpdate, reportToUpdate.ETag, TableUpdateMode.Replace);

                return Ok(new { success = true, message = $"Report status for student {studentNumber} updated to '{newStatus}'." });
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error updating report: {ex.Message}");
            }
        }

        [HttpGet("all_lessons")]
        public async Task<IActionResult> GetAllLessons()
        {
            try
            {
                var lessonsList = new List<Lesson>();

                // Query all lessons
                await foreach (var lesson in _lessonTable.QueryAsync<Lesson>())
                {
                    lessonsList.Add(lesson);
                }

                return Ok(lessonsList);
            }
            catch (RequestFailedException ex)
            {
                return StatusCode(500, $"Error retrieving lessons: {ex.Message}");
            }
        }
    }
}
