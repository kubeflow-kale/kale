// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2019–2025 The Kale Contributors.

// import * as React from 'react';
// import { Input } from './Input';
// import { Select, ISelectOption } from './Select';
// import { IExperiment, NEW_EXPERIMENT } from '../widgets/LeftPanel';

// const regex: string = '^[a-z]([-a-z0-9]*[a-z0-9])?$';
// const regexErrorMsg: string =
//   'Experiment name may consist of alphanumeric ' +
//   "characters, '-', and must start with a lowercase character and end with " +
//   'a lowercase alphanumeric character.';

// interface IExperimentInput {
//   updateValue: Function;
//   options: IExperiment[];
//   selected: string; // Experiment ID
//   value: string; // Experiment Name
//   loading: boolean;
// }

// export const ExperimentInput: React.FunctionComponent<IExperimentInput> = props => {
//   const getName = (x: string) => {
//     const filtered = props.options.filter(o => o.id === x);
//     return filtered.length === 0 ? '' : filtered[0].name;
//   };

//   const updateSelected = (selected: string, idx: number) => {
//     let value = selected === NEW_EXPERIMENT.id ? '' : getName(selected);
//     const experiment: IExperiment = { id: selected, name: value };
//     props.updateValue(experiment);
//   };

//   const updateValue = (value: string, idx: number) => {
//     const experiment: IExperiment = { name: value, id: NEW_EXPERIMENT.id };
//     props.updateValue(experiment);
//   };

// const options: ISelectOption[] = props.options.map(o => {
//   return { label: o.name, value: o.id };
// });

//   return (
//     <div>
//       <Select
//         variant="standard"
//         label="Select experiment"
//         values={options}
//         value={props.selected}
//         index={-1}
//         updateValue={updateSelected}
//         helperText={props.loading ? 'Loading...' : null}
//       />
//       {props.selected === NEW_EXPERIMENT.id ? (
//         <div>
//           <Input
//             updateValue={updateValue}
//             value={props.value}
//             label="Experiment Name"
//             regex={regex}
//             regexErrorMsg={regexErrorMsg}
//             variant="standard"
//           />
//         </div>
//       ) : null}
//     </div>
//   );
// };

import * as React from 'react';
import { Input } from './Input';
import { Select, ISelectOption } from './Select';
import { IExperiment, NEW_EXPERIMENT } from '../widgets/LeftPanel';

const regex: string = '^[a-z]([-a-z0-9]*[a-z0-9])?$';
const regexErrorMsg: string =
  'Experiment name may consist of alphanumeric ' +
  "characters, '-', and must start with a lowercase character and end with " +
  'a lowercase alphanumeric character.';

interface IExperimentInput {
  updateValue: (experiment: IExperiment) => void;
  options: IExperiment[];
  selected: string; // Experiment ID
  value: string; // Experiment Name
  loading: boolean;
}

export const ExperimentInput: React.FunctionComponent<
  IExperimentInput
> = props => {
  const getName = (x: string): string => {
    const filtered = props.options.filter(o => o.id === x);
    return filtered.length === 0 ? '' : filtered[0].name;
  };

  const updateSelected = (selected: string, index?: number) => {
    const value = selected === NEW_EXPERIMENT.id ? '' : getName(selected);
    const experiment: IExperiment = { id: selected, name: value };
    props.updateValue(experiment);
  };

  const updateValue = (value: string, index?: number) => {
    const experiment: IExperiment = { name: value, id: NEW_EXPERIMENT.id };
    props.updateValue(experiment);
  };

  const options: ISelectOption[] = props.options.map(o => ({
    label: o.name,
    value: o.id
  }));

  return (
    <div>
      <Select
        variant="standard"
        label="Select experiment"
        values={options}
        value={props.selected}
        index={-1}
        updateValue={updateSelected}
        helperText={props.loading ? 'Loading...' : null}
      />
      {props.selected === NEW_EXPERIMENT.id && (
        <div>
          <Input
            updateValue={updateValue}
            value={props.value}
            label="Experiment Name"
            regex={regex}
            regexErrorMsg={regexErrorMsg}
            variant="standard"
            inputIndex={0}
          />
        </div>
      )}
    </div>
  );
};
