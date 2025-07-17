import * as React from 'react';
import { IKatibMetadata } from './LeftPanel';
import { Kernel } from '@jupyterlab/services';
interface KabitDialog {
    open: boolean;
    nbFilePath: string;
    toggleDialog: Function;
    katibMetadata: IKatibMetadata;
    updateKatibMetadata: Function;
    kernel: Kernel.IKernelConnection;
}
export declare const KatibDialog: React.FunctionComponent<KabitDialog>;
export {};
