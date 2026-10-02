package com.elearning;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.testcontainers.containers.MySQLContainer;

import java.util.Map;

/**
 * Global Testcontainers ApplicationContextInitializer.
 * <p>
 * Starts a singleton MySQL 8.4 container once for all Spring Boot integration tests
 * and dynamically injects connection parameters into the Spring Environment.
 */
public class TestcontainersInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    public static final MySQLContainer<?> MYSQL_CONTAINER;
    public static final boolean DOCKER_AVAILABLE;

    static {
        MySQLContainer<?> container = null;
        boolean dockerOk = false;
        try {
            // Ensure Docker API version compatibility with modern Docker Engine (26+, 28+, 29+) on Windows
            if (System.getProperty("api.version") == null) {
                System.setProperty("api.version", "1.44");
            }
            if (System.getProperty("DOCKER_API_VERSION") == null) {
                System.setProperty("DOCKER_API_VERSION", "1.44");
            }

            container = new MySQLContainer<>("mysql:8.4.0")
                    .withDatabaseName("elearning_test")
                    .withUsername("test")
                    .withPassword("test")
                    .withCommand("--lower-case-table-names=1")
                    .withReuse(true);

            container.start();
            dockerOk = true;
        } catch (Throwable t) {
            dockerOk = false;
            container = null;
        }
        MYSQL_CONTAINER = container;
        DOCKER_AVAILABLE = dockerOk;
    }

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        if (DOCKER_AVAILABLE && MYSQL_CONTAINER != null && MYSQL_CONTAINER.isRunning()) {
            Map<String, Object> properties = Map.of(
                    "spring.datasource.url", MYSQL_CONTAINER.getJdbcUrl(),
                    "spring.datasource.username", MYSQL_CONTAINER.getUsername(),
                    "spring.datasource.password", MYSQL_CONTAINER.getPassword(),
                    "spring.datasource.driver-class-name", MYSQL_CONTAINER.getDriverClassName()
            );
            applicationContext.getEnvironment().getPropertySources()
                    .addFirst(new MapPropertySource("testcontainers-properties", properties));
        } else {
            // Graceful fallback to local running MySQL Community Server (port 3306)
            String fallbackUrl = System.getenv("SPRING_DATASOURCE_URL");
            if (fallbackUrl == null || fallbackUrl.isBlank()) {
                fallbackUrl = "jdbc:mysql://localhost:3306/elearning_test?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            }
            String fallbackUser = System.getenv("SPRING_DATASOURCE_USERNAME");
            if (fallbackUser == null || fallbackUser.isBlank()) {
                fallbackUser = "root";
            }
            String fallbackPass = System.getenv("SPRING_DATASOURCE_PASSWORD");
            if (fallbackPass == null) {
                fallbackPass = "";
            }
            Map<String, Object> properties = Map.of(
                    "spring.datasource.url", fallbackUrl,
                    "spring.datasource.username", fallbackUser,
                    "spring.datasource.password", fallbackPass,
                    "spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver"
            );
            applicationContext.getEnvironment().getPropertySources()
                    .addFirst(new MapPropertySource("local-mysql-fallback-properties", properties));
        }
    }

    public static MySQLContainer<?> getContainer() {
        return MYSQL_CONTAINER;
    }
}
