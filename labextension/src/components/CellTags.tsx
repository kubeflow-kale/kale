import * as React from "react";
import {Notebook, NotebookPanel} from "@jupyterlab/notebook";
import {InputText} from "./Components";
import CellUtils from "../utils/CellUtils";
import {ICellModel, Cell, isCodeCellModel} from "@jupyterlab/cells";
import Select from "react-select";

const KUBEFLOW_CELL_METADATA_KEY = 'kubeflow_cell';

interface IProps {
    notebook: NotebookPanel;
    activeCell: Cell;
    activeCellIndex: number;
}
 
interface IState {
    show: boolean
    currentActiveCellMetadata: IKaleCellMetadata;
    allBlocks?: string[];
}

interface IKaleCellMetadata {
    blockName: string;
    prevBlockNames: string[]
}

const DefaultCellMetadata: IKaleCellMetadata = {
    blockName: '',
    prevBlockNames: []
};

const DefaultState: IState = {
    show: false,
    allBlocks: [],
    currentActiveCellMetadata: DefaultCellMetadata
};

export class CellTags extends React.Component<IProps, IState> {
    // TODO: Add function in constructor that initiates to the current active cell
    //   (when notebook opened - or on focus event)

    // TODO: Add listener to cell type changed to hide/show panel when a cell changes type

    // init state default values
    state = DefaultState;

    componentDidMount = () => {
        if (this.props.activeCell) {
            if (isCodeCellModel(this.props.activeCell.model)) {
                this.readAndShowMetadata();
            }
        }
    };

    componentDidUpdate = (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => {
        if (prevProps.activeCellIndex !== this.props.activeCellIndex) {
            // if the active cell is not of type `code`, then hide panel
            // listen to cell type changes
            if (prevProps.activeCell) {
                prevProps.activeCell.model.contentChanged.disconnect(this.listenCellContentChanged)
            }
            this.props.activeCell.model.contentChanged.connect(this.listenCellContentChanged);

            if (!isCodeCellModel(this.props.activeCell.model)) {
                this.setState({show: false});
                return
            }
            this.readAndShowMetadata();
        }
    };

    readAndShowMetadata = () => {
        // 1. Read metadata from the active cell
        const cellMetadata = CellUtils.getCellMetaData(
            this.props.notebook.content,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY);

        // 2. Get all blocks currently defined in the notebook
        // TODO: This could be run on parent component when new notebook is opened and passed as property.
        //  Then kept updated as metadata change
        const allBlocks = this.getAllBlocks(this.props.notebook.content);

        if (cellMetadata) {
            this.setState({
                show: true,
                allBlocks: allBlocks,
                currentActiveCellMetadata: {
                    blockName: cellMetadata.blockName || '',
                    prevBlockNames: cellMetadata.prevBlockNames || []
                }
            })
        } else {
            this.setState({
                show: true,
                allBlocks: allBlocks,
                currentActiveCellMetadata: DefaultCellMetadata,
            })
        }
    };

    listenCellContentChanged = (model: ICellModel) => {
        console.log("listenCellContentChanged activated");
        console.log(model)
    };

    getAllBlocks = (notebook: Notebook): string[] => {
        let blocks = new Set<string>();
        for (const idx of Array(notebook.model.cells.length).keys()) {
            let mt = CellUtils.getCellMetaData(notebook, idx, KUBEFLOW_CELL_METADATA_KEY);
            if (mt && mt.BlockName && mt.BlockName !== '') {
                blocks.add(mt.BlockName);
            }
        }
        return Array.from(blocks)
    };

    updateCurrentBlockName = (value: string) => {
        console.log("BlockName " + value);
        this.setState({currentActiveCellMetadata: {...this.state.currentActiveCellMetadata, blockName: value}});
        CellUtils.setCellMetaData(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            this.state.currentActiveCellMetadata,
            true
        )
    };

    updatePrevBlocksNames = (value: any) => {
        console.log("PrevBlocks " + value);
        this.setState({currentActiveCellMetadata: {...this.state.currentActiveCellMetadata, prevBlockNames: value}});
        CellUtils.setCellMetaData(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            this.state.currentActiveCellMetadata,
            true
        )
    };

    render() {
        // if the active cell is not of type `code`
        if (!this.state.show) {
            return null
        }
        return (
            <div>
                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header kale-headers">Cell Tags</p>
                </div>

                <InputText
                    label={"Block Name"}
                    placeholder={"Block Name"}
                    updateValue={this.updateCurrentBlockName}
                    value={this.state.currentActiveCellMetadata.blockName}
                />

                <div className='input-container'>
                    <label>Select previous blocks</label>
                     <Select
                        isMulti
                        className='react-select-container'
                        classNamePrefix='react-select'
                        value={this.state.currentActiveCellMetadata.prevBlockNames}
                        onChange={this.updatePrevBlocksNames}
                        options={this.state.allBlocks}
                        theme={theme => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                neutral0: 'var(--jp-input-active-background)',
                                neutral10: 'var(--md-red-100)',
                                neutral20: 'var(--jp-input-border-color)',
                                primary: 'var(--jp-input-active-border-color)',
                                primary25: 'var(--jp-layout-color3)',
                                neutral80: 'var(--jp-ui-font-color0)'

                            },
                        })}
                    />
                </div>

            </div>
        )
    }
}