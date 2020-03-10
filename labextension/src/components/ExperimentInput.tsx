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
import { MaterialInput, MaterialSelect } from './Components';
import { ISelectOption, IExperiment, NEW_EXPERIMENT } from './LeftPanelWidget';

const regex: string = '^[a-zA-Z][-_a-zA-z0-9\\s]*$';
const regexErrorMsg: string =
  'Experiment name may consist of alphanumeric ' +
  "characters, '-', '_' and white spaces, and " +
  'must begin with letter.';

interface IExperimentInput {
  updateValue: Function;
  options: IExperiment[];
  selected: string; // Experiment ID
  value: string; // Experiment Name
  loading: boolean;
}

export const ExperimentInput: React.FunctionComponent<IExperimentInput> = props => {
  const getName = (x: string) => {
    const filtered = props.options.filter(o => o.id === x);
    return filtered.length === 0 ? '' : filtered[0].name;
  };

  const updateSelected = (selected: string, idx: number) => {
    let value = selected === NEW_EXPERIMENT.id ? '' : getName(selected);
    const experiment: IExperiment = { id: selected, name: value };
    props.updateValue(experiment);
  };

  const updateValue = (value: string, idx: number) => {
    const experiment: IExperiment = { name: value, id: NEW_EXPERIMENT.id };
    props.updateValue(experiment);
  };

  const options: ISelectOption[] = props.options.map(o => {
    return { label: o.name, value: o.id };
  });

  return (
    <div>
      <MaterialSelect
        label={'Select experiment'}
        values={options}
        value={props.selected}
        index={-1}
        updateValue={updateSelected}
        helperText={props.loading ? 'Loading...' : null}
      />
      {props.selected === NEW_EXPERIMENT.id ? (
        <div>
          <MaterialInput
            updateValue={updateValue}
            value={props.value}
            label={'Experiment Name'}
            regex={regex}
            regexErrorMsg={regexErrorMsg}
          />
        </div>
      ) : null}
    </div>
  );
};
