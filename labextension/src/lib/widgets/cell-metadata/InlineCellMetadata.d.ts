import * as React from 'react';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IObservableList, IObservableUndoableList } from '@jupyterlab/observables';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { IProps as EditorProps } from './CellMetadataEditor';
interface IProps {
    notebook: NotebookPanel;
    onMetadataEnable: (isEnabled: boolean) => void;
}
declare type Editors = {
    [index: string]: EditorProps;
};
interface IState {
    activeCellIndex: number;
    prevBlockName?: string;
    metadataCmp?: JSX.Element[];
    checked?: boolean;
    editors?: Editors;
    isEditorVisible: boolean;
}
export declare class InlineCellsMetadata extends React.Component<IProps, IState> {
    state: IState;
    constructor(props: IProps);
    componentDidMount: () => void;
    componentDidUpdate: (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => Promise<void>;
    connectAndInitWhenReady: (notebook: NotebookPanel) => void;
    connectHandlersToNotebook: (notebook: NotebookPanel) => void;
    disconnectHandlersFromNotebook: (notebook: NotebookPanel) => void;
    onActiveCellChanged: (notebook: Notebook, activeCell: Cell) => void;
    handleSaveState: (context: DocumentRegistry.Context, state: DocumentRegistry.SaveState) => void;
    handleCellChange: (cells: IObservableUndoableList<ICellModel>, args: IObservableList.IChangedArgs<ICellModel>) => void;
    /**
     * Event handler for the global Kale switch (the one below the Kale title in
     * the left panel). Enabling the switch propagates to the father component
     * (LeftPanel) to enable the rest of the UI.
     */
    toggleGlobalKaleSwitch(checked: boolean): void;
    refreshEditorsPropsAndInlineMetadata(): void;
    clearEditorsPropsAndInlineMetadata: (callback?: () => void) => void;
    generateEditorsPropsAndInlineMetadata: () => void;
    /**
     * Callback passed to the CellMetadataEditor context
     */
    onEditorVisibilityChange(isEditorVisible: boolean): void;
    render(): JSX.Element;
}
export {};
