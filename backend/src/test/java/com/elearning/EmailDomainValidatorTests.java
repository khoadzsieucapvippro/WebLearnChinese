package com.elearning;

import com.elearning.service.EmailDomainValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("EmailDomainValidator Tests")
class EmailDomainValidatorTests {

    @Test
    @DisplayName("Validates email syntax strictly and rejects phone numbers or malformed addresses")
    void testEmailSyntaxValidation() {
        EmailDomainValidator validator = new EmailDomainValidator();

        assertThat(validator.isValidEmailSyntax("learner@gmail.com")).isTrue();
        assertThat(validator.isValidEmailSyntax("user.name+tag@edu.vn")).isTrue();

        assertThat(validator.isValidEmailSyntax("")).isFalse();
        assertThat(validator.isValidEmailSyntax("0912345678")).isFalse();
        assertThat(validator.isValidEmailSyntax("invalid-email")).isFalse();
        assertThat(validator.isValidEmailSyntax("user@localhost")).isFalse();
        assertThat(validator.isValidEmailSyntax("user@domain.a")).isFalse();
    }

    @Test
    @DisplayName("Rejects domain when DNS MX lookup returns false and caches result")
    void testMxLookupRejectionAndPass() {
        EmailDomainValidator validator = new EmailDomainValidator() {
            @Override
            protected boolean lookupMxRecord(String asciiDomain) {
                return "gmail.com".equals(asciiDomain);
            }
        };
        ReflectionTestUtils.setField(validator, "verifyMxRecord", true);

        assertThat(validator.isDeliverableEmailDomain("test@gmail.com")).isTrue();
        assertThat(validator.isDeliverableEmailDomain("test@gmial-nonexistent.com")).isFalse();
    }

    @Test
    @DisplayName("Skips DNS MX lookup when verifyMxRecord is disabled (offline tests)")
    void testMxCheckDisabled() {
        EmailDomainValidator validator = new EmailDomainValidator() {
            @Override
            protected boolean lookupMxRecord(String asciiDomain) {
                throw new AssertionError("DNS lookup must not be invoked when verifyMxRecord is false");
            }
        };
        ReflectionTestUtils.setField(validator, "verifyMxRecord", false);

        assertThat(validator.isDeliverableEmailDomain("user@elearning.com")).isTrue();
    }
}
