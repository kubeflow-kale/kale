import * as React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSyncAlt} from "@fortawesome/free-solid-svg-icons";

export class InputText extends React.Component<{ label: string, placeholder: string, updateValue: Function, value: string }, any> {
    render() {
        return (
            <div className="input-container">
                <div className="input-wrapper">
                    <input placeholder={this.props.placeholder}
                           value={this.props.value}
                           onChange={evt => this.props.updateValue((evt.target as HTMLInputElement).value)}
                    />
                </div>
            </div>
        )
    }
}

export class InputArea extends React.Component<{ label: string, placeholder: string, updateValue: Function, value: string }, any> {
    render() {
        return (
            <div className="input-container">
                <div className="input-wrapper">
                    <textarea rows={4} cols={50} placeholder={this.props.placeholder} value={this.props.value}
                              onChange={evt => this.props.updateValue((evt.target as HTMLTextAreaElement).value)}/>
                </div>
            </div>
        )
    }
}

export class DeployButton extends React.Component<{ callback: Function, deployment: boolean }, any> {

    render() {
        const buttonText = this.props.deployment ? "Running Deployment..." : "Deploy Notebook to Kubeflow Pipelines";

        return (
            <div className="deploy-button">
                <button onClick={() => {
                    this.props.callback()
                }}>
                    {this.props.deployment ?
                        <FontAwesomeIcon icon={faSyncAlt} spin style={{marginRight: "5px"}}/> : null}
                    <span>{buttonText}</span>
                </button>
            </div>
        )
    }
}

export class SelectBox extends React.Component<{ label: string, updateValue: Function, values: string[] }, any> {
    render() {
        return (
            <div className="input-container">
                <div className="input-wrapper">
                    <select
                           value={this.props.values[0]}
                           onChange={evt => this.props.updateValue((evt.target as HTMLSelectElement).value)}>
                        { this.props.values.map(value => <option key={value} value={value} />) }
                    </select>
                </div>
            </div>
        )
    }
}
