"use strict";
/*
 * Copyright 2019-2020 The Kale Authors
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const services_1 = require("@jupyterlab/services");
// @ts-ignore
const react_sanitized_html_1 = __importDefault(require("react-sanitized-html"));
const React = __importStar(require("react"));
const cells_1 = require("@jupyterlab/cells");
const CellMetadataEditor_1 = require("../widgets/cell-metadata/CellMetadataEditor");
const CellUtils_1 = __importDefault(require("./CellUtils"));
/** Contains utility functions for manipulating/handling notebooks in the application. */
class NotebookUtilities {
    /**
     * Clear the outputs of all the notebook' cells
     * @param notebook NotebookPanel
     */
    static clearCellOutputs(notebook) {
        for (let i = 0; i < notebook.model.cells.length; i++) {
            if (!cells_1.isCodeCellModel(notebook.model.cells.get(i))) {
                continue;
            }
            notebook.model.cells.get(i).executionCount = null;
            notebook.model.cells.get(i).outputs.clear();
        }
    }
    /**
     * Scroll the notebook to the specified cell, making it active
     * @param notebook NotebookPanel
     * @param cell The cell to be activated
     */
    static selectAndScrollToCell(notebook, cell) {
        notebook.content.select(cell.cell);
        notebook.content.activeCellIndex = cell.index;
        const cellPosition = notebook.content.node.childNodes[cell.index].getBoundingClientRect();
        notebook.content.scrollToPosition(cellPosition.top);
    }
    /**
     * Builds an HTML container by sanitizing a list of strings and converting
     * them in valid HTML
     * @param msg A list of string with HTML formatting
     * @returns a HTMLDivElement composed of a list of spans with formatted text
     */
    static buildDialogBody(msg) {
        return (React.createElement("div", { className: "dialog-body" }, msg.map((s, i) => {
            return (React.createElement(React.Fragment, { key: `msg-${i}` },
                React.createElement(react_sanitized_html_1.default, { allowedAttributes: { a: ['href'] }, allowedTags: ['b', 'i', 'em', 'strong', 'a', 'pre'], html: s }),
                React.createElement("br", null)));
        })));
    }
    /**
     * Opens a pop-up dialog in JupyterLab to display a simple message.
     * @param title The title for the message popup
     * @param msg The message as an array of strings
     * @param buttonLabel The label to use for the button. Default is 'OK'
     * @param buttonClassName The classname to give to the 'ok' button
     * @returns Promise<void> - A promise once the message is closed.
     */
    static async showMessage(title, msg, buttonLabel = 'Close', buttonClassName = '') {
        const buttons = [
            apputils_1.Dialog.okButton({ label: buttonLabel, className: buttonClassName }),
        ];
        const messageBody = this.buildDialogBody(msg);
        await apputils_1.showDialog({ title, buttons, body: messageBody });
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
    static async showYesNoDialog(title, msg, acceptLabel = 'YES', rejectLabel = 'NO', yesButtonClassName = '', noButtonClassName = '') {
        const buttons = [
            apputils_1.Dialog.okButton({ label: acceptLabel, className: yesButtonClassName }),
            apputils_1.Dialog.cancelButton({ label: rejectLabel, className: noButtonClassName }),
        ];
        const messageBody = this.buildDialogBody(msg);
        const result = await apputils_1.showDialog({ title, buttons, body: messageBody });
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
    static async showRefreshDialog(title, msg, refreshButtonLabel = 'Refresh', dismissButtonLabel = 'Dismiss', refreshButtonClassName = '', dismissButtonClassName = '') {
        (await this.showYesNoDialog(title, msg, refreshButtonLabel, dismissButtonLabel, refreshButtonClassName, dismissButtonClassName)) && location.reload();
    }
    /**
     * @description Creates a new JupyterLab notebook for use by the application
     * @param command The command registry
     * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
     */
    static async createNewNotebook(command) {
        const notebook = await command.execute('notebook:create-new', {
            activate: true,
            path: '',
            preferredLanguage: '',
        });
        await notebook.sessionContext.ready;
        return notebook;
    }
    /**
     * Safely saves the Jupyter notebook document contents to disk
     * @param notebookPanel The notebook panel containing the notebook to save
     * @param withPrompt Ask the user before saving the notebook
     * @param waitSave Await the save notebook operation
     */
    static async saveNotebook(notebookPanel, withPrompt = false, waitSave = false) {
        if (notebookPanel && notebookPanel.model.dirty) {
            await notebookPanel.context.ready;
            if (withPrompt &&
                !(await this.showYesNoDialog('Unsaved changes', [
                    'Do you want to save the notebook?',
                ]))) {
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
    static notebookToJSON(notebookPanel) {
        if (notebookPanel) {
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
    static getMetaData(notebookPanel, key) {
        if (!notebookPanel) {
            throw new Error('The notebook is null or undefined. No meta data available.');
        }
        if (notebookPanel.model && notebookPanel.model.metadata) {
            // Handle different metadata object types
            if (typeof notebookPanel.model.metadata.has === 'function' &&
                typeof notebookPanel.model.metadata.get === 'function') {
                // Map-like interface
                if (notebookPanel.model.metadata.has(key)) {
                    return notebookPanel.model.metadata.get(key);
                }
            }
            else if (typeof notebookPanel.model.metadata === 'object') {
                // Plain object interface - cast to any to access properties
                return notebookPanel.model.metadata[key] || null;
            }
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
    static setMetaData(notebookPanel, key, value, save = false) {
        if (!notebookPanel) {
            throw new Error('The notebook is null or undefined. No meta data available.');
        }
        const oldVal = notebookPanel.model.metadata.set(key, value);
        if (save) {
            this.saveNotebook(notebookPanel);
        }
        return oldVal;
    }
    static async runGlobalCells(notebook) {
        let cell = { cell: notebook.content.widgets[0], index: 0 };
        const reservedCellsToBeIgnored = ['skip', 'pipeline-metrics'];
        for (let i = 0; i < notebook.model.cells.length; i++) {
            if (!cells_1.isCodeCellModel(notebook.model.cells.get(i))) {
                continue;
            }
            const blockName = CellUtils_1.default.getStepName(notebook, i);
            // If a cell of that type is found, run that
            // and all consequent cells getting merged to that one
            if (!reservedCellsToBeIgnored.includes(blockName) &&
                CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(blockName)) {
                while (i < notebook.model.cells.length) {
                    if (!cells_1.isCodeCellModel(notebook.model.cells.get(i))) {
                        i++;
                        continue;
                    }
                    const cellName = CellUtils_1.default.getStepName(notebook, i);
                    if (cellName !== blockName && cellName !== '') {
                        // Decrement by 1 to parse that cell during the next for loop
                        i--;
                        break;
                    }
                    cell = { cell: notebook.content.widgets[i], index: i };
                    this.selectAndScrollToCell(notebook, cell);
                    // this.setState({ activeCellIndex: cell.index, activeCell: cell.cell });
                    const kernelMsg = (await cells_1.CodeCell.execute(notebook.content.widgets[i], notebook.sessionContext));
                    if (kernelMsg.content && kernelMsg.content.status === 'error') {
                        return {
                            status: 'error',
                            cellType: blockName,
                            cellIndex: i,
                            ename: kernelMsg.content.ename,
                            evalue: kernelMsg.content.evalue,
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
    static async createNewKernel() {
        const defaultKernelSpec = await services_1.KernelSpecAPI.getSpecs().then((res) => res.default);
        return await new services_1.KernelManager().startNew({ name: defaultKernelSpec });
    }
    // TODO: We can use this context manager to execute commands inside a new kernel
    //  and be sure that it will be disposed of at the end.
    //  Another approach could be to create a kale_rpc Kernel, as a singleton,
    //  created at startup. The only (possible) drawback is that we can not name
    //  a kernel instance with a custom id/name, so when refreshing JupyterLab we would
    //  not recognize the kernel. A solution could be to have a kernel spec dedicated to kale rpc calls.
    static async executeWithNewKernel(action, args = []) {
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
    static async sendKernelRequest(kernel, runCode, userExpressions, runSilent = false, storeHistory = false, allowStdIn = false, stopOnError = false) {
        if (!kernel) {
            throw new Error('Kernel is null or undefined.');
        }
        const message = await kernel.requestExecute({
            allow_stdin: allowStdIn,
            code: runCode,
            silent: runSilent,
            stop_on_error: stopOnError,
            store_history: storeHistory,
            user_expressions: userExpressions,
        }).done;
        const content = message.content;
        if (content.status !== 'ok') {
            // If response is not 'ok', throw contents as error, log code
            const msg = `Code caused an error:\n${runCode}`;
            console.error(msg);
            if (content.traceback) {
                content.traceback.forEach((line) => console.log(line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')));
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
    static async sendKernelRequestFromNotebook(notebookPanel, runCode, userExpressions, runSilent = false, storeHistory = false, allowStdIn = false, stopOnError = false) {
        if (!notebookPanel) {
            throw new Error('Notebook is null or undefined.');
        }
        // Wait for notebook panel to be ready
        await notebookPanel.sessionContext.ready;
        return this.sendKernelRequest(notebookPanel.sessionContext.session.kernel, runCode, userExpressions, runSilent, storeHistory, allowStdIn, stopOnError);
    }
}
exports.default = NotebookUtilities;
