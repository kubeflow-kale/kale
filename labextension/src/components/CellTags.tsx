import * as React from "react";
import {Notebook, NotebookPanel} from "@jupyterlab/notebook";
import {MaterialInput, MaterialSelect, MaterialSelectMulti} from "./Components";
import CellUtils from "../utils/CellUtils";
import {ICellModel, Cell, isCodeCellModel} from "@jupyterlab/cells";

const KUBEFLOW_CELL_METADATA_KEY = 'kubeflow_cell';

const CELL_TYPES = [
    { value: 'imports', label: 'Imports' },
    { value: 'functions', label: 'Functions' },
    { value: 'pipeline-parameters', label: 'Pipeline Parameters' },
    { value: 'step', label: 'Pipeline Step' },
    { value: 'skip', label: 'Skip Cell' }
];

const RESERVED_CELL_NAMES = ['imports', 'functions', 'pipeline-parameters', 'skip'];
const RESERVED_CELL_NAMES_HELP_TEXT :{ [id: string] : string; } = {
    "imports": "The code in this cell will be pre-pended to every step of the pipeline.",
    "functions": "The code in this cell will be pre-pended to every step of the pipeline, after `imports`.",
    "pipeline-parameters": "The variables in this cell will be transformed into pipeline parameters, preserving the current values as defaults.",
    "skip": "This cell will be skipped and excluded from pipeline steps"
};

interface IProps {
    notebook: NotebookPanel;
    activeCell: Cell;
    activeCellIndex: number;
}
 
interface IState {
    show: boolean;
    currentActiveCellMetadata: IKaleCellMetadata;
    allBlocks?: string[];
    prevBlockName?: string;
}

interface IKaleCellMetadata {
    blockName: string;
    prevBlockNames?: string[]
}

const DefaultCellMetadata: IKaleCellMetadata = {
    blockName: '',
    prevBlockNames: []
};

const DefaultState: IState = {
    show: false,
    allBlocks: [],
    currentActiveCellMetadata: DefaultCellMetadata,
    prevBlockName: null,
};

export class CellTags extends React.Component<IProps, IState> {
    // TODO: Add function in constructor that initiates to the current active cell
    //   (when notebook opened - or on focus event)

    // TODO: Add listener to cell type changed to hide/show panel when a cell changes type

    // init state default values
    state = DefaultState;

    updateCurrentCellType = async (value: string) => {
        if (RESERVED_CELL_NAMES.includes(value)) {
            await this.updateCurrentBlockName(value)
        } else {
            await this.updateCurrentBlockName('');
            await this.updatePrevBlocksNames([]);
            await this.setState({prevBlockName: this.getPreviousBlock(this.props.notebook.content, this.props.activeCellIndex)})
        }
    };

    componentDidMount = () => {
        if (this.props.activeCell) {
            if (isCodeCellModel(this.props.activeCell.model)) {
                this.readAndShowMetadata();
            }
        }
    };

