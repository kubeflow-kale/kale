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

"""
This pipeline showcases how you can easily define a retry strategy for a
failing step.
"""

from kale.sdk import pipeline, step


"""
A single step can fail multiple times before succeeding with its task. Use
`retry_count` to define the number of times a step will be retried in case
of failure.
You can control the retry strategy with these other arguments:
- `retry_interval` (string): The time interval between retries. By default
    it's seconds but you can specify minutes or hours e.g. "2m" (2 minutes);
    "1h" (1 hour)/
- `retry_factor`: The exponential backoff factor applied to `retry_interval`.
    For example, if `retry_interval="60"` (60 seconds) and `retry_factor=2`,
    the first retry will happen after 60 seconds, then after 120, 240 and so
    on...
- `retry_max_interval`: The maximum interval that can be reached with the
    backoff strategy.
"""
@step(name="failing",
      retry_count=5,
      retry_interval="60"
      )
def failing():
    from random import choice

    if choice([0, 0, 1]):
        raise RuntimeError("Life's hard, try again!")

    return "Succeeded"


@step(name="dummy")
def dummy(result):
    print(result)


@pipeline(name="retry-strategy",
          experiment="retry-strategy",
          autosnapshot=False)
def retry_strategy_pipeline():
    res = failing()
    dummy(res)


if __name__ == "__main__":
    retry_strategy_pipeline()
