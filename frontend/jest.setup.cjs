require('@testing-library/jest-dom');

// Polyfill para react-router v7 (usa TextEncoder/TextDecoder do Node)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;