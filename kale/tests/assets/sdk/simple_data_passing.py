from kale.sdk import pipeline, step


@step(name="step1", limits={"amd/gpu": "1"})
def step1():
    a = 1
    b = 2
    return a, b


@step(name="step2",
      retry_count=5,
      retry_interval="20",
      retry_factor=2,
      timeout=5)
def step2(a, b):
    c = a + b
    print(c)
    return c


@step(name="step3", annotations={"step3-annotation": "test"})
def step3(a, c):
    d = c + a
    print(d)


@pipeline(
    name="test",
    experiment="test",
    steps_defaults={"labels": {"common-label": "true"}}
)
def mypipeline():
    _b, _a = step1()
    _c = step2(_b, _a)
    step3(_a, _c)


if __name__ == "__main__":
    mypipeline()
