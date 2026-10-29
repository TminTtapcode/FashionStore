package com.fashionstore.media.service;

import com.fashionstore.media.config.CloudinaryProperties;
import com.fashionstore.media.dto.SignUploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final CloudinaryProperties properties;
    private final HttpClient httpClient;

    public CloudinaryService(CloudinaryProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    public SignUploadResponse createUploadSignature(Long productId, String customFolder) {
        long timestamp = Instant.now().getEpochSecond();
        String folder = (customFolder != null && !customFolder.isBlank())
                ? customFolder.trim()
                : (productId != null
                ? properties.getDefaultFolder() + "/" + productId
                : properties.getDefaultFolder());

        if (!properties.isConfigured()) {
            log.info("Cloudinary is not configured with real credentials. Returning Mock/Dev signature for local environment.");
            return new SignUploadResponse(
                    "dev-local-cloud",
                    "dev-mock-api-key",
                    timestamp,
                    folder,
                    "dev-mock-signature-" + timestamp,
                    "/api/v1/owner/media/dev-mock-upload",
                    false
            );
        }

        // Real Cloudinary Signed Upload parameters
        Map<String, String> params = new TreeMap<>();
        params.put("folder", folder);
        params.put("timestamp", String.valueOf(timestamp));

        String toSign = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&")) + properties.getApiSecret();

        String signature = sha1Hex(toSign);
        String uploadUrl = "https://api.cloudinary.com/v1_1/" + properties.getCloudName() + "/image/upload";

        return new SignUploadResponse(
                properties.getCloudName(),
                properties.getApiKey(),
                timestamp,
                folder,
                signature,
                uploadUrl,
                true
        );
    }

    public boolean destroyImage(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return false;
        }

        if (!properties.isConfigured()) {
            log.info("Cloudinary mock destroy: simulated deletion for storageKey '{}'", storageKey);
            return true;
        }

        try {
            long timestamp = Instant.now().getEpochSecond();
            Map<String, String> params = new TreeMap<>();
            params.put("public_id", storageKey);
            params.put("timestamp", String.valueOf(timestamp));

            String toSign = params.entrySet().stream()
                    .map(e -> e.getKey() + "=" + e.getValue())
                    .collect(Collectors.joining("&")) + properties.getApiSecret();

            String signature = sha1Hex(toSign);

            String requestBody = "public_id=" + URLEncoder.encode(storageKey, StandardCharsets.UTF_8)
                    + "&timestamp=" + timestamp
                    + "&api_key=" + URLEncoder.encode(properties.getApiKey(), StandardCharsets.UTF_8)
                    + "&signature=" + signature;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + properties.getCloudName() + "/image/destroy"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully destroyed Cloudinary asset '{}'. Response: {}", storageKey, response.body());
                return true;
            } else {
                log.warn("Failed to destroy Cloudinary asset '{}'. Status: {}, Body: {}", storageKey, response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Exception occurred while calling Cloudinary destroy API for '{}': {}", storageKey, e.getMessage());
            return false;
        }
    }

    public static String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : digest) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 algorithm not available", e);
        }
    }
}
