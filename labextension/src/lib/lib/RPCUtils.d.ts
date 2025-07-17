/// <reference types="react" />
import { NotebookPanel } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
export declare const globalUnhandledRejection: (event: any) => Promise<void>;
export interface IRPCError {
    rpc: string;
    code: number;
    err_message: string;
    err_details: string;
    err_cls: string;
    trans_id?: number;
}
export declare enum RPC_CALL_STATUS {
    OK = 0,
    ImportError = 1,
    EncodingError = 2,
    NotFound = 3,
    InternalError = 4,
    ServiceUnavailable = 5,
    UnhandledError = 6
}
export declare const rokErrorTooltip: (rokError: IRPCError) => JSX.Element;
/**
 * Execute kale.rpc module functions
 * Example: func_result = await this.executeRpc(kernel | notebookPanel, "rpc_submodule.func", {arg1, arg2})
 *    where func_result is a JSON object
 * @param func Function name to be executed
 * @param kwargs Dictionary with arguments to be passed to the function
 * @param ctx Dictionary with the RPC context (e.g., nb_path)
 * @param env instance of Kernel or NotebookPanel
 */
export declare const executeRpc: (env: Kernel.IKernelConnection | NotebookPanel, func: string, kwargs?: any, ctx?: any) => Promise<any>;
export declare const showError: (title: string, type: string, message: string, details: string, refresh?: boolean, method?: string, code?: number, trans_id?: number) => Promise<void>;
export declare const showRpcError: (error: IRPCError, refresh?: boolean) => Promise<void>;
export declare const _legacy_executeRpc: (notebook: NotebookPanel, kernel: Kernel.IKernelConnection, func: string, args?: any, nb_path?: string) => Promise<any>;
export declare const _legacy_executeRpcAndShowRPCError: (notebook: NotebookPanel, kernel: Kernel.IKernelConnection, func: string, args?: any, nb_path?: string) => Promise<any>;
export declare abstract class BaseError extends Error {
    error: any;
    constructor(message: string, error: any);
    abstract showDialog(refresh: boolean): Promise<void>;
}
export declare class KernelError extends BaseError {
    constructor(error: any);
    showDialog(refresh?: boolean): Promise<void>;
}
export declare class JSONParseError extends BaseError {
    constructor(error: any);
    showDialog(refresh?: boolean): Promise<void>;
}
export declare class RPCError extends BaseError {
    constructor(error: IRPCError);
    showDialog(refresh?: boolean): Promise<void>;
}
