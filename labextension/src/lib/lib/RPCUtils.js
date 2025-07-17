"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const notebook_1 = require("@jupyterlab/notebook");
const NotebookUtils_1 = __importDefault(require("./NotebookUtils"));
exports.globalUnhandledRejection = async (event) => {
    // console.error(event.reason);
    if (event.reason instanceof BaseError) {
        console.error(event.reason.message, event.reason.error);
        event.reason.showDialog().then();
    }
    else {
        exports.showError('An unexpected error has occurred', 'JS', `${event.reason.name}: ${event.reason.message}`, 'Please see the console for more information', true).then();
    }
};
var RPC_CALL_STATUS;
(function (RPC_CALL_STATUS) {
    RPC_CALL_STATUS[RPC_CALL_STATUS["OK"] = 0] = "OK";
    RPC_CALL_STATUS[RPC_CALL_STATUS["ImportError"] = 1] = "ImportError";
    RPC_CALL_STATUS[RPC_CALL_STATUS["EncodingError"] = 2] = "EncodingError";
    RPC_CALL_STATUS[RPC_CALL_STATUS["NotFound"] = 3] = "NotFound";
    RPC_CALL_STATUS[RPC_CALL_STATUS["InternalError"] = 4] = "InternalError";
    RPC_CALL_STATUS[RPC_CALL_STATUS["ServiceUnavailable"] = 5] = "ServiceUnavailable";
    RPC_CALL_STATUS[RPC_CALL_STATUS["UnhandledError"] = 6] = "UnhandledError";
})(RPC_CALL_STATUS = exports.RPC_CALL_STATUS || (exports.RPC_CALL_STATUS = {}));
const getRpcCodeName = (code) => {
    switch (code) {
        case RPC_CALL_STATUS.OK:
            return 'OK';
        case RPC_CALL_STATUS.ImportError:
            return 'ImportError';
        case RPC_CALL_STATUS.EncodingError:
            return 'EncodingError';
        case RPC_CALL_STATUS.NotFound:
            return 'NotFound';
        case RPC_CALL_STATUS.InternalError:
            return 'InternalError';
        case RPC_CALL_STATUS.ServiceUnavailable:
            return 'ServiceUnavailable';
        default:
            return 'UnhandledError';
    }
};
exports.rokErrorTooltip = (rokError) => {
    return (React.createElement(React.Fragment, null,
        React.createElement("div", null,
            "This feature requires Rok.",
            ' ',
            React.createElement("a", { onClick: _ => exports.showRpcError(rokError) }, "More info..."))));
};
const serialize = (obj) => window.btoa(JSON.stringify(obj));
const deserialize = (raw_data) => window.atob(raw_data.substring(1, raw_data.length - 1));
/**
 * Execute kale.rpc module functions
 * Example: func_result = await this.executeRpc(kernel | notebookPanel, "rpc_submodule.func", {arg1, arg2})
 *    where func_result is a JSON object
 * @param func Function name to be executed
 * @param kwargs Dictionary with arguments to be passed to the function
 * @param ctx Dictionary with the RPC context (e.g., nb_path)
 * @param env instance of Kernel or NotebookPanel
 */
