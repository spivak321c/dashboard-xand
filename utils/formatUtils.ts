/**
 * Utility functions for formatting data in the frontend
 */

/**
 * Formats a number of bytes into a human-readable string (B, KB, MB, GB, TB, PB)
 * @param bytes The number of bytes to format
 * @param decimals Number of decimal places to show
 * @returns A formatted string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats a number with suffixes (K, M, B, T)
 * @param num The number to format
 * @param decimals Number of decimal places to show
 * @returns A formatted string
 */
export function formatNumber(num: number, decimals: number = 1): string {
    if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toString();
}

/**
 * Formats seconds into a human-readable duration (e.g., "5d 2h", "3h 15m")
 * @param seconds The number of seconds
 * @returns A formatted string
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '0m';

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
