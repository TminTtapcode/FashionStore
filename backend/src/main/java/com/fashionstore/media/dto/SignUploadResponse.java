package com.fashionstore.media.dto;

public record SignUploadResponse(
        String cloudName,
        String apiKey,
        long timestamp,
        String folder,
        String signature,
        String uploadUrl,
        boolean configured
) {
}
