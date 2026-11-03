package com.sindipro.api.shared.exception;

import java.time.Instant;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
}