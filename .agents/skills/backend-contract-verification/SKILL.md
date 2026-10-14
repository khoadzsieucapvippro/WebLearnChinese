---
name: backend-contract-verification
description: Verify Spring Boot REST contracts against executable controllers, DTOs, security, tests, and frontend consumers.
---

# Backend Contract Verification

The Java source is authoritative. Before changing or documenting a client call, inspect the matching controller and request/response DTOs directly.

1. Find the controller under `backend/src/main/java/com/elearning/controller/`.
2. Record base path, HTTP method, path variables, query parameters, multipart parts, request body type, response DTO, and status code.
3. Inspect `ApiResponse`, `PageResponse`, `GlobalExceptionHandler`, validation annotations, and security annotations/filter behavior.
4. Search all frontend callers and tests for the endpoint.
5. For auth, verify `Authorization: Bearer`, JSON role spelling, issuer/expiry, and `auth_ver` authorization-version invalidation.
6. For Excel import, preserve the two distinct multipart preview and confirm operations; preview must not mutate the database.
7. Verify with focused controller/service/integration tests and frontend contract tests.

Never invent an endpoint from a stale `.agents` document, accept a client-supplied identity, expose an entity as a DTO, or alter an existing contract without tracing every consumer.
