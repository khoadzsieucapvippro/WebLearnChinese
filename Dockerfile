# Stage 1: Builder
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy Maven dependency definition and pre-fetch dependencies for layer caching
COPY backend/pom.xml ./backend/pom.xml
RUN mvn -f ./backend/pom.xml dependency:go-offline -B

# Copy backend source code and compile application package
COPY backend/src ./backend/src
RUN rm -f ./backend/src/main/resources/application-local.yml ./backend/src/main/resources/*-local.yml
RUN mvn -f ./backend/pom.xml clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cloud runtime environment variables
ENV PORT=8080 \
    APP_DEMO_SEED_ACCOUNTS=true \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Copy built artifact from builder stage
COPY --from=builder /build/backend/target/*.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
