// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { Input } from './Input';

import { Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export interface IAnnotation {
  key: string;
  value: string;
}

interface IAnnotationInputProps {
  label: string;
  volumeIdx: number;
  annotationIdx: number;
  rokAvailable?: boolean;
  cannotBeDeleted?: boolean;
  annotation: { key: string; value: string };
  deleteValue: (idx: number, annotationIdx: number) => void;
  updateValue: (
    annotation: { key: string; value: string },
    idx: number,
    annotationIdx: number
  ) => void;
}

export const AnnotationInput: React.FunctionComponent<
  IAnnotationInputProps
> = props => {
  const [, setAnnotation] = React.useState<IAnnotation>({ key: '', value: '' });

  React.useEffect(() => {
    // need this to set the annotation when the notebook is loaded
    // and the metadata is updated
    setAnnotation({ ...props.annotation });
  }, [props.annotation]);

  const updateKey = (key: string) => {
    props.updateValue(
      { ...props.annotation, key: key },
      props.volumeIdx,
      props.annotationIdx
    );
  };

  const updateValue = (value: string) => {
    props.updateValue(
      { ...props.annotation, value: value },
      props.volumeIdx,
      props.annotationIdx
    );
  };

  <Input
    updateValue={updateValue}
    value={props.annotation.value}
    label="Value"
    inputIndex={props.volumeIdx}
    variant="standard"
  />;

  return (
    <div className="toolbar">
      <div style={{ marginRight: '10px', width: '50%' }}>
        <Input
          updateValue={updateKey}
          value={props.annotation.key}
          label="Key"
          inputIndex={props.volumeIdx}
          readOnly={props.cannotBeDeleted || false}
          variant="standard"
        />
      </div>
      <div style={{ width: '50%' }}>
        <Input
          updateValue={updateValue}
          value={props.annotation.value}
          label="Value"
          inputIndex={props.volumeIdx}
          variant="standard"
        />
      </div>
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
