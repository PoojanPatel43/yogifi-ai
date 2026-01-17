package com.yogifi.exception;

public class PoseNotFoundException extends RuntimeException {

    public PoseNotFoundException(String message) {
        super(message);
    }

    public PoseNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
