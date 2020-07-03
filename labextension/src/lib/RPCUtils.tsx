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
import { NotebookPanel } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
import NotebookUtils from './NotebookUtils';

export const globalUnhandledRejection = async (event: any) => {
  // console.error(event.reason);
  if (event.reason instanceof BaseError) {
    console.error(event.reason.message, event.reason.error);
    event.reason.showDialog().then();
  } else {
    showError(
      'An unexpected error has occurred',
      'JS',
      `${event.reason.name}: ${event.reason.message}`,
      'Please see the console for more information',
      true,
    ).then();
  }
};

export interface IRPCError {
  rpc: string;
  code: number;
  err_message: string;
  err_details: string;
  err_cls: string;
  trans_id?: number;
}

export enum RPC_CALL_STATUS {
  OK = 0,
  ImportError = 1,
  EncodingError = 2,
  NotFound = 3,
  InternalError = 4,
  ServiceUnavailable = 5,
  UnhandledError = 6,
}

const getRpcCodeName = (code: number) => {
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

export const rokErrorTooltip = (rokError: IRPCError) => {
  return (
    <React.Fragment>
      <div>
        This feature requires Rok.{' '}
        <a onClick={_ => showRpcError(rokError)}>More info...</a>
      </div>
    </React.Fragment>
  );
};

const serialize = (obj: any) => window.btoa(JSON.stringify(obj));
const deserialize = (raw_data: string) =>
  window.atob(raw_data.substring(1, raw_data.length - 1));

/**
 * Execute kale.rpc module functions
 * Example: func_result = await this.executeRpc(kernel | notebookPanel, "rpc_submodule.func", {arg1, arg2})
 *    where func_result is a JSON object
 * @param func Function name to be executed
 * @param kwargs Dictionary with arguments to be passed to the function
 * @param ctx Dictionary with the RPC context (e.g., nb_path)
 * @param env instance of Kernel or NotebookPanel
 */
export const executeRpc = async (
  env: Kernel.IKernelConnection | NotebookPanel,
  func: string,
  kwargs: any = {},
  ctx: any = {},
) => {
  const cmd: string =
    `from kale.rpc.run import run as __kale_rpc_run\n` +
    `__kale_rpc_result = __kale_rpc_run("${func}", '${serialize(
      kwargs,
    )}', '${serialize(ctx)}')`;
  console.log('Executing command: ' + cmd);
  const expressions = { result: '__kale_rpc_result' };
  let output: any = null;
  try {
    output =
      env instanceof NotebookPanel
        ? await NotebookUtils.sendKernelRequestFromNotebook(
            env,
            cmd,
            expressions,
          )
        : await NotebookUtils.sendKernelRequest(env, cmd, expressions);
  } catch (e) {
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
  } catch (error) {
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
  } else {
    // console.log(msg, parsedResult);
    return parsedResult.result;
  }
};

export const showError = async (
  title: string,
  type: string,
  message: string,
  details: string,
  refresh: boolean = true,
  method: string = null,
  code: number = null,
  trans_id: number = null,
): Promise<void> => {
  let msg: string[] = [
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
    await NotebookUtils.showRefreshDialog(title, msg);
  } else {
    await NotebookUtils.showMessage(title, msg);
  }
};

export const showRpcError = async (
  error: IRPCError,
  refresh: boolean = false,
): Promise<void> => {
  await showError(
    'An RPC Error has occurred',
    'RPC',
    error.err_message,
    error.err_details,
    refresh,
    error.rpc,
    error.code,
    error.trans_id,
  );
};

// todo: refactor these legacy functions
export const _legacy_executeRpc = async (
  notebook: NotebookPanel,
  kernel: Kernel.IKernelConnection,
  func: string,
  args: any = {},
  nb_path: string = null,
) => {
  if (!nb_path && notebook) {
    nb_path = notebook.context.path;
  }
  let retryRpc = true;
  let result: any = null;
  // Kerned aborts the execution if busy
  // If that is the case, retry the RPC
  while (retryRpc) {
    try {
      result = await executeRpc(kernel, func, args, { nb_path });
      retryRpc = false;
    } catch (error) {
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
export const _legacy_executeRpcAndShowRPCError = async (
  notebook: NotebookPanel,
  kernel: Kernel.IKernelConnection,
  func: string,
  args: any = {},
  nb_path: string = null,
) => {
  try {
    const result = await _legacy_executeRpc(
      notebook,
      kernel,
      func,
      args,
      nb_path,
    );
    return result;
  } catch (error) {
    if (error instanceof RPCError) {
      await error.showDialog();
      return null;
    }
    throw error;
  }
};

export abstract class BaseError extends Error {
  constructor(message: string, public error: any) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
    Object.setPrototypeOf(this, BaseError.prototype);
  }

  public abstract async showDialog(refresh: boolean): Promise<void>;
}

export class KernelError extends BaseError {
  constructor(error: any) {
    super('Kernel error', error);
    Object.setPrototypeOf(this, KernelError.prototype);
  }

  public async showDialog(refresh: boolean = true): Promise<void> {
    await showError(
      'A Kernel Error has occurred',
      'Kernel',
      this.error.status,
      JSON.stringify(this.error.output, null, 3),
      refresh,
      this.error.rpc,
    );
  }
}

export class JSONParseError extends BaseError {
  constructor(error: any) {
    super('JSON Parse error', error);
    Object.setPrototypeOf(this, JSONParseError.prototype);
  }

  public async showDialog(refresh: boolean = false): Promise<void> {
    await showError(
      'Failed to parse RPC response as JSON',
      'JSONParse',
      this.error.error.message,
      this.error.json_data,
      refresh,
      this.error.rpc,
    );
  }
}

export class RPCError extends BaseError {
  constructor(error: IRPCError) {
    super('RPC Error', error);
    Object.setPrototypeOf(this, RPCError.prototype);
  }

  public async showDialog(refresh: boolean = false): Promise<void> {
    await showRpcError(this.error, refresh);
  }
}
