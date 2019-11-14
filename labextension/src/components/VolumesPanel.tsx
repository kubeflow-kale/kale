import * as React from "react";
import {Button} from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import {AnnotationInput, MaterialInput, MaterialSelect} from "./Components";
import {IVolumeMetadata} from "./LeftPanelWidget";
import Switch from "react-switch";

interface IProps {
    volumes: IVolumeMetadata[],
    addVolume: Function,
    deleteVolume: Function,
    updateVolumeType: Function,
    updateVolumeName: Function,
    updateVolumeMountPoint: Function,
    updateVolumeSnapshot: Function,
    updateVolumeSnapshotName: Function,
    updateVolumeSize: Function,
    updateVolumeSizeType:Function,
    updateVolumeAnnotation: Function,
    addAnnotation: Function,
    deleteAnnotation: Function,
    notebookMountPoints: {label: string, value: string}[],
    selectVolumeSizeTypes: {label: string, value: string, base: number}[],
    selectVolumeTypes: {label: string, value: string}[],
    useNotebookVolumes: boolean,
    updateVolumesSwitch: Function,
    autosnapshot: boolean,
    updateAutosnapshotSwitch: Function,
}

export class VolumesPanel extends React.Component<IProps, any> {

    render() {

        let vols =
                <div className="toolbar">
                    <div className="input-container">
                        No volumes mounts defined
                    </div>
                </div>;

        if (this.props.volumes.length > 0) {
            vols =
                <div> {
                this.props.volumes.map((v, idx) => {
                    const nameLabel = this.props.selectVolumeTypes.filter((d) => {return (d.value === v.type)})[0].label;

                    const mountPointPicker = (v.type === 'clone') ?
                        <div>
                            <MaterialSelect
                                label={"Select from currently mounted points"}
                                index={idx}
                                updateValue={this.props.updateVolumeMountPoint}
                                values={this.props.notebookMountPoints}
                                value={v.mount_point}
                            />
                        </div>:
                        <div>
                            <MaterialInput
                                label={"Mount Point"}
                                inputIndex={idx}
                                updateValue={this.props.updateVolumeMountPoint}
                                value={v.mount_point}
                            />
                        </div>
                        ;
                    const sizePicker = (v.type === 'pvc') ?
                        null:
                        <div className='toolbar'>
                            <div style={{marginRight: "10px", width: "50%"}}>
                                <MaterialInput
                                    updateValue={this.props.updateVolumeSize}
                                    value={v.size}
                                    label={'Volume size'}
                                    inputIndex={idx}
                                    numeric
                                />
                            </div>
                            <div style={{width: "50%"}}>
                                <MaterialSelect
                                    updateValue={this.props.updateVolumeSizeType}
                                    values={this.props.selectVolumeSizeTypes}
                                    value={v.size_type}
                                    label={"Type"}
                                    index={idx}/>
                            </div>
                        </div>;

                    const annotationField = (v.type === 'pv' || v.type === 'new_pvc' || v.type === 'snap') ?
                        <div>
                            <div className={"kale-header-switch"} style={{padding: "0px 10px"}}>
                                <div className="kale-header" style={{padding: "0", letterSpacing: ".3px", textTransform: "capitalize"}}>
                                    Annotations
                                </div>
                            </div>

                            {(v.annotations && v.annotations.length > 0) ?
                                v.annotations.map((a, a_idx) => {
                                    return (<div key={`vol-${idx}-annotation-${a_idx}`}>
                                        <AnnotationInput
                                            label={"Annotation"}
                                            volumeIdx={idx}
                                            annotationIdx={a_idx}
                                            updateValue={this.props.updateVolumeAnnotation}
                                            deleteValue={this.props.deleteAnnotation}
                                            annotation={a}
                                            cannotBeDeleted={(v.type === 'snap' && a_idx === 0)}
                                        />
                                    </div>)
                                })
                            : null}

                            <div className="add-button">
                                <Button
                                    variant="contained"
                                    size="small"
                                    title="Add Annotation"
                                    onClick={_ => this.props.addAnnotation(idx)}
                                    style={{transform: 'scale(0.7)'}}
                                >
                                    <AddIcon />
                                    Add Annotation
                                </Button>
                            </div>

                        </div>: null;

                    return (
                    <div className="input-container volume-container" key={`v-${idx}`}>
                        <div className="toolbar">
                            <MaterialSelect
                                updateValue={this.props.updateVolumeType}
                                values={this.props.selectVolumeTypes}
                                value={v.type}
                                label={"Select Volume Type"}
                                index={idx}/>
                            <div className="delete-button">
                                <Button
                                    variant="contained"
                                    size="small"
                                    title="Remove Volume"
                                    onClick={_ => this.props.deleteVolume(idx)}
                                >
                                    <DeleteIcon />
                                </Button>
                                {/* <button type="button"
                                        className="minimal-toolbar-button"
                                        title="Delete Volume"
                                        onClick={_ => this.props.deleteVolume(idx)}
                                >
                                    <span
                                        className="jp-CloseIcon jp-Icon jp-Icon-16"
                                        style={{padding: 0, flex: "0 0 auto", marginRight: 0}}/>
                                </button> */}
                            </div>
                        </div>

                        {mountPointPicker}

                        <MaterialInput
                            label={nameLabel + " Name"}
                            inputIndex={idx}
                            updateValue={this.props.updateVolumeName}
                            value={v.name}
                            regex={"^([\\.\\-a-z0-9]+)$"}
                            regexErrorMsg={"Resource name must consist of lower case alphanumeric characters, -, and ."}
                        />

                        {sizePicker}

                        {annotationField}

                        <div className="toolbar" style={{padding: "12px 4px 0 4px"}}>
                            <div className={"switch-label"}>Snapshot Volume</div>
                            <Switch
                                checked={v.snapshot}
                                onChange={_ => this.props.updateVolumeSnapshot(idx)}
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

                        {(v.snapshot)?
                            <MaterialInput
                                label={"Snapshot Name"}
                                // key={idx}
                                inputIndex={idx}
                                updateValue={this.props.updateVolumeSnapshotName}
                                value={v.snapshot_name}
                                regex={"^([\\.\\-a-z0-9]+)$"}
                                regexErrorMsg={"Resource name must consist of lower case alphanumeric characters, -, and ."}/>
                            : null}
                    </div>
                    )
                }

            )}
            </div>
        }
        const addButton =
            <div className="add-button">
                <Button
                    variant="contained"
                    size="small"
                    title="Add Volume"
                    onClick={_ => this.props.addVolume()}
                    style={{marginLeft: "10px"}}
                >
                    <AddIcon />
                    Add Volume
                </Button>
            </div>;
        const useNotebookVolumesSwitch =
            <div className='toolbar input-container'>
                <div className='switch-label'>Use this notebook's volumes</div>
                <Switch
                    checked={this.props.useNotebookVolumes}
                    disabled={this.props.notebookMountPoints.length === 0}
                    onChange={_ => this.props.updateVolumesSwitch()}
                    onColor='#599EF0'
                    onHandleColor='#477EF0'
                    handleDiameter={18}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow='0px 1px 5px rgba(0, 0, 0, 0.6)'
                    activeBoxShadow='0px 0px 1px 7px rgba(0, 0, 0, 0.2)'
                    height={10}
                    width={20}
                    className='skip-switch'
                    id='nb-volumes-switch'
                />
            </div>;
        const autoSnapshotSwitch =
            <div className='toolbar input-container'>
                <div className='switch-label'>Take Rok snapshots before each step</div>
                <Switch
                    checked={this.props.autosnapshot}
                    disabled={this.props.volumes.length === 0}
                    onChange={_ => this.props.updateAutosnapshotSwitch()}
                    onColor='#599EF0'
                    onHandleColor='#477EF0'
                    handleDiameter={18}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow='0px 1px 5px rgba(0, 0, 0, 0.6)'
                    activeBoxShadow='0px 0px 1px 7px rgba(0, 0, 0, 0.2)'
                    height={10}
                    width={20}
                    className='skip-switch'
                    id='autosnapshot-switch'
                />
            </div>;

        return (
            <div className="kale-component" key="kale-component-volumes">
                <div className="kale-header-switch">
                    <p className="kale-header">
                        Volumes
                    </p>
                </div>
                {useNotebookVolumesSwitch}
                {autoSnapshotSwitch}
                {this.props.notebookMountPoints.length > 0 && this.props.useNotebookVolumes ? null : vols}
                {this.props.notebookMountPoints.length > 0 && this.props.useNotebookVolumes ? null : addButton}
            </div>
        )

    }

}