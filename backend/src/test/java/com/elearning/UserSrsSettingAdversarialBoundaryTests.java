package com.elearning;

import com.elearning.controller.UserSrsSettingController;
import com.elearning.dto.request.UpdateSrsSettingRequest;
import com.elearning.dto.response.UserSrsSettingResponse;
import com.elearning.exception.GlobalExceptionHandler;
import com.elearning.service.UserSrsSettingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Adversarial Tests: SRS Card Limit Boundaries (Requirement R4 / Feature F6)")
class UserSrsSettingAdversarialBoundaryTests {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserSrsSettingService userSrsSettingService;

    @InjectMocks
    private UserSrsSettingController userSrsSettingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userSrsSettingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, -50, 101, 102, 9999, 100000})
    @DisplayName("SRS-BOUND-01: Values outside [1, 100] (0, -1, 101, 9999, etc.) fail validation with HTTP 400")
    void testInvalidBoundariesRejected(int invalidNewCards) throws Exception {
        UpdateSrsSettingRequest request = new UpdateSrsSettingRequest(invalidNewCards, 100);

        mockMvc.perform(put("/api/v1/srs/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verify(userSrsSettingService, never()).updateCurrentUserSettings(any());
    }

    @Test
    @DisplayName("SRS-BOUND-02: Non-numeric payload ('abc', boolean, float string) fails with HTTP 400")
    void testNonNumericPayloadRejected() throws Exception {
        String nonNumericJson = "{\"newCardsPerDay\": \"abc\", \"maxReviewPerDay\": 100}";

        mockMvc.perform(put("/api/v1/srs/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nonNumericJson))
                .andExpect(status().isBadRequest());

        verify(userSrsSettingService, never()).updateCurrentUserSettings(any());
    }

    @Test
    @DisplayName("SRS-BOUND-03: Boundary value exactly 1 is ACCEPTED")
    void testBoundaryOneAccepted() throws Exception {
        UpdateSrsSettingRequest request = new UpdateSrsSettingRequest(1, 100);
        when(userSrsSettingService.updateCurrentUserSettings(any(UpdateSrsSettingRequest.class)))
                .thenReturn(new UserSrsSettingResponse(1L, 1, 100));

        mockMvc.perform(put("/api/v1/srs/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.newCardsPerDay").value(1));

        verify(userSrsSettingService).updateCurrentUserSettings(any());
    }

    @Test
    @DisplayName("SRS-BOUND-04: Boundary value exactly 100 is ACCEPTED")
    void testBoundaryHundredAccepted() throws Exception {
        UpdateSrsSettingRequest request = new UpdateSrsSettingRequest(100, 100);
        when(userSrsSettingService.updateCurrentUserSettings(any(UpdateSrsSettingRequest.class)))
                .thenReturn(new UserSrsSettingResponse(1L, 100, 100));

        mockMvc.perform(put("/api/v1/srs/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.newCardsPerDay").value(100));

        verify(userSrsSettingService).updateCurrentUserSettings(any());
    }
}
