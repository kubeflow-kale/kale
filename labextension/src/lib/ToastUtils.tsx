/**
 * Utility functions for displaying toast notifications.
 */
export class ToastUtils {
  /**
   * Displays an error toast notification.
   * @param title The title of the toast.
   * @param message The main message content of the toast.
   * @param loc The location of the actual error, likely not kale.
   * @returns A Promise that resolves when the toast display process is initiated.
   */
  public static async showErrorToast(title: string, message: string, loc: string): Promise<void> {
    // Create the main toast element
    const toast = document.createElement('div');
    toast.className = 'toast-error';

    // Create and append the title
    const titleElement = document.createElement('div');
    titleElement.className = 'toast-title';
    titleElement.textContent = title;
    toast.appendChild(titleElement);

    // Create and append the error message
    const messageElement = document.createElement('div');
    messageElement.className = 'toast-message';
    messageElement.textContent = message;
    toast.appendChild(messageElement);

    // Create and append the error location
    const locElement = document.createElement('div');
    locElement.className = 'toast-loc';
    locElement.textContent = loc;
    toast.appendChild(locElement);

    // Append the toast to the body to make it visible
    document.body.appendChild(toast);

    // Set a timeout to automatically hide and remove the toast
    // You can adjust the duration (e.g., 5000ms = 5 seconds)
    return new Promise(resolve => {
      setTimeout(() => {
        // Optional: Add a fading animation before removal for a smoother effect
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';

        // Wait for the fade out to complete, then remove
        setTimeout(() => {
          document.body.removeChild(toast);
          resolve();
        }, 500); // Wait for the transition duration
      }, 7000); // Total display time
    });
  }
}