    componentDidUpdate = async (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => {
        if (prevProps.activeCellIndex !== this.props.activeCellIndex) {
            // listen to cell type changes
            if (prevProps.activeCell) {
                prevProps.activeCell.model.contentChanged.disconnect(this.listenCellContentChanged)
            }
            // TODO: Listen to cell type change (code, markdown, raw)
            //   - stateChanged signal: That is fired only in a few specific circumstances,
            //  like when the trusted or readonly state changes
            //   - contentChange: this is wat we *would* expect to work EXCEPT in this instance.
            //      This is because they internally implement changing a cell type by removing the
            //      old cell and inserting a new one with the same text content.
            //      So you can’t listen to change signals on the old one as it is not really the same cell.
            //  Possible solution:
            //    1. Listen to the model.cells.changed signal.
            //    2. If a cell is deleted, cache the text content and type of the cell.
            //    3. If a cell is subsequently inserted, check to see if it is a new cell
            //       type with the same text content. That is your changed cell.
            //    4. If there is any other action, clear the cache.
            this.props.activeCell.model.contentChanged.connect(this.listenCellContentChanged);

            // if the active cell is not of type `code`, then hide panel
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
        const prevBlockName = this.getPreviousBlock(this.props.notebook.content, this.props.activeCellIndex);

        if (cellMetadata) {
            this.setState({
                show: true,
                allBlocks: allBlocks,
                prevBlockName: prevBlockName,
                currentActiveCellMetadata: {
                    blockName: cellMetadata.blockName || '',
                    prevBlockNames: cellMetadata.prevBlockNames || []
                }
            })
        } else {
            this.setState({
                show: true,
                allBlocks: allBlocks,
                prevBlockName: prevBlockName,
                currentActiveCellMetadata: DefaultCellMetadata,
            })
        }
    };

    listenCellContentChanged = (model: ICellModel) => {
        // console.log("listenCellContentChanged activated");
        // console.log(model)
    };

    getPreviousBlock = (notebook: Notebook, current: number): string => {
        for (let i = current - 1; i >= 0; i--) {
            let mt = this.getKaleCellTags(notebook, i, KUBEFLOW_CELL_METADATA_KEY);
            if (mt && mt.blockName && mt.blockName !== 'skip' && mt.blockName !== "") {
                return mt.blockName
            }
        }
        return null
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

    updateCurrentBlockName = async (value: string) => {
        const oldBlockName: string = this.state.currentActiveCellMetadata.blockName;
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, blockName: value};
        await this.setState({currentActiveCellMetadata: currentCellMetadata});
        this.setKaleCellTags(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            currentCellMetadata,
            true
        );
        this.updateKaleCellTags(
            this.props.notebook,
            oldBlockName,
            value
        );
    };

    updatePrevBlocksNames = async (previousBlocks: string[]) => {
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, prevBlockNames: previousBlocks};
        await this.setState({currentActiveCellMetadata: currentCellMetadata});
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
            let b_name = tags.map(v => {
                if (RESERVED_CELL_NAMES.includes(v)) {
                    return v
                }
                if (v.startsWith('block:')) {
                    return v.replace("block:", "")
                }
            });

            let prevs = tags.filter(v => {return v.startsWith('prev:')})
                .map(v => {return v.replace("prev:", '')});
            return {
                blockName: b_name[0],
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
        // not a reserved name
        if (!RESERVED_CELL_NAMES.includes(value.blockName)) {
            nb = 'block:' + nb
        }
        console.log('set kale cell tags');
        console.log(nb);
        const tags = [nb].concat(value.prevBlockNames.map(v => 'prev:' + v));
        console.log(tags);
        CellUtils.setCellMetaData(
            notebookPanel,
            index,
            'tags',
            tags,
            save
        )
    };

    updateKaleCellTags = (
        notebookPanel: NotebookPanel,
        oldBlockName: string,
        newBlockName: string,
        save: boolean = true) => {
        let i: number;
        for(i = 0; i < notebookPanel.model.cells.length; i++) {
            const tags: string[] = CellUtils.getCellMetaData(
                notebookPanel.content,
                i,
                'tags'
            );
            let newTags: string[] = (tags || []).map(t => {
                if (t === 'prev:' + oldBlockName) {
                    return RESERVED_CELL_NAMES.includes(newBlockName) ? '' : 'prev:' + newBlockName;
                } else {
                    return t;
                }
            }).filter(t => t !== '' && t !== 'prev:');
            CellUtils.setCellMetaData(
                notebookPanel,
                i,
                'tags',
                newTags,
                save
            )
        }
    };

    render() {
        const headerName = 'Cell Metadata';
        const headerBlock = <p className="kale-header">{ headerName }</p>;
        const previousBlockChoices = this.state.allBlocks.filter(
                ( el ) => !RESERVED_CELL_NAMES.includes( el ) &&
                !(el === this.state.currentActiveCellMetadata.blockName) );

        // if the active cell is not of type `code`
        if (!this.state.show) {
            return (
                <React.Fragment>
                    {headerBlock}
                    <div className="input-container">
                        No active code cell
                    </div>
                </React.Fragment>)
        }

        const cellType = (RESERVED_CELL_NAMES.includes(this.state.currentActiveCellMetadata.blockName))?
            this.state.currentActiveCellMetadata.blockName : "step";
        const cellTypeHelperText = RESERVED_CELL_NAMES_HELP_TEXT[this.state.currentActiveCellMetadata.blockName] || null;
        const cellTypeSelect =
            <MaterialSelect
                updateValue={this.updateCurrentCellType}
                values={CELL_TYPES}
                value={cellType}
                label={"Select Cell Type"}
                index={0}
                helperText={cellTypeHelperText}
            />;

        if (this.state.currentActiveCellMetadata.blockName === 'skip') {
            return (
                <React.Fragment>
                    {headerBlock}
                    <div className='input-container'>
                        { cellTypeSelect }
                    </div>
                </React.Fragment>)
        }

        const prevBlockNotice = (this.state.prevBlockName && this.state.currentActiveCellMetadata.blockName === '')
            ? "Leave step name empty to merge code to block " + this.state.prevBlockName
            : null;
        const stepCellInputs = (cellType === 'step') ?
            <React.Fragment>
                <MaterialInput
                    label={"Step Name"}
                    updateValue={this.updateCurrentBlockName}
                    value={this.state.currentActiveCellMetadata.blockName}
                    regex={"^([_a-z]([_a-z0-9]*)?)?$"}
                    regexErrorMsg={"Step name must consist of lower case alphanumeric characters or '_', and can not start with a digit."}
                    helperText={prevBlockNotice}
                />

                <MaterialSelectMulti
                    updateSelected={this.updatePrevBlocksNames}
                    options={previousBlockChoices}
                    selected={this.state.currentActiveCellMetadata.prevBlockNames}/>
            </React.Fragment> : null;

        return (
            <React.Fragment>
                { headerBlock }

                <div className='input-container'>

                    { cellTypeSelect }
                    { stepCellInputs }
                </div>
            </React.Fragment>
        )
    }
}