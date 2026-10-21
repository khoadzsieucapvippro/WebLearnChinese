package com.elearning;

import com.elearning.config.GeminiConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.service.impl.GeminiPronunciationServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Assumptions;

public class GeminiLiveIntegrationTests {

    private byte[] createSampleWav() {
        int sampleRate = 8000;
        int numSamples = sampleRate; // 1 second
        ByteBuffer buffer = ByteBuffer.allocate(44 + numSamples * 2);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        buffer.put("RIFF".getBytes());
        buffer.putInt(36 + numSamples * 2);
        buffer.put("WAVE".getBytes());
        buffer.put("fmt ".getBytes());
        buffer.putInt(16); // Subchunk1Size
        buffer.putShort((short) 1); // PCM
        buffer.putShort((short) 1); // Mono
        buffer.putInt(sampleRate);
        buffer.putInt(sampleRate * 2); // ByteRate
        buffer.putShort((short) 2); // BlockAlign
        buffer.putShort((short) 16); // BitsPerSample
        buffer.put("data".getBytes());
        buffer.putInt(numSamples * 2);

        // 440Hz tone
        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            short sample = (short) Math.round(Math.sin(2 * Math.PI * 440 * t) * 10000);
            buffer.putShort(sample);
        }
        return buffer.array();
    }

    private String resolveApiKey() {
        try {
            Path p = Paths.get("src/main/resources/application-local.yml");
            if (Files.exists(p)) {
                List<String> lines = Files.readAllLines(p);
                for (String line : lines) {
                    if (line.contains("api-key:")) {
                        return line.split("api-key:")[1].trim().replace("\"", "").replace("'", "");
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    @Test
    @DisplayName("Direct call to Google GenAI Client with audio")
    void testDirectClientCall() {
        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) {
            Assumptions.abort("Gemini API key not configured");
        }
        System.out.println("API Key resolved, starting Client.builder()...");
        long t0 = System.currentTimeMillis();

        Client client = Client.builder()
                .apiKey(apiKey)
                .build();

        byte[] audioBytes = createSampleWav();
        Part mediaPart = Part.fromBytes(audioBytes, "audio/wav");
        Part textPart = Part.fromText("Chữ Hán: 学. Thẩm định phát âm ngắn gọn dạng JSON.");
        Content content = Content.fromParts(mediaPart, textPart);

        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .temperature(0.2f)
                .build();

        System.out.println("Calling generateContent directly on gemini-3.5-flash...");
        try {
            GenerateContentResponse response = client.models.generateContent(
                    "gemini-3.5-flash",
                    content,
                    config
            );
            long elapsed = System.currentTimeMillis() - t0;
            System.out.println("Success in " + elapsed + "ms!");
            System.out.println("Response text: " + response.text());
            assertNotNull(response.text());
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            System.out.println("Failed after " + elapsed + "ms with error: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            if (e.getMessage() != null && (e.getMessage().contains("429") || e.getMessage().contains("RESOURCE_EXHAUSTED") || e.getMessage().contains("Quota exceeded"))) {
                Assumptions.abort("Gemini API quota exhausted: " + e.getMessage());
            }
            throw e;
        }
    }

    @Test
    @DisplayName("GeminiPronunciationServiceImpl live end-to-end evaluation")
    void testServiceLiveAssessment() {
        String apiKey = resolveApiKey();
        if (apiKey.isEmpty()) return;

        GeminiConfig config = new GeminiConfig();
        ReflectionTestUtils.setField(config, "apiKey", apiKey);
        ReflectionTestUtils.setField(config, "model", "gemini-3.5-flash");
        ReflectionTestUtils.setField(config, "timeoutSeconds", 35);
        ReflectionTestUtils.setField(config, "maxAudioBytes", 5242880L);

        GeminiPronunciationServiceImpl service = new GeminiPronunciationServiceImpl(config, new ObjectMapper());

        byte[] audioBytes = createSampleWav();
        PronunciationAssessmentResponse response = service.assessPronunciation(
                audioBytes,
                "audio/wav",
                "学",
                "xué",
                "Học"
        );

        assertNotNull(response);
        System.out.println("Service response status: " + response.getStatus());
        System.out.println("Service response summary: " + response.getSummaryVi());
        System.out.println("Service response score: " + response.getOverallScore());
        assertNotNull(response.getStatus());
    }
}
