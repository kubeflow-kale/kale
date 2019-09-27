import * as React from "react";
import {Notebook, NotebookPanel} from "@jupyterlab/notebook";
import {InputText} from "./Components";
import CellUtils from "../utils/CellUtils";
import {ICellModel, Cell, isCodeCellModel} from "@jupyterlab/cells";
import Select from "react-select";
import Switch from "react-switch";

const KUBEFLOW_CELL_METADATA_KEY = 'kubeflow_cell';

interface IProps {
    notebook: NotebookPanel;
    activeCell: Cell;
    activeCellIndex: number;
    valid: Function;
}
 
interface IState {
    show: boolean;
    currentActiveCellMetadata: IKaleCellMetadata;
    allBlocks?: string[];
    prevBlockName?: string;
    skipCell: boolean
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
    currentActiveCellMetadata: DefaultCellMetadata,
    prevBlockName: null,
    skipCell: true
};

export class CellTags extends React.Component<IProps, IState> {
    // TODO: Add function in constructor that initiates to the current active cell
    //   (when notebook opened - or on focus event)

    // TODO: Add listener to cell type changed to hide/show panel when a cell changes type

    // init state default values
    state = DefaultState;

    handleChangeSkipCell = () => {this.setState({ skipCell: !this.state.skipCell})};

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
            this.props.activeCell.model.contentChanged.connect(this.listenCellContentChanged);

            // if the active cell is not of type `code`, then hide panel
            if (!isCodeCellModel(this.props.activeCell.model)) {
                this.setState({show: false});
                return
            }
            this.readAndShowMetadata();
        }

        if (prevState.skipCell !== this.state.skipCell) {
            if (this.state.skipCell) {
                // set the currentBlockName and the list of PrevBlocksNames to `skip` and []
                const prevs: string[] = [];
                let currentCellMetadata = {...this.state.currentActiveCellMetadata, blockName: 'skip', prevBlockNames: prevs};
                this.setState({currentActiveCellMetadata: currentCellMetadata});
                this.setKaleCellTags(
                    this.props.notebook,
                    this.props.activeCellIndex,
                    KUBEFLOW_CELL_METADATA_KEY,
                    currentCellMetadata,
                    true
                )
            } else {
                await this.updateCurrentBlockName('');
                this.readAndShowMetadata()
            }
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
            let skip = !!(cellMetadata.blockName && cellMetadata.blockName === 'skip');
            this.setState({
                show: true,
                allBlocks: allBlocks,
                prevBlockName: prevBlockName,
                skipCell: skip,
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
                skipCell: false,
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
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, blockName: value};
        await this.setState({currentActiveCellMetadata: currentCellMetadata});
        this.setKaleCellTags(
            this.props.notebook,
            this.props.activeCellIndex,
            KUBEFLOW_CELL_METADATA_KEY,
            currentCellMetadata,
            true
        )
    };

    updatePrevBlocksNames = async (newvaule: any) => {
        let prevNames = [];
        if (newvaule) {
            prevNames = newvaule.map((v: any) => v.label);
        }
        let currentCellMetadata = {...this.state.currentActiveCellMetadata, prevBlockNames: prevNames};
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

    render() {
        const headerName = 'Cell Tags';

        // if the active cell is not of type `code`
        if (!this.state.show) {
            return (<div>
                <div>
                    <p className="kale-header">{headerName}</p>
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

        const switchHeader =
            <div className={"kale-header-switch"} style={{paddingTop: "20px"}}>
                    <div className="kale-header" style={{paddingTop: "0"}}>
                        {headerName}
                    </div>
                    <div className={"skip-switch-container"}>
                        <label className={"skip-switch-label"}>Hide cell</label>
                        <Switch
                            checked={this.state.skipCell}
                            onChange={this.handleChangeSkipCell}
                            onColor="#599EF0"
                            onHandleColor="#477EF0"
                            handleDiameter={18}
                            uncheckedIcon={false}
                            checkedIcon={false}
                            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                            activeBoxShadow="0px 0px 1px 7px rgba(0, 0, 0, 0.2)"
                            height={10}
                            width={20}
                            className="skip-switch"
                            id="skip-switch"
                        />
                    </div>
                </div>;

        if (this.state.skipCell) {
            return (
                <div>
                    {switchHeader}
                    <div className="input-container">
                        <div className="skip-cell-info-text">
                            This cell will be skipped and excluded from pipeline steps
                        </div>
                    </div>
                </div>
            )
        }

        const prevBlockNotice = (this.state.prevBlockName && this.state.currentActiveCellMetadata.blockName === '')
            ? <div className={"prev-blockname-container"}>Leave block name empty to merge code to block <em>{this.state.prevBlockName}</em></div>
            : null;
        const selectOptions: any = this.state.allBlocks.map((v, key) => {return {label: v, value: v}});
        const values: any = this.state.currentActiveCellMetadata.prevBlockNames.map((v, key) => {return {label: v, value: v}});
        return (
            <div>
                {switchHeader}

                <InputText
                    label={"Block Name"}
                    placeholder={"Block Name"}
                    updateValue={this.updateCurrentBlockName}
                    value={this.state.currentActiveCellMetadata.blockName}
                    regex={"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"}
                    regexErrorMsg={"Block name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character."}
                    valid={this.props.valid}
                />

                {prevBlockNotice}

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