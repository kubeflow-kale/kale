import * as React from 'react';
interface ICellMetadataEditorDialog {
    open: boolean;
    stepName: string;
    limits: {
        [id: string]: string;
    };
    updateLimits: Function;
    toggleDialog: Function;
}
export declare const CellMetadataEditorDialog: React.FunctionComponent<ICellMetadataEditorDialog>;
export {};
