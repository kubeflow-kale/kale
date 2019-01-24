# Copyright 2018 Stefano Fioravanzo
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM python:3.6.5
LABEL maintainers="Stefano Fioravanzo <fioravanzo@fbk.eu>"

RUN apt-get update

# Force stdin, stdout and stderr to be totally unbuffered.
ENV PYTHONUNBUFFERED=1

COPY ./docker/requirements.txt /build/requirements.txt

RUN pip install -r /build/requirements.txt

# add our custom SDK
# ADD ./mpba_sdk /mpba_sdk
# RUN pip install /mpba_sdk/.

# ADD pipeline specific code
# ADD ./pipeline_blocks /phenology_pipeline
# WORKDIR ./phenology_pipeline

ADD ./converter/odo /mpba_sdk/converter/odo

ENTRYPOINT ["python"]
