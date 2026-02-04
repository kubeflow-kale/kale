// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { JSONObject, PartialJSONValue } from '@lumino/coreutils';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { NotebookPanel } from '@jupyterlab/notebook';
import {
  KernelMessage,
  Kernel,
  KernelManager,
  KernelSpecAPI,
} from '@jupyterlab/services';
import { CommandRegistry } from '@lumino/commands';
// @ts-expect-error This module is not typed
import SanitizedHTML from 'react-sanitized-html';
import * as React from 'react';
import { ReactElement } from 'react';
import {
  Cell,
  CodeCell,
  CodeCellModel,
  isCodeCellModel,
} from '@jupyterlab/cells';
import { RESERVED_CELL_NAMES } from '../widgets/cell-metadata/CellMetadataEditor';
import CellUtilities from './CellUtils';

interface IRunCellResponse {
  status: string;
  cellType?: string;
  cellIndex?: number;
  ename?: string;
  evalue?: string;
}

/** Contains utility functions for manipulating/handling notebooks in the application. */
export default class NotebookUtilities {
  /**
   * Clear the outputs of all the notebook' cells
   * @param notebook NotebookPanel
   */
  public static clearCellOutputs(notebook: NotebookPanel): void {
    if (!notebook.model) {
      throw new Error('Notebook model is null');
    }

    for (let i = 0; i < notebook.model.cells.length; i++) {
      const cell = notebook.model.cells.get(i);
      if (!isCodeCellModel(cell)) {
        continue;
      }
      (cell as CodeCellModel).executionCount = null;
      (cell as CodeCellModel).outputs.clear();
    }
  }

  /**
   * Scroll the notebook to the specified cell, making it active
   * @param notebook NotebookPanel
   * @param cell The cell to be activated
   */
  public static selectAndScrollToCell(
    notebook: NotebookPanel,
    cell: { cell: Cell; index: number },
  ): void {
    notebook.content.select(cell.cell);
    notebook.content.activeCellIndex = cell.index;

    notebook.content.scrollToCell(cell.cell);

  }

  /**
   * Builds an HTML container by sanitizing a list of strings and converting
   * them in valid HTML
   * @param msg A list of string with HTML formatting
   * @returns a HTMLDivElement composed of a list of spans with formatted text
   */
  private static buildDialogBody(msg: string[]): ReactElement {
    return (
      <div className="dialog-body">
        {msg.map((s: string, i: number) => {
          return (
            <React.Fragment key={`msg-${i}`}>
              <SanitizedHTML
                allowedAttributes={{ a: ['href'] }}
                allowedTags={['b', 'i', 'em', 'strong', 'a', 'pre']}
                html={s}
              />
              <br />
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  /**
   * Opens a pop-up dialog in JupyterLab to display a simple message.
   * @param title The title for the message popup
   * @param msg The message as an array of strings
   * @param buttonLabel The label to use for the button. Default is 'OK'
   * @param buttonClassName The classname to give to the 'ok' button
   * @returns Promise<void> - A promise once the message is closed.
   */
  public static async showMessage(
    title: string,
    msg: string[],
    buttonLabel: string = 'Close',
    buttonClassName: string = '',
  ): Promise<void> {
    const buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: buttonLabel, className: buttonClassName }),
    ];
    const messageBody = this.buildDialogBody(msg);
    await showDialog({ title, buttons, body: messageBody });
  }

  /**
   * Opens a pop-up dialog in JupyterLab to display a yes/no dialog.
   * @param title The title for the message popup
   * @param msg The message
   * @param acceptLabel The label to use for the accept button. Default is 'YES'
   * @param rejectLabel The label to use for the reject button. Default is 'NO'
   * @param yesButtonClassName The classname to give to the accept button.
   * @param noButtonClassName The  classname to give to the cancel button.
   * @returns Promise<void> - A promise once the message is closed.
   */
  public static async showYesNoDialog(
    title: string,
    msg: string[],
    acceptLabel: string = 'YES',
    rejectLabel: string = 'NO',
    yesButtonClassName: string = '',
    noButtonClassName: string = '',
  ): Promise<boolean> {
    const buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: acceptLabel, className: yesButtonClassName }),
      Dialog.cancelButton({ label: rejectLabel, className: noButtonClassName }),
    ];
    const messageBody = this.buildDialogBody(msg);
    const result = await showDialog({ title, buttons, body: messageBody });
    return result.button.label === acceptLabel;
  }

  /**
   * Opens a pop-up dialog in JupyterLab with various information and button
   * triggering reloading the page.
   * @param title The title for the message popup
   * @param msg The message
   * @param refreshButtonLabel The label to use for the refresh button. Default is 'Refresh'
   * @param refreshButtonClassName The  classname to give to the refresh button
   * @param dismissButtonLabel The label to use for the dismiss button. Default is 'Dismiss'
   * @param dismissButtonClassName The classname to give to the dismiss button
   * @returns Promise<void> - A promise once the message is closed.
   */
  public static async showRefreshDialog(
    title: string,
    msg: string[],
    refreshButtonLabel: string = 'Refresh',
    dismissButtonLabel: string = 'Dismiss',
    refreshButtonClassName: string = '',
    dismissButtonClassName: string = '',
  ): Promise<void> {
    (await this.showYesNoDialog(
      title,
      msg,
      refreshButtonLabel,
      dismissButtonLabel,
      refreshButtonClassName,
      dismissButtonClassName,
    )) && location.reload();
  }

