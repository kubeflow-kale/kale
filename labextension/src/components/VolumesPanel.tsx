import * as React from "react";

interface IProps {
    volumes: string[],
    addVolume: Function,
    updateVolume: Function,
    deleteVolume: Function
}

export class VolumesPanel extends React.Component<IProps, any> {

    render() {
        let vols =
                <div className="jp-Widget jp-Toolbar toolbar">
                    <div className="p-Widget jp-Toolbar-item">
                        No volumes mounts defined
                    </div>
                </div>;
        if (this.props.volumes.length > 0) {
            vols =

                <div> {
                this.props.volumes.map((v, idx) =>
                <div className="jp-Widget jp-Toolbar toolbar">
                    <div className="p-Widget jp-Toolbar-item">
                        <div className="p-Widget input-container">
                            <div className="input-wrapper">
                                <input
                                    placeholder="pvcName;mountPoint"
                                    value={(v !== '') ? v : null}
                                    onChange={evt => this.props.updateVolume(idx, (evt.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-Widget jp-ToolbarButton jp-Toolbar-item">
                        <button type="button"
                                className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
                                title="Add Volume"
                                onClick={_ => this.props.deleteVolume(idx)}
                        >
                            <span className="bp3-button-text">
                                <span className="jp-CloseIcon jp-ToolbarButtonComponent-icon jp-Icon jp-Icon-16">
                                </span>
                            </span>
                        </button>
                    </div>
                </div>

            )}
                </div>
        }

        return (
            <div className="p-Widget jp-KeySelector">
                <div className="jp-Widget jp-Toolbar toolbar">
                    <div className="p-Widget jp-Toolbar-item">Volumes</div>
                    <div className="p-Widget jp-ToolbarButton jp-Toolbar-item">
                        <button type="button"
                                className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
                                title="Add Volume"
                                onClick={_ => this.props.addVolume('')}
                        >
                            <span className="bp3-button-text">
                                <span className="jp-AddIcon jp-ToolbarButtonComponent-icon jp-Icon jp-Icon-16">
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
                {vols}
            </div>
        )

    }

}