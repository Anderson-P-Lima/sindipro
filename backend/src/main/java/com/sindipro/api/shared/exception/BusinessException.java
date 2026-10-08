package com.sindipro.api.shared.exception;

import java.time.Instant;

public class BusinessException extends RuntimeException {
    public BusinessException(String msg) { super(msg); }
}