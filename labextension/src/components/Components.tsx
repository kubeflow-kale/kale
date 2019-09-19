import * as React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSyncAlt} from "@fortawesome/free-solid-svg-icons";

export class InputText extends React.Component<
    {
        label: string,
        placeholder: string,
        updateValue: Function,
        value: string
    },
    {
        focus: boolean
    }>
{
    state = {
        focus: false
    };
    render() {
        const onFocusClass = (this.state.focus) ? 'input-focus' : '';
        return (
            <div className="p-Widget input-container">
                <div className={"input-wrapper " + onFocusClass}>
                    <input placeholder={this.props.placeholder}
                           value={this.props.value}
                           onChange={evt => this.props.updateValue((evt.target as HTMLInputElement).value)}
                           onFocus={_ => this.setState({focus: !this.state.focus})}
                           onBlur={_ => this.setState({focus: !this.state.focus})}
                    />
                </div>
            </div>
        )
    }
}

export class InputArea extends React.Component<
    {
        label: string,
        placeholder: string,
        updateValue: Function,
        value: string
    },
    {
        focus: boolean
    }>
{
     state = {
        focus: false
    };
    render() {
        const onFocusClass = (this.state.focus) ? 'input-focus' : '';
        return (
            <div className="p-Widget input-container">
                <div className={"input-wrapper " + onFocusClass}>
                    <textarea rows={4} cols={50} placeholder={this.props.placeholder} value={this.props.value}
                              onChange={evt => this.props.updateValue((evt.target as HTMLTextAreaElement).value)}
                              onFocus={_ => this.setState({focus: !this.state.focus})}
                              onBlur={_ => this.setState({focus: !this.state.focus})}
                    />
                </div>
            </div>
        )
    }
}

export class DeployButton extends React.Component<
    {
        callback: Function,
        deployment: boolean
    },
    any>
{

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

export class SelectBox extends React.Component<
    {
        label: string,
        updateValue: Function,
        value: string[],
        values: string[]
    },
    any>
{
    render() {
        return (
            <div className='p-Widget jp-KeySelector'>
            <label>
                { this.props.label }
                <div className="jp-select-wrapper">
                    <select multiple={true}
                           className="jp-mod-styled"
                           value={this.props.value}
                           onChange={evt => this.props.updateValue((evt.target as HTMLSelectElement).value)}>
                        { this.props.values.map(value => <option key={value} value={value}>{value}</option>) }
                    </select>
                </div>
            </label>
            </div>
        )
    }
}

export class CollapsablePanel extends React.Component<
    {
        title: string
    },
    {
        collapsed: boolean
    }>
{
    state = {
        collapsed: true
    };

    render() {

        let wrapper_class = '';
        let content_class = 'p-mod-hidden';
        if (!this.state.collapsed) {
            wrapper_class = 'jp-Collapse-open';
            content_class = '';
        }
        return (
            <div className={'p-Widget jp-Collapse' + wrapper_class}>
                <div
                    className='p-Widget jp-Collapse-header'
                    onClick={_ => this.setState({collapsed: !this.state.collapsed})}
                >{this.props.title}</div>
                <div className={'p-Widget p-Panel jp-Collapse-contents ' + content_class}>
                    <InputText label={"Docker image"} placeholder={"Image name"} updateValue={() => {}} value={""}/>
                </div>
            </div>
        )
    }
}
