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
import Button from '@material-ui/core/Button';
import InputAdornment from '@material-ui/core/InputAdornment';
import BrowseInRokBlue from '../icons/BrowseInRokBlue';
import { InputProps, Input } from './Input';

interface IRokInput extends InputProps {
  annotationIdx: number;
}

let popupChooser: any;

export const RokInput: React.FunctionComponent<IRokInput> = props => {
  const { annotationIdx, ...rest } = props;

  const state = React.useState({
    chooserId: 'vol:' + rest.inputIndex + 'annotation:' + annotationIdx,
    origin: window.location.origin,
  });

  const openFileChooser = () => {
    const mode: string = 'file';
    let create: boolean = false;
    if (rest.label) {
      const temp: string = rest.label as string;
    }
    const goTo: string =
      `${state[0].origin}/rok/buckets?mode=${mode}-chooser` +
      `&create=${create}` +
      `&chooser-id=${state[0].chooserId}`;

    if (popupChooser && !popupChooser.closed) {
      popupChooser.window.location.href = goTo;
      popupChooser.focus();
      return;
    }

    popupChooser = window.open(
      `${state[0].origin}/rok/buckets?mode=${mode}-chooser` +
        `&create=${create}` +
        `&chooser-id=${state[0].chooserId}`,
      'Chooser',
      `height=500,width=600,menubar=0`,
    );
  };

  React.useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.origin !== state[0].origin) {
        return;
      }
      if (
        typeof event.data === 'object' &&
        event.data.hasOwnProperty('chooser') &&
        event.data.hasOwnProperty('chooserId') &&
        event.data.chooserId === state[0].chooserId
      ) {
        rest.updateValue(event.data.chooser, rest.inputIndex);
        popupChooser.close();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const InputProps = {
    endAdornment: (
      <InputAdornment position="end">
        <Button
          color="secondary"
          id="chooseRokFileBtn"
          onClick={openFileChooser}
          style={{ padding: '0px', minWidth: '0px' }}
        >
          <BrowseInRokBlue />
        </Button>
      </InputAdornment>
    ),
  };

  return <Input InputProps={InputProps} {...rest} />;
};
