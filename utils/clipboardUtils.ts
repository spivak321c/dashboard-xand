/**
 * Copies text to the clipboard with a fallback for non-secure contexts.
 * @param text The text to copy
 * @returns A promise that resolves to true if the copy was successful, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Clipboard API copy failed:', err);
        }
    }

    // Fallback for non-secure contexts or failed API calls
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure the textarea is not visible or disruptive
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Fallback copy failed:', err);
        return false;
    }
}