  /**
   * @description Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
   */
  public static async createNewNotebook(
    command: CommandRegistry,
  ): Promise<NotebookPanel> {
    const notebook: NotebookPanel = await command.execute(
      'notebook:create-new',
      {
        activate: true,
        path: '',
        preferredLanguage: '',
      },
    );
    await notebook.sessionContext.ready;
    return notebook;
  }

  /**
   * Safely saves the Jupyter notebook document contents to disk
   * @param notebookPanel The notebook panel containing the notebook to save
   * @param withPrompt Ask the user before saving the notebook
   * @param waitSave Await the save notebook operation
   */
  public static async saveNotebook(
    notebookPanel: NotebookPanel,
    withPrompt: boolean = false,
    waitSave: boolean = false,
  ): Promise<boolean> {
    if (!notebookPanel?.model) {
      return false;
    }

    if (notebookPanel.model.dirty) {
      await notebookPanel.context.ready;
      if (
        withPrompt &&
        !(await this.showYesNoDialog('Unsaved changes', [
          'Do you want to save the notebook?',
        ]))
      ) {
        return false;
      }
      waitSave
        ? await notebookPanel.context.save()
        : notebookPanel.context.save();
      return true;
    }
    return false;
  }

  /**
   * Convert the notebook contents to JSON
   * @param notebookPanel The notebook panel containing the notebook to serialize
   */
  public static notebookToJSON(notebookPanel: NotebookPanel): PartialJSONValue | null {
    if (notebookPanel?.content?.model) {
      return notebookPanel.content.model.toJSON();
    }
    return null;
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * @param notebookPanel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns any -The value of the metadata. Returns null if the key doesn't exist.
   */
  public static getMetaData(notebookPanel: NotebookPanel, key: string): any {
    if (!notebookPanel) {
      throw new Error(
        'The notebook is null or undefined. No meta data available.',
      );
    }

    if (notebookPanel.model?.metadata) {
      const metadata = notebookPanel.model.metadata as any;
      if (typeof metadata.has === 'function' && metadata.has(key)) {
        return metadata.get(key);
      }
      // Fallback for different metadata implementations
      return metadata[key] || null;
    }
    return null;
  }

  /**
   * @description Sets the key value pair in the notebook's metadata.
   * If the key doesn't exists it will add one.
   * @param notebookPanel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @param save Default is false. Whether the notebook should be saved after the meta data is set.
   * Note: This function will not wait for the save to complete, it only sends a save request.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  public static setMetaData(
    notebookPanel: NotebookPanel,
    key: string,
    value: any,
    save: boolean = false,
  ): any {
    if (!notebookPanel) {
      throw new Error(
        'The notebook is null or undefined. No meta data available.',
      );
    }

    if (!notebookPanel.model?.metadata) {
      throw new Error('Notebook metadata is not available.');
    }

    const metadata = notebookPanel.model.metadata as any;
    let oldVal: any;

    if (typeof metadata.set === 'function') {
      oldVal = metadata.set(key, value);
    } else {
      // Fallback for different metadata implementations
      oldVal = (metadata as any)[key];
      (metadata as any)[key] = value;
    }

    if (save) {
      this.saveNotebook(notebookPanel);
    }
    return oldVal;
  }

  public static async runGlobalCells(
    notebook: NotebookPanel,
  ): Promise<IRunCellResponse> {
    if (!notebook.model) {
      throw new Error('Notebook model is null');
    }

    let cell = { cell: notebook.content.widgets[0], index: 0 };
    const reservedCellsToBeIgnored = ['skip', 'pipeline-metrics'];

    for (let i = 0; i < notebook.model.cells.length; i++) {
      const cellModel = notebook.model.cells.get(i);
      if (!cellModel || !isCodeCellModel(cellModel)) {
        continue;
      }
      const blockName = CellUtilities.getStepName(notebook, i);
      // If a cell of that type is found, run that
      // and all consequent cells getting merged to that one
      if (
        !reservedCellsToBeIgnored.includes(blockName) &&
        RESERVED_CELL_NAMES.includes(blockName)
      ) {
        while (i < notebook.model.cells.length) {
          const currentCellModel = notebook.model.cells.get(i);
          if (!currentCellModel || !isCodeCellModel(currentCellModel as CodeCellModel)) {
            i++;
            continue;
          }
          const cellName = CellUtilities.getStepName(notebook, i);
          if (cellName !== blockName && cellName !== '') {
            // Decrement by 1 to parse that cell during the next for loop
            i--;
            break;
          }
          cell = { cell: notebook.content.widgets[i] as any, index: i };
          this.selectAndScrollToCell(notebook, cell);

          // Execute the cell with proper error handling
          try {
            const kernelMsg = (await CodeCell.execute(
              notebook.content.widgets[i] as unknown as CodeCell,
              notebook.sessionContext,
            )) as KernelMessage.IExecuteReplyMsg;

            if (kernelMsg.content && kernelMsg.content.status === 'error') {
              return {
                status: 'error',
                cellType: blockName,
                cellIndex: i,
                ename: kernelMsg.content.ename,
                evalue: kernelMsg.content.evalue,
              };
            }
          } catch (error) {
            return {
              status: 'error',
              cellType: blockName,
              cellIndex: i,
              ename: 'ExecutionError',
              evalue: String(error),
            };
          }
          i++;
        }
      }
    }
    return { status: 'ok' };
  }

  /**
   * Get a new Kernel, not tied to a Notebook
   * Source code here: https://github.com/jupyterlab/jupyterlab/tree/473348d25bcb258ca2f0c127dd8fb5b193217135/packages/services
   */
  public static async createNewKernel() {
    const specs = await KernelSpecAPI.getSpecs();
    const defaultKernelSpec = specs.default;
    return await new KernelManager().startNew({ name: defaultKernelSpec });
  }

  // TODO: We can use this context manager to execute commands inside a new kernel
  //  and be sure that it will be disposed of at the end.
  //  Another approach could be to create a kale_rpc Kernel, as a singleton,
  //  created at startup. The only (possible) drawback is that we can not name
  //  a kernel instance with a custom id/name, so when refreshing JupyterLab we would
  //  not recognize the kernel. A solution could be to have a kernel spec dedicated to kale rpc calls.
  public static async executeWithNewKernel(action: (kernel: Kernel.IKernelConnection, ...args: any[]) => any,
    args: any[] = []) {
    // create brand new kernel
    const _k = await this.createNewKernel();
    // execute action inside kernel
    const res = await action(_k, ...args);
    // close kernel
    _k.shutdown();
    // return result
    return res;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param kernel The kernel to run the code in.
   * @param runCode The code to run in the kernel.
   * @param userExpressions The expressions used to capture the desired info from the executed code.
   * @param runSilent Default is false. If true, kernel will execute as quietly as possible.
   * store_history will be set to false, and no broadcast on IOPUB channel will be made.
   * @param storeHistory Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
   * @param allowStdIn Default is false. If true, code running in kernel can prompt user for input using
   * an input_request message.
   * @param stopOnError Default is false. If True, does not abort the execution queue, if an exception is encountered.
   * This allows the queued execution of multiple execute_requests, even if they generate exceptions.
   * @returns Promise<any> - A promise containing the execution results of the code as an object with
   * keys based on the user_expressions.
   * @example
   * //The code
   * const code = "a=123\nb=456\nsum=a+b";
   * //The user expressions
   * const expr = {sum: "sum",prod: "a*b",args:"[a,b,sum]"};
   * //Async function call (returns a promise)
   * sendKernelRequest(notebookPanel, code, expr,false);
   * //Result when promise resolves:
   * {
   *  sum:{status:"ok",data:{"text/plain":"579"},metadata:{}},
   *  prod:{status:"ok",data:{"text/plain":"56088"},metadata:{}},
   *  args:{status:"ok",data:{"text/plain":"[123, 456, 579]"}}
   * }
   * @see For more information on JupyterLab messages:
   * https://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results
   */
  public static async sendKernelRequest(
    kernel: Kernel.IKernelConnection,
    runCode: string,
    userExpressions: JSONObject | undefined,
    runSilent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false,
  ): Promise<any> {
    if (!kernel) {
      throw new Error('Kernel is null or undefined.');
    }

    const message: KernelMessage.IShellMessage = await kernel.requestExecute({
      allow_stdin: allowStdIn,
      code: runCode,
      silent: runSilent,
      stop_on_error: stopOnError,
      store_history: storeHistory,
      user_expressions: userExpressions,
    }).done;

    const content: any = message.content;

    if (content.status !== 'ok') {
      // If response is not 'ok', throw contents as error, log code
      const msg: string = `Code caused an error:\n${runCode}`;
      console.error(msg);
      if (content.traceback) {
        content.traceback.forEach((line: string) =>
          console.log(
            line.replace(
              /[\t\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
              '',
            ),
          ),
        );
      }
      throw content;
    }
    // Return user_expressions of the content
    return content.user_expressions;
  }

  /**
   * Same as method sendKernelRequest but passing
   * a NotebookPanel instead of a Kernel
   */
  public static async sendKernelRequestFromNotebook(
    notebookPanel: NotebookPanel,
    runCode: string,
    userExpressions: JSONObject | undefined,
    runSilent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false,
  ) {
    if (!notebookPanel) {
      throw new Error('Notebook is null or undefined.');
    }

    // Wait for notebook panel to be ready
    await notebookPanel.sessionContext.ready;

    const kernel = notebookPanel.sessionContext.session?.kernel;
    if (!kernel) {
      throw new Error('Kernel is not available.');
    }

    return this.sendKernelRequest(
      kernel,
      runCode,
      userExpressions,
      runSilent,
      storeHistory,
      allowStdIn,
      stopOnError,
    );
  }
}
