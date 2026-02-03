# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from kale.sdk import step


@step(name="postprocess")
def postprocess(raw_input, raw_output, processing_info):
    import pandas as pd

    from settings import OUTPUTS, DATE_TIME, OUTPUT_DATA

    # Generating pandas Dataframe
    output = OUTPUTS[0]
    df = pd.DataFrame()

    # '''if 'scaling' in processing_info:
    #     shift_y, scale_y = processing_info['scaling']
    #     raw_output = scale_y * raw_output + shift_y
    #     print(raw_output)'''

    # We need to fix this issue. There should be a link between preprocessing
    # and post processing for the response variable.
    # At the moment, we just apply PP to predictors. Not that we need to apply
    # PP to response, but the way it is written it
    # is assumed that we apply PP to both predictors and response

    df[output + '_prediction'] = raw_output

    # Including time if necessary
    _, _, Time = raw_input
    if len(Time) > 0:
        time_var = DATE_TIME
        df[time_var] = Time
        df[time_var] = pd.to_datetime(df[time_var])

    df.to_csv(OUTPUT_DATA, index=False)
    print("Postprocess: output saved to disk")
