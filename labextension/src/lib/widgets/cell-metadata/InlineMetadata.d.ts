import * as React from 'react';
interface IProps {
    blockName: string;
    previousBlockName: string;
    stepDependencies: string[];
    limits: {
        [id: string]: string;
    };
    cellElement: any;
    cellIndex: number;
}
interface IState {
    cellTypeClass: string;
    color: string;
    dependencies: any[];
    showEditor: boolean;
    isMergedCell: boolean;
}
/**
 * This component is used by InlineCellMetadata to display some state information
 * on top of each cell that is tagged with Kale tags.
 *
 * When a cell is tagged with a step name and some dependencies, a chip with the
 * step name and a series of coloured dots for its dependencies are show.
 */
export declare class InlineMetadata extends React.Component<IProps, IState> {
    static contextType: React.Context<{
        isEditorVisible: boolean;
        activeCellIndex: number;
        onEditorVisibilityChange: (isEditorVisible: boolean) => void;
    }>;
    wrapperRef: React.RefObject<HTMLDivElement>;
    state: IState;
    constructor(props: IProps);
    componentDidMount(): void;
    moveComponentElementInCell(): void;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>): void;
    updateEditorState: (state: IState, props: IProps) => {
        showEditor: boolean;
    };
    updateIsMergedState: (state: IState, props: IProps) => {
        isMergedCell: boolean;
    };
    /**
     * Check if the block tag of che current cell has a reserved name. If so,
     * apply the corresponding css class to the HTML Cell element.
     */
    checkIfReservedName(): void;
    /**
     * Update the style of the active cell, by changing the left border with
     * the correct color, based on the current block name.
     */
    updateStyles(): void;
    getColorFromName(name: string): string;
    createLimitsText(): "" | JSX.Element;
    /**
     * Create a list of div dots that represent the dependencies of the current
     * block
     */
    updateDependencies(): void;
    openEditor(): void;
    render(): JSX.Element;
}
export {};
