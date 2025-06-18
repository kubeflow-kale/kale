from backend.kale.sdk import pipeline, step


@step(name="step1")
def step1():
    return 10


@step(name="step2")
def step2(var1, var2, data):
    print(var1 + var2)
    return "Test"


@step(name="step3")
def step3(st, st2):
    print(st)


@pipeline(
    name="test",
    experiment="test",
    autosnapshot=True)
def mypipeline(a=1, b="Some string", c=5):
    data = step1()
    res = step2(c, a, data)
    step3(b, data)


if __name__ == "__main__":
    mypipeline(c=4, b="Test")
