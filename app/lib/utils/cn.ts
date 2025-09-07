/**
 * Utility function to merge classes conditionally
 * Similar to clsx but simplified for our needs
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
}