exports.executeRpc = async (env, func, kwargs = {}, ctx = {}) => {
    const cmd = `from kale.rpc.run import run as __kale_rpc_run\n` +
        `__kale_rpc_result = __kale_rpc_run("${func}", '${serialize(kwargs)}', '${serialize(ctx)}')`;
    console.log('Executing command: ' + cmd);
    const expressions = { result: '__kale_rpc_result' };
    let output = null;
    try {
        output =
            env instanceof notebook_1.NotebookPanel
                ? await NotebookUtils_1.default.sendKernelRequestFromNotebook(env, cmd, expressions)
                : await NotebookUtils_1.default.sendKernelRequest(env, cmd, expressions);
    }
    catch (e) {
        console.warn(e);
        const error = {
            rpc: `${func}`,
            status: `${e.ename}: ${e.evalue}`,
            output: e.traceback,
        };
        throw new KernelError(error);
    }
    // const argsAsStr = Object.keys(kwargs).map(key => `${key}=${kwargs[key]}`).join(', ');
    let msg = [`RPC: ${func}`];
    // Log output
    if (output.result.status !== 'ok') {
        const title = `Kernel failed during code execution`;
        msg = msg.concat([
            `Status: ${output.result.status}`,
            `Output: ${JSON.stringify(output, null, 3)}`,
        ]);
        const error = {
            rpc: `${func}`,
            status: output.result.status,
            output: output,
        };
        throw new KernelError(error);
    }
    // console.log(msg.concat([output]));
    const raw_data = output.result.data['text/plain'];
    const json_data = deserialize(raw_data);
    // Validate response is a JSON
    // If successful, run() method returns json.dumps() of any result
    let parsedResult = undefined;
    try {
        parsedResult = JSON.parse(json_data);
    }
    catch (error) {
        const title = `Failed to parse response as JSON`;
        msg = msg.concat([
            `Error: ${JSON.stringify(error, null, 3)}`,
            `Response data: ${json_data}`,
        ]);
        const jsonError = {
            rpc: `${func}`,
            err_message: 'Failed to parse response as JSON',
            error: error,
            jsonData: json_data,
        };
        throw new JSONParseError(jsonError);
    }
    if (parsedResult.code !== 0) {
        const title = `An error has occured`;
        msg = msg.concat([
            `Code: ${parsedResult.code} (${getRpcCodeName(parsedResult.code)})`,
            `Message: ${parsedResult.err_message}`,
            `Details: ${parsedResult.err_details}`,
        ]);
        let error = {
            rpc: `${func}`,
            code: parsedResult.code,
            err_message: parsedResult.err_message,
            err_details: parsedResult.err_details,
            err_cls: parsedResult.err_cls,
            trans_id: parsedResult.trans_id,
        };
        throw new RPCError(error);
    }
    else {
        // console.log(msg, parsedResult);
        return parsedResult.result;
    }
};
exports.showError = async (title, type, message, details, refresh = true, method = null, code = null, trans_id = null) => {
    let msg = [
        `Browser: ${navigator ? navigator.userAgent : 'other'}`,
        `Type: ${type}`,
    ];
    if (method) {
        msg.push(`Method: ${method}()`);
    }
    if (code) {
        msg.push(`Code: ${code} (${getRpcCodeName(code)})`);
    }
    if (trans_id) {
        msg.push(`Transaction ID: ${trans_id}`);
    }
    msg.push(`Message: ${message}`, `Details: ${details}`);
    if (refresh) {
        await NotebookUtils_1.default.showRefreshDialog(title, msg);
    }
    else {
        await NotebookUtils_1.default.showMessage(title, msg);
    }
};
exports.showRpcError = async (error, refresh = false) => {
    await exports.showError('An RPC Error has occurred', 'RPC', error.err_message, error.err_details, refresh, error.rpc, error.code, error.trans_id);
};
// todo: refactor these legacy functions
exports._legacy_executeRpc = async (notebook, kernel, func, args = {}, nb_path = null) => {
    if (!nb_path && notebook) {
        nb_path = notebook.context.path;
    }
    let retryRpc = true;
    let result = null;
    // Kerned aborts the execution if busy
    // If that is the case, retry the RPC
    while (retryRpc) {
        try {
            result = await exports.executeRpc(kernel, func, args, { nb_path });
            retryRpc = false;
        }
        catch (error) {
            if (error instanceof KernelError && error.error.status === 'aborted') {
                continue;
            }
            // If kernel not busy, throw the error
            throw error;
        }
    }
    return result;
};
// Execute RPC and if an RPCError is caught, show dialog and return null
// This is our default behavior prior to this commit. This may probably
// change in the future, setting custom logic for each RPC call. For
// example, see getBaseImage().
exports._legacy_executeRpcAndShowRPCError = async (notebook, kernel, func, args = {}, nb_path = null) => {
    try {
        const result = await exports._legacy_executeRpc(notebook, kernel, func, args, nb_path);
        return result;
    }
    catch (error) {
        if (error instanceof RPCError) {
            await error.showDialog();
            return null;
        }
        throw error;
    }
};
class BaseError extends Error {
    constructor(message, error) {
        super(message);
        this.error = error;
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
        else {
            this.stack = new Error(message).stack;
        }
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}
exports.BaseError = BaseError;
class KernelError extends BaseError {
    constructor(error) {
        super('Kernel error', error);
        Object.setPrototypeOf(this, KernelError.prototype);
    }
    async showDialog(refresh = true) {
        await exports.showError('A Kernel Error has occurred', 'Kernel', this.error.status, JSON.stringify(this.error.output, null, 3), refresh, this.error.rpc);
    }
}
exports.KernelError = KernelError;
class JSONParseError extends BaseError {
    constructor(error) {
        super('JSON Parse error', error);
        Object.setPrototypeOf(this, JSONParseError.prototype);
    }
    async showDialog(refresh = false) {
        await exports.showError('Failed to parse RPC response as JSON', 'JSONParse', this.error.error.message, this.error.json_data, refresh, this.error.rpc);
    }
}
exports.JSONParseError = JSONParseError;
class RPCError extends BaseError {
    constructor(error) {
        super('RPC Error', error);
        Object.setPrototypeOf(this, RPCError.prototype);
    }
    async showDialog(refresh = false) {
        await exports.showRpcError(this.error, refresh);
    }
}
exports.RPCError = RPCError;
