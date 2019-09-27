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
    valid: Function;
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
        const cellMetadata = this.getKaleCellTags(
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
        // console.log("listenCellContentChanged activated");
        // console.log(model)
    };

    // TODO: This is executing at every render.
    getAllBlocks = (notebook: Notebook): string[] => {
        let blocks = new Set<string>();
        for (const idx of Array(notebook.model.cells.length).keys()) {
            let mt = this.getKaleCellTags(notebook, idx, KUBEFLOW_CELL_METADATA_KEY);
            if (mt && mt.blockName && mt.blockName !== '') {
                blocks.add(mt.blockName);
            }
        }
        return Array.from(blocks)
    };

    updateCurrentBlockName = (value: string) => {
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, blockName: value};
        this.setState({currentActiveCellMetadata: currentCellMetadata});
        this.setKaleCellTags(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            currentCellMetadata,
            true
        )
    };

    updatePrevBlocksNames = (newvaule: any) => {
        let prevNames = [];
        if (newvaule) {
            prevNames = newvaule.map((v: any) => v.label);
        }
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, prevBlockNames: prevNames};
        this.setState({currentActiveCellMetadata: currentCellMetadata});
        this.setKaleCellTags(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            currentCellMetadata,
            true
        )
    };

    getKaleCellTags = (
        notebook: Notebook,
        index: number,
        key: string) => {
        const tags: string[] = CellUtils.getCellMetaData(
            notebook,
            index,
            'tags'
        );
        if (tags) {
            let b_names = tags.map(v => {
                if (v === 'functions' || v === 'imports' || v === 'skip') {
                    return v
                }
                if (v.startsWith('block:')) {
                    return v.replace("block:", "")
                }
            });

            let prevs = tags.filter(v => {return v.startsWith('prev:')})
                .map(v => {return v.replace("prev:", '')});
            return {
                blockName: b_names[0],
                prevBlockNames: prevs
            }
        }
        return null;
    };

    setKaleCellTags = (
        notebookPanel: NotebookPanel,
        index: number,
        key: string,
        value: IKaleCellMetadata,
        save: boolean) => {
        // make the dict to save to tags
        let nb = value.blockName;
        if (value.blockName !== 'imports' && value.blockName !== 'functions' && value.blockName !== 'skip') {
            nb = 'block:' + nb
        }
        const tags = [nb].concat(value.prevBlockNames.map(v => 'prev:' + v));
        CellUtils.setCellMetaData(
            notebookPanel,
            index,
            'tags',
            tags,
            save
        )
    };

    render() {
        // if the active cell is not of type `code`
        if (!this.state.show) {
            return (<div>
                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header kale-headers">Cell Tags</p>
                </div>

                <div className="jp-KeySelector">
                <div className="jp-Toolbar toolbar" style={{padding: 0, marginLeft: "10px"}}>
                    <div className="jp-Toolbar-item"  style={{fontSize: 'var(--jp-ui-font-size0)'}}>
                        No active code cell
                    </div>
                </div>
                </div>
            </div>)
        }

        const selectOptions: any = this.state.allBlocks.map((v, key) => {return {label: v, value: v}});
        const values: any = this.state.currentActiveCellMetadata.prevBlockNames.map((v, key) => {return {label: v, value: v}});
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
                    regex={"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"}
                    regexErrorMsg={"Block name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character."}
                    valid={this.props.valid}
                />

                <div className='input-container'>
                    <label>Select previous blocks</label>
                     <Select
                        isMulti
                        className='react-select-container'
                        classNamePrefix='react-select'
                        value={values}
                        onChange={this.updatePrevBlocksNames}
                        options={selectOptions}
                        theme={theme => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                neutral0: 'var(--jp-input-active-background)',
                                neutral10: 'var(--md-indigo-300)',
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