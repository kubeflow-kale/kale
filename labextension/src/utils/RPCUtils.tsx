import * as React from "react";
import { NotebookPanel } from "@jupyterlab/notebook";
import { Kernel } from "@jupyterlab/services";
import NotebookUtils from "./NotebookUtils"

enum RPC_CALL_STATUS {
    OK = 0,
    ImportError = 1,
    ExecutionError = 2,
    EncodingError = 3,
}

const getRpcCodeName = (code: number) => {
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

/**
 * Execute kale.rpc module functions
 * Example: func_result = await this.executeRpc(kernel | notebookPanel, "rpc_submodule.func", {arg1, arg2})
 *    where func_result is a JSON object
 * @param func Function name to be executed
 * @param kwargs Dictionary with arguments to be passed to the function
 * @param env instance of Kernel or NotebookPanel
 */
export const executeRpc = async (
    env: Kernel.IKernelConnection | NotebookPanel,
    func: string,
    kwargs: any = {}
) => {
    const cmd: string = `from kale.rpc.run import run as __kale_rpc_run\n`
        + `__kale_rpc_result = __kale_rpc_run("${func}", '${window.btoa(JSON.stringify(kwargs))}')`;
    console.log("Executing command: " + cmd);
    const expressions = {result: "__kale_rpc_result"};
    const output = (env instanceof NotebookPanel) ?
        await NotebookUtils.sendKernelRequestFromNotebook(env, cmd, expressions) :
        await NotebookUtils.sendKernelRequest(env, cmd, expressions);

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
        await NotebookUtils.showMessage(title, msg);
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
        await NotebookUtils.showMessage(title, msg);
        return null;
    }

    if (parsedResult.code !== 0) {
        const title = `An error has occured`;
        msg = msg.concat([
            `Code: ${parsedResult.code} (${getRpcCodeName(parsedResult.code)})`,
            `Type: ${JSON.stringify(parsedResult.err_cls, null, 3)}`,
            `Message: ${parsedResult.err_message}`
        ]);
        console.error(msg);
        await NotebookUtils.showMessage(title, msg);
        return null;
    } else {
        msg = msg.concat([
            `Result: ${parsedResult}`
        ]);
        // console.log(msg);
        return parsedResult.result;
    }
}