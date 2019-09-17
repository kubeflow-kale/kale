import { Dialog, showDialog } from "@jupyterlab/apputils";
import { NotebookPanel } from "@jupyterlab/notebook";
import { KernelMessage } from "@jupyterlab/services";
import { CommandRegistry } from "@phosphor/commands";

/** Contains utility functions for manipulating/handling notebooks in the application. */
export default class NotebookUtilities {
  /**
   * Opens a pop-up dialog in JupyterLab to display a simple message.
   * @param title The title for the message popup
   * @param msg The message
   * @param buttonLabel The label to use for the button. Default is 'OK'
   * @param buttonClassName The classname to give to the 'ok' button
   * @returns Promise<void> - A promise once the message is closed.
   */
  public static async showMessage(
    title: string,
    msg: string,
    buttonLabel: string = "OK",
    buttonClassName: string = ""
  ): Promise<void> {
    const buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: buttonLabel, className: buttonClassName })
    ];
    await showDialog({ title, buttons, body: msg });
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
    msg: string,
    acceptLabel: string = "YES",
    rejectLabel: string = "NO",
    yesButtonClassName: string = "",
    noButtonClassName: string = ""
  ): Promise<boolean> {
    const buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: acceptLabel, className: yesButtonClassName }),
      Dialog.cancelButton({ label: rejectLabel, className: noButtonClassName })
    ];
    const result = await showDialog({ title, buttons, body: msg });
    if (result.button.label === acceptLabel) {
      return true;
    }
    return false;
  }

  /**
   * @description Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
   */
  public static async createNewNotebook(
    command: CommandRegistry
  ): Promise<NotebookPanel> {
    const notebook: any = await command.execute("notebook:create-new", {
      activate: true,
      path: "",
      preferredLanguage: ""
    });
    await notebook.session.ready;
    return notebook;
  }

  /**
   * Safely saves the Jupyter notebook document contents to disk
   * @param notebookPanel The notebook panel containing the notebook to save
   */
  public static async saveNotebook(
    notebookPanel: NotebookPanel
  ): Promise<boolean> {
    if (notebookPanel) {
      await notebookPanel.context.ready;
      notebookPanel.context.save();
      return true;
    }
    return false;
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
        "The notebook is null or undefined. No meta data available."
      );
    }
    if (notebookPanel.model && notebookPanel.model.metadata.has(key)) {
      return notebookPanel.model.metadata.get(key);
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
    save: boolean = false
  ): any {
    if (!notebookPanel) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    const oldVal = notebookPanel.model.metadata.set(key, value);
    if (save) {
      this.saveNotebook(notebookPanel);
    }
    return oldVal;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param notebookPanel The notebook to run the code in.
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
    notebookPanel: NotebookPanel,
    runCode: string,
    userExpressions: any,
    runSilent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false
  ): Promise<any> {
    // Check notebook panel is ready
    if (notebookPanel === null) {
      throw new Error("The notebook is null or undefined.");
    }

    // Wait for kernel to be ready before sending request
    await notebookPanel.activated;
    await notebookPanel.session.ready;
    await notebookPanel.session.kernel.ready;

    const message: KernelMessage.IShellMessage = await notebookPanel.session.kernel.requestExecute(
      {
        allow_stdin: allowStdIn,
        code: runCode,
        silent: runSilent,
        stop_on_error: stopOnError,
        store_history: storeHistory,
        user_expressions: userExpressions
      }
    ).done;

    const content: any = message.content;
    return content;

    // if (content.status !== "ok") {
    //   // If cdat is requesting user input, return nothing
    //   if (
    //     content.status === "error" &&
    //     content.ename === "StdinNotImplementedError"
    //   ) {
    //     return "";
    //   }
    //
    //   // If response is not 'ok', throw contents as error, log code
    //   const msg: string = `Code caused an error:\n${runCode}`;
    //   console.error(msg);
    //   throw content;
    // }
    // // Return user_expressions of the content
    // return content.user_expressions;
  }
}
