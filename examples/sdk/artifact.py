"""
This pipeline showcases how you can create a KFP artifact as part
of a step.
"""

from backend.sdk import pipeline, step, artifact


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
