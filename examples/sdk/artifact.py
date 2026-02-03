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
This pipeline showcases how you can create a KFP artifact as part
of a step.
"""

from kale.sdk import pipeline, step, artifact


# Annotate the step with the @artifact decorator and specify the path to
# a HTML file
@artifact(name="test-artifact", path="/home/jovyan/myartifact.html")
@step(name="artifact_generator")
def generate_artifact():
    print("Creating HTML artifact...")
    with open("/home/jovyan/myartifact.html", "w") as f:
        f.write("<html>Hello, World!<html>")
    print("HTML artifact created successfully!")


@pipeline(name="generate-artifact", experiment="generate-artifact")
def artifact_pipeline():
    generate_artifact()


if __name__ == "__main__":
    artifact_pipeline()
