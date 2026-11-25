package com.elearning.service.impl;

import com.elearning.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Transactional Email Delivery Service.
 * Primary production gateway: Brevo REST API over HTTPS (port 443, 300 emails/day free).
 * Secondary optional fallbacks: Resend REST API (when domain-verified) or local SMTP.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final String DEFAULT_BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
    private static final String DEFAULT_RESEND_API_URL = "https://api.resend.com/emails";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${app.email.brevo-api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @Value("${app.email.brevo-api-url:" + DEFAULT_BREVO_API_URL + "}")
    private String brevoApiUrl = DEFAULT_BREVO_API_URL;

    @Value("${app.email.brevo-sender-email:${BREVO_SENDER_EMAIL:keodeom1700a15@gmail.com}}")
    private String brevoSenderEmail;

    @Value("${app.email.resend-api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${app.email.resend-api-url:" + DEFAULT_RESEND_API_URL + "}")
    private String resendApiUrl = DEFAULT_RESEND_API_URL;

    @Value("${app.email.from-email:${APP_EMAIL_FROM:onboarding@resend.dev}}")
    private String fromEmail;

    @Value("${app.email.from-name:${APP_EMAIL_FROM_NAME:Hán Ngữ Học Đường}}")
    private String fromName = "Hán Ngữ Học Đường";

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:${SPRING_MAIL_USERNAME:}}")
    private String mailUsername;

    public EmailServiceImpl(ObjectMapper objectMapper) {
        this(objectMapper, null);
    }

    @Autowired
    public EmailServiceImpl(ObjectMapper objectMapper, @Autowired(required = false) JavaMailSender mailSender) {
        this.objectMapper = objectMapper;
        this.mailSender = mailSender;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Override
    public boolean sendPasswordResetCode(String toEmail, String resetCode) {
        if (toEmail == null || toEmail.trim().isEmpty() || resetCode == null || resetCode.trim().isEmpty()) {
            log.warn("Bỏ qua gửi email: địa chỉ nhận hoặc mã xác thực bị trống.");
            return false;
        }

        String recipient = toEmail.trim().toLowerCase(Locale.ROOT);
        log.info("Bắt đầu gửi email mã đặt lại mật khẩu tới: {}", maskEmail(recipient));

        // 1. Primary: Brevo API over HTTPS (port 443, 300 free emails/day to any recipient)
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            if (sendViaBrevo(recipient, resetCode.trim())) {
                return true;
            }
        } else {
            log.debug("BREVO_API_KEY chưa được cấu hình, bỏ qua cổng Brevo.");
        }

        // 2. Secondary: Resend API over HTTPS (port 443)
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            if (sendViaResend(recipient, resetCode.trim())) {
                return true;
            }
        }

        // 3. Local dev fallback: Standard SMTP via JavaMailSender
        if (mailSender != null && mailUsername != null && !mailUsername.trim().isEmpty()) {
            if (sendViaSmtp(recipient, resetCode.trim())) {
                return true;
            }
        }

        log.warn("Không thể gửi email xác thực tới {} vì không có cổng gửi mail nào thành công.", maskEmail(recipient));
        return false;
    }

    private boolean sendViaBrevo(String recipient, String resetCode) {
        try {
            Map<String, Object> payload = new HashMap<>();
            Map<String, String> sender = new HashMap<>();
            sender.put("name", (fromName != null && !fromName.isBlank()) ? fromName.trim() : "Hán Ngữ Học Đường");
            String senderEmail = (brevoSenderEmail != null && !brevoSenderEmail.isBlank())
                    ? brevoSenderEmail.trim()
                    : "keodeom1700a15@gmail.com";
            sender.put("email", senderEmail);
            payload.put("sender", sender);

            Map<String, String> toRecipient = new HashMap<>();
            toRecipient.put("email", recipient);
            payload.put("to", List.of(toRecipient));

            payload.put("subject", "Mã xác nhận đặt lại mật khẩu - Hán Ngữ Học Đường");
            payload.put("htmlContent", buildHtmlContent(recipient, resetCode));
            payload.put("textContent", buildTextContent(recipient, resetCode));

            String jsonBody = objectMapper.writeValueAsString(payload);
            String targetUrl = (brevoApiUrl != null && !brevoApiUrl.isBlank()) ? brevoApiUrl.trim() : DEFAULT_BREVO_API_URL;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("api-key", brevoApiKey.trim())
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .header("User-Agent", "ElearningBackend/1.0.0")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Gửi email thành công qua Brevo API tới {} (HTTP {}).", maskEmail(recipient), response.statusCode());
                return true;
            }
            log.warn("Brevo API trả về HTTP {} khi gửi tới {}: {}", response.statusCode(), maskEmail(recipient), response.body());
        } catch (Exception e) {
            log.error("Lỗi khi gửi email qua Brevo API tới {}: {}", maskEmail(recipient), e.getMessage());
        }
        return false;
    }

    private boolean sendViaResend(String recipient, String resetCode) {
        try {
            String effectiveFromName = (fromName != null && !fromName.isBlank()) ? fromName.trim() : "Hán Ngữ Học Đường";
            String effectiveFromEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "onboarding@resend.dev";

            Map<String, Object> payload = new HashMap<>();
            payload.put("from", effectiveFromName + " <" + effectiveFromEmail + ">");
            payload.put("to", List.of(recipient));
            payload.put("subject", "Mã xác nhận đặt lại mật khẩu - Hán Ngữ Học Đường");
            payload.put("html", buildHtmlContent(recipient, resetCode));
            payload.put("text", buildTextContent(recipient, resetCode));

            String jsonBody = objectMapper.writeValueAsString(payload);
            String targetUrl = (resendApiUrl != null && !resendApiUrl.isBlank()) ? resendApiUrl.trim() : DEFAULT_RESEND_API_URL;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "ElearningBackend/1.0.0")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Gửi email thành công qua Resend API tới {} (HTTP {}).", maskEmail(recipient), response.statusCode());
                return true;
            }
            log.warn("Resend API trả về HTTP {} khi gửi tới {}: {}", response.statusCode(), maskEmail(recipient), response.body());
        } catch (Exception e) {
            log.error("Lỗi khi gửi email qua Resend API tới {}: {}", maskEmail(recipient), e.getMessage());
        }
        return false;
    }

    private boolean sendViaSmtp(String recipient, String resetCode) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String senderAddress = (mailUsername != null && !mailUsername.isBlank()) ? mailUsername.trim() : fromEmail;
            String effectiveFromName = (fromName != null && !fromName.isBlank()) ? fromName.trim() : "Hán Ngữ Học Đường";
            helper.setFrom(new InternetAddress(senderAddress, effectiveFromName, "UTF-8"));
            helper.setTo(recipient);
            helper.setSubject("Mã xác nhận đặt lại mật khẩu - Hán Ngữ Học Đường");
            helper.setText(buildTextContent(recipient, resetCode), buildHtmlContent(recipient, resetCode));

            mailSender.send(mimeMessage);
            log.info("Gửi email thành công qua SMTP tới {}", maskEmail(recipient));
            return true;
        } catch (Exception e) {
            log.warn("Gửi email qua SMTP thất bại tới {}: {}", maskEmail(recipient), e.getMessage());
            return false;
        }
    }

    private String buildTextContent(String recipient, String resetCode) {
        return "Hán Ngữ Học Đường\n\n"
                + "Xin chào,\n"
                + "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản " + recipient + ".\n\n"
                + "Mã xác nhận của bạn là: " + resetCode + "\n"
                + "Mã có hiệu lực trong vòng 15 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.\n\n"
                + "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.";
    }

    private String buildHtmlContent(String recipient, String resetCode) {
        String safeRecipient = escapeHtml(recipient);
        String safeCode = escapeHtml(resetCode);
        return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;\">"
                + "<h2 style=\"color: #8B2635; margin-top: 0;\">Hán Ngữ Học Đường</h2>"
                + "<p>Xin chào,</p>"
                + "<p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>" + safeRecipient + "</strong> trên hệ thống học tiếng Trung Hán Ngữ Học Đường.</p>"
                + "<div style=\"background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;\">"
                + "<p style=\"margin: 0; font-size: 14px; color: #6c757d;\">Mã xác nhận của bạn là:</p>"
                + "<h1 style=\"letter-spacing: 6px; color: #8B2635; margin: 10px 0; font-size: 32px;\">" + safeCode + "</h1>"
                + "<p style=\"margin: 0; font-size: 13px; color: #dc3545;\">Mã có hiệu lực trong vòng 15 phút. Tuyệt đối không chia sẻ mã này cho người khác.</p>"
                + "</div>"
                + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn được bảo mật an toàn.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\">"
                + "<p style=\"font-size: 12px; color: #999; margin: 0;\">© 2026 Hán Ngữ Học Đường. Nền tảng học Hán tự và bộ thủ trực tuyến chuẩn mực.</p>"
                + "</div>";
    }

    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String maskEmail(String email) {
        int atIdx = email.indexOf('@');
        if (atIdx <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}
