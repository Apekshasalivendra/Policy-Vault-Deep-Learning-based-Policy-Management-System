import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for conditionally joining Tailwind classes without conflicts
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
