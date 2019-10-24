import kfp


def list_experiments():
    c = kfp.Client()
    experiments = [{"name": e.name,
                    "id": e.id}
                   for e in c.list_experiments().experiments]
    return experiments
