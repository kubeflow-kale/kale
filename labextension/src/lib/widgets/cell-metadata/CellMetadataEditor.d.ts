import * as React from 'react';
import { NotebookPanel } from '@jupyterlab/notebook';
export declare const RESERVED_CELL_NAMES: string[];
export declare const RESERVED_CELL_NAMES_HELP_TEXT: {
    [id: string]: string;
};
export declare const RESERVED_CELL_NAMES_CHIP_COLOR: {
    [id: string]: string;
};
export interface IProps {
    notebook: NotebookPanel;
    stepName?: string;
    stepDependencies: string[];
    limits?: {
        [id: string]: string;
    };
}
declare type BlockDependencyChoice = {
    value: string;
    color: string;
};
interface IState {
    previousStepName?: string;
    stepNameErrorMsg?: string;
    blockDependenciesChoices?: BlockDependencyChoice[];
    cellMetadataEditorDialog?: boolean;
}
/**
 * Component that allow to edit the Kale cell tags of a notebook cell.
 */
export declare class CellMetadataEditor extends React.Component<IProps, IState> {
    static contextType: React.Context<{
        isEditorVisible: boolean;
        activeCellIndex: number;
        onEditorVisibilityChange: (isEditorVisible: boolean) => void;
    }>;
    editorRef: React.RefObject<HTMLDivElement>;
    constructor(props: IProps);
    componentWillUnmount(): void;
    updateCurrentCellType: (value: string) => void;
    isEqual(a: any, b: any): boolean;
    /**
     * When the activeCellIndex of the editor changes, the editor needs to be
     * moved to the correct position.
     */
    moveEditor(): void;
    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>): void;
    hideEditorIfNotCodeCell(): void;
    /**
     * Scan the notebook for all block tags and get them all, excluded the current
     * one (and the reserved cell tags) The value `previousBlockChoices` is used
     * by the dependencies select option to select the current step's
     * dependencies.
     */
    updateBlockDependenciesChoices(state: Readonly<IState>, props: Readonly<IProps>): IState;
    updatePreviousStepName(state: Readonly<IState>, props: Readonly<IProps>): IState;
    updateCurrentBlockName: (value: string) => void;
    /**
     * Even handler of the MultiSelect used to select the dependencies of a block
     */
    updatePrevBlocksNames: (previousBlocks: string[]) => void;
    /**
     * Event triggered when the the CellMetadataEditorDialog dialog is closed
     */
    updateCurrentLimits: (actions: {
        action: "update" | "delete";
        limitKey: string;
        limitValue?: string;
    }[]) => void;
    /**
     * Function called before updating the value of the block name input text
     * field. It acts as a validator.
     */
    onBeforeUpdate: (value: string) => boolean;
    getPrevStepNotice: () => string;
    /**
     * Event handler of close button, positioned on the top right of the cell
     */
    closeEditor(): void;
    toggleTagsEditorDialog(): void;
    render(): JSX.Element;
}
export {};
