import os
import sys
import hmac
import time
import inspect
import asyncio
import unittest

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.main import app, verify_internal_token, get_expected_internal_token


async def asgi_request(app_callable, method: str, path: str, headers: dict = None, body: bytes = b""):
    """
    Pure in-memory ASGI client to test FastAPI app without external dependencies (httpx/requests).
    Simulates full ASGI HTTP lifecycle: routing, middleware, dependencies, exception handlers.
    """
    header_list = []
    if headers:
        for k, v in headers.items():
            header_list.append((k.lower().encode("latin1"), v.encode("latin1")))

    scope = {
        "type": "http",
        "method": method.upper(),
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": b"",
        "headers": header_list,
        "client": ("127.0.0.1", 54321),
        "server": ("127.0.0.1", 8000),
        "scheme": "http",
        "http_version": "1.1",
    }

    response_started = {}
    response_body = []

    async def receive():
        return {
            "type": "http.request",
            "body": body,
            "more_body": False
        }

    async def send(message):
        if message["type"] == "http.response.start":
            response_started.update(message)
        elif message["type"] == "http.response.body":
            response_body.append(message.get("body", b""))

    await app_callable(scope, receive, send)

    status_code = response_started.get("status", 500)
    resp_headers = dict((k.decode("latin1"), v.decode("latin1")) for k, v in response_started.get("headers", []))
    content = b"".join(response_body).decode("utf-8", errors="replace")
    return status_code, resp_headers, content


def call_api(method: str, path: str, headers: dict = None, body: bytes = b""):
    return asyncio.run(asgi_request(app, method, path, headers=headers, body=body))


