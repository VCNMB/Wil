using Azure;
using Azure.Data.Tables;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using VarsityTrackerApi.Models.Access;

namespace VarsityTrackerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccessController : ControllerBase
    {
        private readonly TableClient _lecturerTable;
        private readonly string _connectionString;
        private readonly TableClient _studentTable;
        private readonly TableClient _adminTable;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName = "qrcodes";

        public AccessController(IOptions<AzureTableStorageSettings> storageOptions)
        {
            _connectionString = storageOptions.Value.ConnectionString;
            _lecturerTable = new TableClient(_connectionString, "Lecturers");
            _studentTable = new TableClient(_connectionString, "Students");
            _adminTable = new TableClient(_connectionString, "Admins");
            _blobServiceClient = new BlobServiceClient(_connectionString);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create_User(UserModel user)
        {
            if (user == null)
                return BadRequest("User cannot be null.");

            string role = user.role?.Trim().ToLower();

            if (role == "lecturer")
            {

                try
                {
                    await foreach (var existingLecturer in _lecturerTable.QueryAsync<Lecturers>())
                    {
                        if (existingLecturer.lecturerEmail == user.email)
                        {
                            return BadRequest($"{user.email} already exists in the system.");
                        }
                    }
                    // Generate filename from email
                    var filename = user.email.Split('@')[0].ToLower();

                    // Generate SVG QR stream
                    var qrCodeStream = GenerateQrSvgStream(filename);

                    // Upload and get blob URL
                    string qrCodeUrl = await UploadAsync(qrCodeStream, filename);

                    var lecturer = new Lecturers
                    {
                        PartitionKey = "Lecturers",
                        RowKey = Guid.NewGuid().ToString(),
                        lecturerEmail = user.email.ToLower(),
                        password = PasswordHelper.HashPassword(user.password),
                        firstName = user.firstName,
                        lastName = user.lastName,
                        qualification = string.Empty,
                        lecturerID = user.email.Substring(0, user.email.IndexOf("@")).ToLower(),
                        role = "Lecturer",
                        qrCode = qrCodeUrl

                    };

                    await _lecturerTable.AddEntityAsync(lecturer);
                    return Ok($"Lecturer with email: {user.email} created successfully.");
                }
                catch (RequestFailedException ex)
                {
                    return StatusCode(500, $"Error saving Lecturer: {ex.Message}");
                }
            }
            else if (role == "student")
            {
                try
                {
                    // Check if a student with the same email already exists
                    await foreach (var existingStudent in _studentTable.QueryAsync<Students>())
                    {
                        if (existingStudent.studentEmail == user.email)
                        {
                            return BadRequest($"{user.email} already exists in the system.");
                        }
                    }
                    // Generate filename from email
                    var filename = user.email.Split('@')[0].ToLower();

                    // Generate SVG QR stream
                    var qrCodeStream = GenerateQrSvgStream(filename);

                    // Upload and get blob URL
                    string qrCodeUrl = await UploadAsync(qrCodeStream, filename);
                    var student = new Students
                    {
                        PartitionKey = "Students",
                        RowKey = Guid.NewGuid().ToString(),
                        studentEmail = user.email.ToLower(),
                        password = PasswordHelper.HashPassword(user.password),
                        firstName = user.firstName,
                        lastName = user.lastName,
                        studentNumber = user.email.Substring(0, user.email.IndexOf("@")).ToUpper(),
                        StudentCardId = user.email.Substring(0, user.email.IndexOf("@")).ToUpper(),
                        role = "Student",
                        qrCode = qrCodeUrl
                    };
                    await _studentTable.AddEntityAsync(student);
                    return Ok($"Student with email: {user.email} created successfully.");
                }
                catch (RequestFailedException ex)
                {
                    return StatusCode(500, $"Error saving Student: {ex.Message}");
                }
            }
            else if (role == "admin")
            {
                try
                {
                    // Check if a student with the same email already exists
                    await foreach (var existingAdmin in _adminTable.QueryAsync<Admin>())
                    {
                        if (existingAdmin.adminEmail == user.email)
                        {
                            return BadRequest($"{user.email} already exists in the system.");
                        }
                    }
                    // Generate filename from email
                    var filename = user.email.Split('@')[0].ToLower();

                    // Generate SVG QR stream
                    var qrCodeStream = GenerateQrSvgStream(filename);

                    // Upload and get blob URL
                    string qrCodeUrl = await UploadAsync(qrCodeStream, filename);
                    var admin = new Admin
                    {
                        PartitionKey = "Admins",
                        RowKey = Guid.NewGuid().ToString(),
                        adminEmail = user.email.ToLower(),
                        password = PasswordHelper.HashPassword(user.password),
                        firstName = user.firstName,
                        lastName = user.lastName,
                        adminID = user.email.Substring(0, user.email.IndexOf("@")).ToUpper(),
                        role = "Admin",
                        qrCode = qrCodeUrl
                    };

                    await _adminTable.AddEntityAsync(admin);
                    return Ok($"Admin with email: {user.email} created successfully.");
                }
                catch (RequestFailedException ex)
                {
                    return StatusCode(500, $"Error saving Admin: {ex.Message}");
                }
            }
            else
            {
                return BadRequest("Invalid role. Must be either 'Admin', 'Student' or 'Lecturer'.");
            }
        }

        [HttpPost("login_student")]
        public async Task<IActionResult> Login_Student(LoginModel user)
        {
            if (string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password))
                return BadRequest(new { success = false, message = "Email and password are required." });

            Students foundStudent = null;

            var query = _studentTable.QueryAsync<Students>(filter: $"PartitionKey eq 'Students'");
            await foreach (var s in query)
            {
                if (string.Equals(s.studentEmail, user.email, StringComparison.OrdinalIgnoreCase))
                {
                    foundStudent = s;
                    break;
                }
            }

            if (foundStudent == null)
                return NotFound(new { success = false, message = "User not found." });

            bool passwordValid;
            try
            {
                passwordValid = PasswordHelper.VerifyPassword(user.password, foundStudent.password);
            }
            catch
            {
                return BadRequest(new { success = false, message = "Stored password format is invalid." });
            }

            if (!passwordValid)
                return BadRequest(new { success = false, message = "Incorrect password." });

            return Ok(new { success = true, message = "User logged in." });
        }

        [HttpPost("login_lecturer")]
        public async Task<IActionResult> Login_Lecturer(LoginModel user)
        {
            if (string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password))
                return BadRequest("Email and password are required.");

            Lecturers foundLecturer = null;


            var query = _lecturerTable.QueryAsync<Lecturers>(filter: $"PartitionKey eq 'Lecturers'");
            await foreach (var l in query)
            {
                if (string.Equals(l.lecturerEmail, user.email, StringComparison.OrdinalIgnoreCase))
                {
                    foundLecturer = l;
                    break;
                }
            }

            if (foundLecturer == null)
                return NotFound("User not found.");

            bool passwordValid;
            try
            {
                passwordValid = PasswordHelper.VerifyPassword(user.password, foundLecturer.password);
            }
            catch
            {
                return BadRequest(new { success = false, message = "Stored password format is invalid." });
            }

            if (!passwordValid)
                return BadRequest(new { success = false, message = "Incorrect password." }
            );

            return Ok(new { success = true, message = "User logged in." });
        }
        [HttpPost("login_admin")]
        public async Task<IActionResult> Login_Admin(LoginModel user)
        {
            if (string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password))
                return BadRequest("Email and password are required.");

            Admin foundAdmin = null;

            var query = _adminTable.QueryAsync<Admin>(filter: $"PartitionKey eq 'Admins'");
            await foreach (var s in query)
            {
                if (string.Equals(s.adminEmail, user.email, StringComparison.OrdinalIgnoreCase))
                {
                    foundAdmin = s;
                    break;
                }
            }

            if (foundAdmin == null)
                return NotFound("User not found.");

            bool passwordValid;
            try
            {
                passwordValid = PasswordHelper.VerifyPassword(user.password, foundAdmin.password);
            }
            catch
            {
                return BadRequest(new { success = false, message = "Stored password format is invalid." });
            }

            if (!passwordValid)
                return BadRequest(new { success = false, message = "Incorrect password." }
            );

            return Ok(new { success = true, message = "User logged in." });
        }

        [HttpGet("get_details_students")]
        public async Task<IActionResult> getStudentDetaills(string id)
        {
            await foreach (var existingStudent in _studentTable.QueryAsync<Students>())
            {
                if (existingStudent.studentNumber == id.ToUpper())
                {
                    return Ok($"Email: {existingStudent.studentEmail}" +
                        $"\n\nFirstName: {existingStudent.firstName}" +
                        $"\n\nLastName: {existingStudent.lastName}" +
                        $"\n\nETAG: {existingStudent.ETag}" +
                        $"\n\nPartition Key: {existingStudent.PartitionKey}" +
                        $"\n\nRow Key: {existingStudent.RowKey}" +
                        $"\n\nRole: {existingStudent.role}" +
                        $"\n\nID: {existingStudent.studentNumber}");
                }
            }
            return BadRequest($"Student with id:{id} does not exist");
        }

        [HttpGet("get_details_lecturer")]
        public async Task<IActionResult> getLecturerDetaills(string id)
        {
            await foreach (var existingLecturer in _lecturerTable.QueryAsync<Lecturers>())
            {
                if (existingLecturer.lecturerID == id.ToLower())
                {
                    return Ok($"Email: {existingLecturer.lecturerID}" +
                        $"\n\nFirstName: {existingLecturer.firstName}" +
                        $"\n\nLastName: {existingLecturer.lastName}" +
                        $"\n\nETAG: {existingLecturer.ETag}" +
                        $"\n\nPartition Key: {existingLecturer.PartitionKey}" +
                        $"\n\nRow Key: {existingLecturer.RowKey}" +
                        $"\n\nRole: {existingLecturer.role}");
                }
            }
            return BadRequest($"Lecturer with id:{id} does not exist");
        }

        [HttpPut("update_student/{studentNum}")]
        public async Task<IActionResult> UpdateStudent(string studentNum, [FromBody] Students user)
        {

            await foreach (var student in _studentTable.QueryAsync<Students>())
            {
                if (student.studentNumber == studentNum)
                {
                    // Update properties
                    student.firstName = user.firstName;
                    student.lastName = user.lastName;

                    await _studentTable.UpdateEntityAsync(student, student.ETag, TableUpdateMode.Replace);
                    return NoContent(); // 204 Success
                }
            }

            return NotFound("Student not found.");
        }

        [HttpPut("update_lecturer/{id}")]
        public async Task<IActionResult> UpdateLecturer(string id, [FromBody] Lecturers user)
        {

            await foreach (var lecturer in _lecturerTable.QueryAsync<Lecturers>())
            {
                if (lecturer.lecturerID == id)
                {
                    // Update properties
                    lecturer.firstName = user.firstName;
                    lecturer.lastName = user.lastName;
                    lecturer.qualification = user.qualification;

                    await _studentTable.UpdateEntityAsync(lecturer, lecturer.ETag, TableUpdateMode.Replace);
                    return NoContent(); // 204 Success
                }
            }

            return NotFound("Lecturer not found.");
        }
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<string> UploadAsync(Stream fileStream, string filename)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            await containerClient.CreateIfNotExistsAsync();
            var blobClient = containerClient.GetBlobClient($"{filename}.svg");
            await blobClient.UploadAsync(fileStream, overwrite: true);
            return blobClient.Uri.ToString();
        }
        private Stream GenerateQrSvgStream(string content)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
            var svgQr = new SvgQRCode(qrCodeData);
            string svg = svgQr.GetGraphic(4);

            var bytes = Encoding.UTF8.GetBytes(svg);
            var stream = new MemoryStream(bytes);
            return stream;
        }
        //private static string CreateRandomPassword(int passwordLength)
        //{
        //    string allowedChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@$?_-";
        //    char[] chars = new char[passwordLength];
        //    Random rd = new Random();

        //    for (int i = 0; i < passwordLength; i++)
        //    {
        //        chars[i] = allowedChars[rd.Next(0, allowedChars.Length)];
        //    }

        //    return new string(chars);
        //}

        private static void SendDetails(string email, string password)
        {
            try
            {

                SmtpClient mySmtpClient = new SmtpClient("pro.turbo-smtp.com");

                // set smtp-client with basicAuthentication
                mySmtpClient.UseDefaultCredentials = false;
                System.Net.NetworkCredential basicAuthenticationInfo = new
                   System.Net.NetworkCredential("varsitystudent123@gmail.com", "Varsity2025");
                mySmtpClient.Credentials = basicAuthenticationInfo;

                // add from,to mailaddresses
                MailAddress from = new MailAddress("varsitystudent123@gmail.com", "VarsityTracker");
                MailAddress to = new MailAddress(email, "User");
                MailMessage myMail = new System.Net.Mail.MailMessage(from, to);

                // set subject and encoding
                myMail.Subject = "Account details";
                myMail.SubjectEncoding = System.Text.Encoding.UTF8;

                // set body-message and encoding
                myMail.Body = $"<b>Password:{password} </b><br>Email: {email} <b></b> Please use these credentials to log in and ensure password is changed.";
                myMail.BodyEncoding = System.Text.Encoding.UTF8;
                // text or html
                myMail.IsBodyHtml = true;

                mySmtpClient.Send(myMail);
            }

            catch (SmtpException ex)
            {
                throw new ApplicationException
                  ("SmtpException has occured: " + ex.Message);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginUser(LoginModel user)
        {
            if (string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password))
                return BadRequest(new { success = false, message = "Email and password are required." });

            string lowerEmail = user.email.ToLower();

            // Student check
            Students student = null;
            await foreach (var s in _studentTable.QueryAsync<Students>(
                filter: $"PartitionKey eq 'Students' and studentEmail eq '{lowerEmail}'"))
            {
                student = s;
                break;
            }

            if (student != null)
            {
                if (PasswordHelper.VerifyPassword(user.password, student.password))
                    return Ok(new { success = true, role = "Student", message = "User logged in." });
                return BadRequest(new { success = false, message = "Incorrect password." });
            }

            // Lecturer check
            Lecturers lecturer = null;
            await foreach (var l in _lecturerTable.QueryAsync<Lecturers>(
                filter: $"PartitionKey eq 'Lecturers' and lecturerEmail eq '{lowerEmail}'"))
            {
                lecturer = l;
                break;
            }

            if (lecturer != null)
            {
                if (PasswordHelper.VerifyPassword(user.password, lecturer.password))
                    return Ok(new { success = true, role = "Lecturer", message = "User logged in." });
                return BadRequest(new { success = false, message = "Incorrect password." });
            }

            // Admin check
            Admin admin = null;
            await foreach (var a in _adminTable.QueryAsync<Admin>(
                filter: $"PartitionKey eq 'Admins' and adminEmail eq '{lowerEmail}'"))
            {
                admin = a;
                break;
            }

            if (admin != null)
            {
                if (PasswordHelper.VerifyPassword(user.password, admin.password))
                    return Ok(new { success = true, role = "Admin", message = "User logged in." });
                return BadRequest(new { success = false, message = "Incorrect password." });
            }

            // Not found
            return NotFound(new { success = false, message = "User not found." });

        }

        [HttpPut("change_student_password/{studentNum}")]
        public async Task<IActionResult> ChangeStudentPassword(string studentNum, [FromBody] PasswordChangeRequest request)
        {
            await foreach (var student in _studentTable.QueryAsync<Students>())
            {
                if (student.studentNumber == studentNum)
                {
                    // Hash the new password before saving
                    string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                    student.password = hashedPassword;

                    await _studentTable.UpdateEntityAsync(student, student.ETag, TableUpdateMode.Replace);

                    return Ok("Password updated successfully.");
                }
            }

            return NotFound("Student not found.");
        }

        [HttpPut("change_lecturer_password/{lecturerID}")]
        public async Task<IActionResult> ChangeLecturerPassword(string lecturerID, [FromBody] PasswordChangeRequest request)
        {
            await foreach (var lecturer in _lecturerTable.QueryAsync<Lecturers>())
            {
                if (lecturer.lecturerID == lecturerID)
                {
                    // Hash the new password before saving
                    string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                    lecturer.password = hashedPassword;

                    await _lecturerTable.UpdateEntityAsync(lecturer, lecturer.ETag, TableUpdateMode.Replace);

                    return Ok("Password updated successfully.");
                }
            }

            return NotFound("Lecturer not found.");
        }
    }
}
