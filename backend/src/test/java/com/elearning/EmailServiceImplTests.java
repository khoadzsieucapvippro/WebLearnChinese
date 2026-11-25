package com.elearning;

import com.elearning.service.impl.EmailServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("EmailServiceImpl Brevo Delivery Tests")
class EmailServiceImplTests {

    private HttpServer mockServer;

    @AfterEach
    void tearDown() {
        if (mockServer != null) {
            mockServer.stop(0);
        }
    }

    @Test
    @DisplayName("GIVEN configured Brevo API key WHEN sendPasswordResetCode THEN posts valid JSON with api-key and returns true")
    void testSendViaBrevoSuccess() throws IOException {
        AtomicReference<String> capturedApiKey = new AtomicReference<>();
        AtomicReference<String> capturedBody = new AtomicReference<>();

        mockServer = HttpServer.create(new InetSocketAddress(0), 0);
        mockServer.createContext("/v3/smtp/email", exchange -> {
            capturedApiKey.set(exchange.getRequestHeaders().getFirst("api-key"));
            capturedBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] resp = "{\"messageId\":\"<test-id@brevo>\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(201, resp.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(resp);
            }
        });
        mockServer.start();

        int port = mockServer.getAddress().getPort();
        EmailServiceImpl emailService = new EmailServiceImpl(new ObjectMapper());
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "xkeysib-test-key");
        ReflectionTestUtils.setField(emailService, "brevoApiUrl", "http://127.0.0.1:" + port + "/v3/smtp/email");
        ReflectionTestUtils.setField(emailService, "brevoSenderEmail", "sender@example.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Hán Ngữ Học Đường");

        boolean result = emailService.sendPasswordResetCode("User@Gmail.com", "482915");

        assertThat(result).isTrue();
        assertThat(capturedApiKey.get()).isEqualTo("xkeysib-test-key");
        assertThat(capturedBody.get())
                .contains("\"email\":\"sender@example.com\"")
                .contains("\"email\":\"user@gmail.com\"")
                .contains("482915")
                .contains("textContent")
                .contains("htmlContent");
    }

    @Test
    @DisplayName("GIVEN Brevo returns HTTP 401 WHEN sendPasswordResetCode THEN returns false without falling back to FormSubmit")
    void testSendViaBrevoFailureReturnsFalse() throws IOException {
        mockServer = HttpServer.create(new InetSocketAddress(0), 0);
        mockServer.createContext("/v3/smtp/email", exchange -> {
            byte[] resp = "{\"message\":\"Key not found\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(401, resp.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(resp);
            }
        });
        mockServer.start();

        int port = mockServer.getAddress().getPort();
        EmailServiceImpl emailService = new EmailServiceImpl(new ObjectMapper());
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "invalid-key");
        ReflectionTestUtils.setField(emailService, "brevoApiUrl", "http://127.0.0.1:" + port + "/v3/smtp/email");

        boolean result = emailService.sendPasswordResetCode("user@gmail.com", "482915");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("GIVEN blank email or missing providers WHEN sendPasswordResetCode THEN returns false")
    void testSendWithMissingConfigOrBlankEmail() {
        EmailServiceImpl emailService = new EmailServiceImpl(new ObjectMapper());
        assertThat(emailService.sendPasswordResetCode("", "482915")).isFalse();
        assertThat(emailService.sendPasswordResetCode("user@gmail.com", "")).isFalse();
        assertThat(emailService.sendPasswordResetCode("user@gmail.com", "482915")).isFalse();
    }
}
