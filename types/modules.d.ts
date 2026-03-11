/**
 * Fallback type declarations when the IDE cannot resolve node_modules
 * (e.g. when opening a WSL project from Windows). Build and runtime use real package types.
 */
declare module "next/link";
declare module "next/navigation";
declare module "next-auth/react";
declare module "lucide-react";

/** Minimal JSX namespace when @types/react is not resolved by the IDE */
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}
