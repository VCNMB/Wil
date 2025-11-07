using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using VarsityTrackerApi.Models.Pinging;

namespace VarsityTrackerApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PingingController : ControllerBase
    {
        private static ConcurrentDictionary<string, int> _pingCounts = new();
        private readonly IHttpClientFactory _httpClientFactory;

        public PingingController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        // Temporary storage
        private static string _espPingString;
        private static DateTime _espPingTime;
        private static string _reactPingString;
        private static DateTime _reactPingTime;

        // =============================================================
        // POST: Receive ESP Ping
        // =============================================================
        [HttpPost("ReceiveEspPing")]
        public IActionResult ReceiveEspPing([FromBody] string espPingString)
        {
            if (string.IsNullOrWhiteSpace(espPingString))
                return BadRequest("ESP ping string cannot be empty.");

            _espPingString = espPingString.Trim();
            _espPingTime = DateTime.UtcNow;

            return Ok("ESP ping received.");
        }

        // =============================================================
        // POST: Receive React Ping
        // =============================================================
        [HttpPost("ReceiveReactPing")]
        public async Task<IActionResult> ReceiveReactPing([FromBody] PingRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.LessonId) || string.IsNullOrWhiteSpace(request.StudentNumber))
                return BadRequest("LessonId and StudentNumber are required.");

            string key = $"{request.LessonId}_{request.StudentNumber}";

            // Increment counter (max 3)
            int currentCount = _pingCounts.GetOrAdd(key, 0);
            if (currentCount < 3)
            {
                currentCount++;
                _pingCounts[key] = currentCount;
            }

            // Determine attendance status
            string status = currentCount < 3 ? "Absent" : "Present";

            Console.WriteLine($"[PING] Lesson: {request.LessonId}, Student: {request.StudentNumber}, Count: {currentCount}, Status: {status}");

            // Step 2: Update report status automatically in Lesson API
            var client = _httpClientFactory.CreateClient();
            var updateUrl = $"https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/api/Lesson/update_report_status" +
                            $"?lessonId={request.LessonId}&studentNumber={request.StudentNumber}&newStatus={status}";

            var response = await client.PutAsync(updateUrl, null);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[ERROR] Could not update status for {request.StudentNumber}: {response.StatusCode}");
            }

            // Return status summary
            return Ok(new
            {
                LessonId = request.LessonId,
                StudentNumber = request.StudentNumber,
                PingCount = currentCount,
                Status = status
            });
        }


        // =============================================================
        // GET: Compare ESP & React Pings
        // =============================================================
        [HttpGet("ComparePings")]
        public IActionResult ComparePings()
        {
            if (string.IsNullOrEmpty(_espPingString) || string.IsNullOrEmpty(_reactPingString))
                return BadRequest("Both ESP and React pings must be received first.");

            // Remove anything after '/' for comparison
            string espBase = _espPingString.Split('/')[0];
            string reactBase = _reactPingString.Split('/')[0];

            // Calculate time difference
            double timeDifference = Math.Abs((_espPingTime - _reactPingTime).TotalMinutes);

            // Compare base strings (case-insensitive) and timestamp
            bool isMatch = espBase.Equals(reactBase, StringComparison.OrdinalIgnoreCase) && timeDifference <= 1;

            return Ok(new
            {
                EspPing = espBase,
                ReactPing = reactBase,
                TimeDifferenceMinutes = timeDifference,
                Match = isMatch
            });
        }

        // =============================================================
        // Utility: Decrypt Encrypted Student Number (if used)
        // =============================================================
        // ⚠️ Example AES decryption — replace with your actual key setup
        private static string DecryptStudentNumber(string encryptedText)
        {
            try
            {
                // These should be securely stored (e.g., Azure Key Vault)
                string key = "1234567890ABCDEF1234567890ABCDEF"; // 32 chars = 256-bit key
                string iv = "ABCDEF1234567890"; // 16 chars = 128-bit IV

                using (Aes aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(key);
                    aes.IV = Encoding.UTF8.GetBytes(iv);
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    byte[] buffer = Convert.FromBase64String(encryptedText);
                    using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
                    byte[] decrypted = decryptor.TransformFinalBlock(buffer, 0, buffer.Length);

                    return Encoding.UTF8.GetString(decrypted);
                }
            }
            catch
            {
                return "DECRYPTION_FAILED";
            }
        }


    }
}
