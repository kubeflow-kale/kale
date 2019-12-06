import { Dialog, showDialog } from "@jupyterlab/apputils";
import { NotebookPanel } from "@jupyterlab/notebook";
import { KernelMessage, Kernel } from "@jupyterlab/services";
import { CommandRegistry } from "@phosphor/commands";
import * as React from "react";


enum RPC_CALL_STATUS {
  OK = 0,
  ImportError = 1,
  ExecutionError = 2,
  EncodingError = 3,
}

const getRpcStatusName = (code: number) => {
  switch (code) {
    case RPC_CALL_STATUS.OK:
      return 'OK';
    case RPC_CALL_STATUS.ImportError:
      return 'ImportError';
    case RPC_CALL_STATUS.ExecutionError:
      return 'ExecutionError';
    case RPC_CALL_STATUS.EncodingError:
      return 'EncodingError';
    default:
      return 'UnknownError';
  }
};

/** Contains utility functions for manipulating/handling notebooks in the application. */
export default class NotebookUtilities {
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
    buttonLabel: string = "OK",
    buttonClassName: string = ""
  ): Promise<void> {
    const buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: buttonLabel, className: buttonClassName })
    ];

    const messageBody =
        <div>{msg.map((s: string) => {
            return <><span className='dialog-box-text'>{s}</span><br/></>
        })}</div>;

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
    return result.button.label === acceptLabel
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
   * Convert the notebook contents to JSON
   * @param notebookPanel The notebook panel containing the notebook to serialize
   */
  public static notebookToJSON(
      notebookPanel: NotebookPanel
  ): any {
    if (notebookPanel) {
      return notebookPanel.content.model.toJSON()
    }
    return null
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
   * Get a new Kernel, not tied to a Notebook
   * Source code here: https://github.com/jupyterlab/jupyterlab/tree/473348d25bcb258ca2f0c127dd8fb5b193217135/packages/services
   */
  public static async createNewKernel() {
    // Get info about the available kernels and start a new one.
    let options: Kernel.IOptions = await Kernel.getSpecs().then(kernelSpecs => {
      console.log('Default spec:', kernelSpecs.default);
      console.log('Available specs', Object.keys(kernelSpecs.kernelspecs));
      // use the default name
      return {name: kernelSpecs.default}
    });
    return await Kernel.startNew(options).then(_kernel => {
        return _kernel
      });
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
    kernel: Kernel.IKernelConnection,
    runCode: string,
    userExpressions: any,
    runSilent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false
  ): Promise<any> {
    if (!kernel) {
      throw new Error("Kernel is null or undefined.");
    }

    // Wait for kernel to be ready before sending request
    await kernel.ready;

    const message: KernelMessage.IShellMessage = await kernel.requestExecute(
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

    if (content.status !== "ok") {
      // If response is not 'ok', throw contents as error, log code
      const msg: string = `Code caused an error:\n${runCode}`;
      console.error(msg);
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
      userExpressions: any,
      runSilent: boolean = false,
      storeHistory: boolean = false,
      allowStdIn: boolean = false,
      stopOnError: boolean = false
  ) {
    if (!notebookPanel) {
      throw new Error("Notebook is null or undefined.");
    }

    // Wait for notebook panel to be ready
    await notebookPanel.activated;
    await notebookPanel.session.ready;

    return this.sendKernelRequest(
        notebookPanel.session.kernel,
        runCode,
        userExpressions,
        runSilent,
        storeHistory,
        allowStdIn,
        stopOnError
    )
  }

  /**
   * Execute kale.rpc module functions
   * Example: func_result = await this.executeRpc("rpc_submodule.func", {arg1, arg2})
   *    where func_result is a JSON object
   * @param func Function name to be executed
   * @param kwargs Dictionary with arguments to be passed to the function
   * @param env instance of Kernel or NotebookPanel
   */
  public static async executeRpc(env: Kernel.IKernelConnection | NotebookPanel,
                                 func: string,
                                 kwargs: any = {}) {
    const cmd: string = `from kale.rpc.run import run as __kale_rpc_run\n`
        + `__kale_rpc_result = __kale_rpc_run("${func}", '${window.btoa(JSON.stringify(kwargs))}')`;
    console.log("Executing command: " + cmd);
    const expressions = {result: "__kale_rpc_result"};
    const output = (env instanceof NotebookPanel) ?
      await this.sendKernelRequestFromNotebook(env, cmd, expressions) :
      await this.sendKernelRequest(env, cmd, expressions);

    const argsAsStr = Object.keys(kwargs).map(key => `${key}=${kwargs[key]}`).join(', ');
    let msg = [
      `Function Call: ${func}(${argsAsStr})`,
    ];
    // Log output
    if (output.result.status !== "ok") {
      const title = `Kernel failed during code execution`;
      msg = msg.concat([
        `Status: ${output.result.status}`,
        `Output: ${JSON.stringify(output, null, 3)}`
      ]);
      console.error([title].concat(msg));
      await this.showMessage(title, msg);
      return null;
    }

    // console.log(msg.concat([output]));
    const raw_data = output.result.data["text/plain"];
    const json_data = window.atob(raw_data.substring(1, raw_data.length - 1));

    // Validate response is a JSON
    // If successful, run() method returns json.dumps() of any result
    let parsedResult = undefined;
    try {
      parsedResult = JSON.parse(json_data);
    } catch (error) {
      const title = `Failed to parse response as JSON`;
      msg = msg.concat([
        `Error: ${JSON.stringify(error, null, 3)}`,
        `Response data: ${json_data}`
      ]);
      console.error(msg);
      await this.showMessage(title, msg);
      return null;
    }

    if (parsedResult.status !== 0) {
      const title = `An error has occured`;
      msg = msg.concat([
        `Status: ${parsedResult.status} (${getRpcStatusName(parsedResult.status)})`,
        `Type: ${JSON.stringify(parsedResult.err_cls, null, 3)}`,
        `Message: ${parsedResult.err_message}`
      ]);
      console.error(msg);
      await this.showMessage(title, msg);
      return null;
    } else {
      msg = msg.concat([
        `Result: ${parsedResult}`
      ]);
      // console.log(msg);
      return parsedResult.result;
    }
  }
}