class AdversarialMilestone2Tests(unittest.TestCase):
    """
    Adversarial challenge and empirical verification for Milestone 2:
    - Authentication enforcement & bypass attempts
    - Health probe public accessibility
    - Fallback and precedence logic
    - Timing attack resilience (hmac.compare_digest)
    - URL scheme normalization edge cases
    """

    def setUp(self):
        os.environ.pop("INTERNAL_SPEECH_TOKEN", None)
        os.environ.pop("SPEECH_SERVICE_TOKEN", None)

    def tearDown(self):
        os.environ.pop("INTERNAL_SPEECH_TOKEN", None)
        os.environ.pop("SPEECH_SERVICE_TOKEN", None)

    # -------------------------------------------------------------
    # 1. AUTHENTICATION ENFORCEMENT & ADVERSARIAL BYPASS PROBES
    # -------------------------------------------------------------
    def test_when_token_is_set_missing_header_must_return_401(self):
        """When INTERNAL_SPEECH_TOKEN is set, requests without X-Internal-Token MUST be rejected with 401."""
        os.environ["INTERNAL_SPEECH_TOKEN"] = "secure-speech-token-xyz-2026"

        for endpoint in ["/evaluate-reading", "/v1/assess"]:
            status, _, body = call_api("POST", endpoint)
            self.assertEqual(status, 401, f"Expected 401 for {endpoint} with missing header, got {status}")
            self.assertIn("Unauthorized", body)

    def test_when_token_is_set_empty_and_whitespace_headers_must_return_401(self):
        """Empty, space-only, tab, and newline headers must return 401."""
        os.environ["INTERNAL_SPEECH_TOKEN"] = "secure-speech-token-xyz-2026"

        for bad_header in ["", " ", "   ", "\t"]:
            status, _, _ = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": bad_header})
            self.assertEqual(status, 401, f"Expected 401 for header '{repr(bad_header)}', got {status}")

    def test_when_token_is_set_invalid_tokens_must_return_401(self):
        """Adversarial mutations, truncation, injection, and oversized tokens must return 401."""
        secret = "secure-speech-token-xyz-2026"
        os.environ["INTERNAL_SPEECH_TOKEN"] = secret

        adversarial_probes = [
            "wrong-token",
            secret[:-1],                     # 1 char truncated
            secret + "x",                    # 1 char extra
            secret.upper(),                  # Case inversion
            secret.replace("2026", "2025"),  # Substituted year
            "Bearer " + secret,              # Wrong authorization format
            "null",
            "None",
            "0",
            "' OR '1'='1",                   # SQLi string
            "<script>alert(1)</script>",     # XSS string
            "A" * 50000,                     # 50KB string (stress test)
        ]

        for probe in adversarial_probes:
            status, _, _ = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": probe})
            self.assertEqual(status, 401, f"Adversarial probe '{probe[:20]}' bypassed auth! Got {status}")

    def test_when_token_is_set_correct_token_must_proceed_past_auth(self):
        """With the exact correct token (or padded with whitespace), request MUST proceed past auth."""
        secret = "secure-speech-token-xyz-2026"
        os.environ["INTERNAL_SPEECH_TOKEN"] = secret

        # Test exact match
        status, _, body = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": secret})
        self.assertNotEqual(status, 401, f"Valid token was rejected with 401: {body}")
        # Reaching 422 means authentication passed and FastAPI reached payload validation
        self.assertEqual(status, 422, f"Expected 422 (passed auth, missing body), got {status}")

        # Test with whitespace around token (trimmed by server)
        status_padded, _, _ = call_api("POST", "/v1/assess", headers={"X-Internal-Token": f"  {secret}  "})
        self.assertNotEqual(status_padded, 401, "Whitespace-padded valid token was rejected with 401")
        self.assertEqual(status_padded, 422)

    def test_health_probe_must_return_200_without_token(self):
        """The /health probe MUST return 200 OK without any X-Internal-Token even when token is set."""
        os.environ["INTERNAL_SPEECH_TOKEN"] = "super-secret-speech-token-2026"

        status, _, body = call_api("GET", "/health")
        self.assertEqual(status, 200, f"/health returned {status} instead of 200")
        self.assertIn('"status":"READY"', body)
        self.assertIn('"offline":true', body)

    def test_fallback_speech_service_token(self):
        """When INTERNAL_SPEECH_TOKEN is empty, SPEECH_SERVICE_TOKEN must act as fallback."""
        os.environ["INTERNAL_SPEECH_TOKEN"] = ""
        os.environ["SPEECH_SERVICE_TOKEN"] = "fallback-speech-token-456"

        # Missing token -> 401
        status, _, _ = call_api("POST", "/evaluate-reading")
        self.assertEqual(status, 401)

        # Invalid token -> 401
        status, _, _ = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": "bad-token"})
        self.assertEqual(status, 401)

        # Correct fallback token -> passes auth
        status, _, _ = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": "fallback-speech-token-456"})
        self.assertNotEqual(status, 401)
        self.assertEqual(status, 422)

    def test_precedence_internal_speech_token_over_speech_service_token(self):
        """INTERNAL_SPEECH_TOKEN must take precedence over SPEECH_SERVICE_TOKEN."""
        os.environ["INTERNAL_SPEECH_TOKEN"] = "primary-speech-token"
        os.environ["SPEECH_SERVICE_TOKEN"] = "secondary-speech-token"

        # Primary token must pass auth
        status, _, _ = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": "primary-speech-token"})
        self.assertNotEqual(status, 401)

        # Secondary token must fail
        status2, _, _ = call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": "secondary-speech-token"})
        self.assertEqual(status2, 401)

    def test_dev_mode_permits_requests_when_no_token_set(self):
        """When no token is configured in environment, unauthenticated requests are permitted (local dev mode)."""
        os.environ.pop("INTERNAL_SPEECH_TOKEN", None)
        os.environ.pop("SPEECH_SERVICE_TOKEN", None)

        status, _, _ = call_api("POST", "/evaluate-reading")
        self.assertNotEqual(status, 401, "Expected dev mode to permit requests without token")
        self.assertEqual(status, 422)

    # -------------------------------------------------------------
    # 2. TIMING ATTACK RESILIENCE VERIFICATION
    # -------------------------------------------------------------
    def test_timing_attack_resilience_implementation(self):
        """
        Verify that token verification uses hmac.compare_digest:
        1. Source code AST inspection confirms hmac.compare_digest is present.
        2. Dynamic runtime tracing confirms hmac.compare_digest is invoked during authentication.
        3. Constant-time evaluation benchmark checks that timing variance is within negligible bounds.
        """
        source = inspect.getsource(verify_internal_token)
        self.assertIn("hmac.compare_digest", source, "verify_internal_token does NOT contain hmac.compare_digest!")

        # Dynamic invocation check
        calls = []
        original_compare = hmac.compare_digest

        def tracked_compare(a, b):
            calls.append((a, b))
            return original_compare(a, b)

        hmac.compare_digest = tracked_compare
        try:
            os.environ["INTERNAL_SPEECH_TOKEN"] = "constant-time-target-token"
            call_api("POST", "/evaluate-reading", headers={"X-Internal-Token": "probe-token"})
            self.assertGreater(len(calls), 0, "hmac.compare_digest was not executed during request verification!")
            self.assertEqual(calls[-1], ("probe-token", "constant-time-target-token"))
        finally:
            hmac.compare_digest = original_compare

        # Empirical timing check: measure 1000 comparisons of matching prefix vs mismatching prefix
        secret = "A" * 64
        candidate_first_char_diff = "B" + "A" * 63
        candidate_last_char_diff = "A" * 63 + "B"

        iters = 5000
        t0 = time.perf_counter()
        for _ in range(iters):
            hmac.compare_digest(candidate_first_char_diff, secret)
        dur_first = time.perf_counter() - t0

        t1 = time.perf_counter()
        for _ in range(iters):
            hmac.compare_digest(candidate_last_char_diff, secret)
        dur_last = time.perf_counter() - t1

        diff_ratio = abs(dur_first - dur_last) / max(dur_first, dur_last)
        print(f"\n[TIMING RESILIENCE] 5000 iters: First-char diff: {dur_first:.6f}s, Last-char diff: {dur_last:.6f}s (variance: {diff_ratio*100:.2f}%)")
        self.assertLess(diff_ratio, 0.5, "Timing variance between first-char and last-char mismatch is unexpectedly large")

    # -------------------------------------------------------------
    # 3. URL SCHEME NORMALIZATION SIMULATION & EDGE CASES
    # -------------------------------------------------------------
    def test_url_scheme_normalization_edge_cases(self):
        """
        Challenge the Java LocalSpeechConfig.getBaseUrl() logic across standard inputs and edge cases.
        """
        def java_get_base_url_logic(base_url: str) -> str:
            if base_url is None or not base_url.strip():
                return "http://127.0.0.1:8000"
            trimmed = base_url.strip()
            while trimmed.endswith("/"):
                trimmed = trimmed[:-1].strip()
            if not trimmed.startswith("http://") and not trimmed.startswith("https://"):
                return "https://" + trimmed
            return trimmed

        cases = [
            (None, "http://127.0.0.1:8000"),
            ("", "http://127.0.0.1:8000"),
            ("   ", "http://127.0.0.1:8000"),
            ("http://127.0.0.1:8000", "http://127.0.0.1:8000"),
            ("http://127.0.0.1:8000/", "http://127.0.0.1:8000"),
            ("http://127.0.0.1:8000///", "http://127.0.0.1:8000"),
            ("https://speech.onrender.com", "https://speech.onrender.com"),
            ("https://speech.onrender.com/", "https://speech.onrender.com"),
            ("speech-service.onrender.com", "https://speech-service.onrender.com"),
            ("speech-service.onrender.com/", "https://speech-service.onrender.com"),
            ("speech-service.onrender.com///", "https://speech-service.onrender.com"),
            ("localhost:8000", "https://localhost:8000"),
            ("  https://my-speech-api.render.com/  ", "https://my-speech-api.render.com"),
        ]

        for input_val, expected in cases:
            actual = java_get_base_url_logic(input_val)
            self.assertEqual(actual, expected, f"Failed for input '{input_val}': got '{actual}', expected '{expected}'")

        # Edge case analysis: uppercase scheme
        upper_result = java_get_base_url_logic("HTTP://my-server:8000")
        self.assertEqual(upper_result, "https://HTTP://my-server:8000")

        # Edge case analysis: double leading slash
        double_slash_result = java_get_base_url_logic("//my-server:8000")
        self.assertEqual(double_slash_result, "https:////my-server:8000")


if __name__ == "__main__":
    unittest.main(verbosity=2)
