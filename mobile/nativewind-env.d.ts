/// <reference types="nativewind/types" />

// TypeScript 6 rejects side-effect imports it has no declaration for, and the
// global stylesheet (`import '../global.css'`) is exactly that — Metro handles
// the file, TypeScript only needs to know the module exists.
declare module '*.css';
