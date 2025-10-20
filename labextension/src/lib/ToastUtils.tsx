/*
 * Copyright 2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { showDialog, Dialog } from '@jupyterlab/apputils';

/**
 * Simple toast notification utility for showing non-blocking error messages
 */
export class ToastUtils {
  /**
   * Show a toast notification for unexpected errors
   * @param title The title of the error
   * @param message The error message
   */
  public static async showErrorToast(title: string, message: string): Promise<void> {
    // Create a simple non-blocking dialog that auto-closes
    const buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: 'Dismiss' })
    ];
    
    const body = (
      <div className="toast-error">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
    );

    // Set up observer to position the dialog when it appears
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const dialogContent = element.querySelector('.jp-Dialog-content');
            if (dialogContent && dialogContent.querySelector('.toast-error')) {
              dialogContent.classList.add('toast-positioned');
              observer.disconnect();
            }
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });

    // Show as a non-blocking dialog
    await showDialog({ 
      title, 
      buttons, 
      body,
      hasClose: true,
      defaultButton: 0
    });

    // Clean up observer after a short delay
    setTimeout(() => observer.disconnect(), 1000);
  }
}
