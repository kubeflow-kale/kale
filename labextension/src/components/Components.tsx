/*
 * Copyright 2019-2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  makeStyles,
  useTheme,
  createStyles,
  withStyles,
  Theme,
} from '@material-ui/core/styles';
import {
  MenuItem,
  Select,
  Button,
  Input as MaterialInput,
  Tooltip,
  Zoom,
  Switch,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import Chip from '@material-ui/core/Chip';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import { RokInput } from './RokInput';
import ColorUtils from './cell-metadata/ColorUtils';
import { Input } from './Input';

// https://codeburst.io/my-journey-to-make-styling-with-material-ui-right-6a44f7c68113
const useStyles = makeStyles(() =>
  createStyles({
    label: {
      color: 'var(--jp-input-border-color)',
      fontSize: 'var(--jp-ui-font-size2)',
    },
    input: {
      color: 'var(--jp-ui-font-color1)',
    },
    focused: {},
    // notchedOutline: {
    //     borderWidth: '1px',
    //     borderColor: 'var(--jp-input-border-color)',
    // },
    textField: {
      width: '100%',
    },
    menu: {
      backgroundColor: 'var(--jp-layout-color1)',
      color: 'var(--jp-ui-font-color1)',
    },
    helperLabel: {
      color: 'var(--jp-info-color0)',
    },
  }),
);

const useStylesSelectMulti = makeStyles(() =>
  createStyles({
    menu: {
      color: 'var(--jp-ui-font-color1)',
      fontSize: 'var(--jp-ui-font-size2)',
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {},
    multiSelectForm: {
      width: '100%',
    },
    label: {
      backgroundColor: 'var(--jp-layout-color1)',
      color: 'var(--jp-input-border-color)',
      fontSize: 'var(--jp-ui-font-size2)',
    },
    input: {
      fontSize: 'var(--jp-ui-font-size2)',
    },
  }),
);

const outlinedStyle = makeStyles(() =>
  createStyles({
    // root: {
    //     "& $notchedOutline": {
    //         borderWidth: '1px',
    //         borderColor: 'var(--jp-input-border-color)',
    //     },
    // },
    focused: {},
    // notchedOutline: {},
  }),
);

interface IMaterialSelectMultiple {
  updateSelected: Function;
  options: { value: string; color: string }[];
  selected: string[];
  variant?: 'filled' | 'standard' | 'outlined';
  disabled?: boolean;
  style?: any;
}
export const MaterialSelectMulti: React.FunctionComponent<IMaterialSelectMultiple> = props => {
  const classes = useStylesSelectMulti({});
  const outlined_classes = outlinedStyle({});
  const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
  const labelOffsetWidth = inputLabelRef
    ? (findDOMNode(inputLabelRef) as HTMLElement).offsetWidth
    : 0;

  let inputComponent = (
    <MaterialInput
      classes={outlined_classes}
      margin="dense"
      name="previous"
      id="select-previous-blocks"
    />
  );

  if (!props.variant || props.variant === 'outlined') {
    inputComponent = (
      <OutlinedInput
        classes={outlined_classes}
        margin="dense"
        labelWidth={labelOffsetWidth}
        name="previous"
        id="select-previous-blocks"
      />
    );
  }

  return (
    <FormControl
      variant={props.variant}
      margin="dense"
      disabled={props.disabled}
      className={classes.multiSelectForm}
      style={props.style || {}}
    >
      <InputLabel
        ref={ref => {
          setInputLabelRef(ref);
        }}
        htmlFor="select-previous-blocks"
        className={classes.label}
      >
        Depends on
      </InputLabel>
      <Select
        multiple
        MenuProps={{
          PaperProps: {
            className: classes.menu,
          },
        }}
        onChange={evt =>
          props.updateSelected((evt.target as HTMLInputElement).value)
        }
        margin="dense"
        variant={props.variant}
        input={inputComponent}
        value={props.selected}
        renderValue={elements => (
          <div className={classes.chips}>
            {(elements as string[]).map(value => {
              return (
                <Chip
                  style={{
                    backgroundColor: `#${ColorUtils.getColor(value)}`,
                  }}
                  key={value}
                  label={value}
                  className={`kale-chip kale-chip-select ${classes.chip}`}
                />
              );
            })}
          </div>
        )}
      >
        {props.options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

interface ICollapsablePanel {
  title: string;
  dockerImageValue: string;
  dockerImageDefaultValue: string;
  dockerChange: Function;
  debug: boolean;
  changeDebug: Function;
}

export const CollapsablePanel: React.FunctionComponent<ICollapsablePanel> = props => {
  const [collapsed, setCollapsed] = React.useState(true);
  const theme = useTheme();

  return (
    <div className={'' + (!collapsed && 'jp-Collapse-open')}>
      <div
        className="jp-Collapse-header kale-header"
        onClick={_ => setCollapsed(!collapsed)}
        style={{ color: theme.kale.headers.main }}
      >
        {props.title}
      </div>
      <div
        className={
          'input-container p-Panel jp-Collapse-contents ' +
          (collapsed && 'p-mod-hidden')
        }
      >
        <Input
          label={'Docker image'}
          updateValue={props.dockerChange}
          value={props.dockerImageValue}
          placeholder={props.dockerImageDefaultValue}
          variant="standard"
        />

        <div className="toolbar" style={{ padding: '12px 4px 0 4px' }}>
          <div className={'switch-label'}>Debug</div>
          <Switch
            checked={props.debug}
            onChange={_ => props.changeDebug()}
            color="primary"
            name="enableKale"
            inputProps={{ 'aria-label': 'primary checkbox' }}
          />
        </div>
      </div>
    </div>
  );
};

interface IAnnotationInput {
  updateValue: Function;
  deleteValue: Function;
  annotation: { key: string; value: string };
  volumeIdx: number;
  annotationIdx: number;
  label: string;
  cannotBeDeleted?: boolean;
  rokAvailable?: boolean;
}

export const AnnotationInput: React.FunctionComponent<IAnnotationInput> = props => {
  const [annotation, setAnnotation] = React.useState({ key: '', value: '' });
  const classes = useStyles({});

  React.useEffect(() => {
    // need this to set the annotation when the notebook is loaded
    // and the metadata is updated
    setAnnotation({ ...props.annotation });
  }, [props.annotation]); // Only re-run the effect if props.annotation changes

  const updateKey = (key: string) => {
    props.updateValue(
      { ...props.annotation, key: key },
      props.volumeIdx,
      props.annotationIdx,
    );
  };

  const updateValue = (value: string) => {
    props.updateValue(
      { ...props.annotation, value: value },
      props.volumeIdx,
      props.annotationIdx,
    );
  };

  const valueField =
    props.rokAvailable && props.annotation.key === 'rok/origin' ? (
      <RokInput
        updateValue={updateValue}
        value={props.annotation.value}
        label={'Rok URL'}
        inputIndex={props.volumeIdx}
        annotationIdx={props.annotationIdx}
      />
    ) : (
      <Input
        updateValue={updateValue}
        value={props.annotation.value}
        label={'Value'}
        inputIndex={props.volumeIdx}
        variant="standard"
      />
    );

  return (
    <div className="toolbar">
      <div style={{ marginRight: '10px', width: '50%' }}>
        <Input
          updateValue={updateKey}
          value={props.annotation.key}
          label={'Key'}
          inputIndex={props.volumeIdx}
          readOnly={props.cannotBeDeleted || false}
          variant="standard"
        />
      </div>
      <div style={{ width: '50%' }}>{valueField}</div>
      {!props.cannotBeDeleted ? (
        <div className="delete-button">
          <Button
            variant="contained"
            size="small"
            title="Remove Annotation"
            onClick={_ =>
              props.deleteValue(props.volumeIdx, props.annotationIdx)
            }
            style={{ transform: 'scale(0.9)' }}
          >
            <DeleteIcon />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export const LightTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 'var(--jp-ui-font-size1)',
  },
}))(Tooltip);
