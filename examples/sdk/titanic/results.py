from kale.sdk import step


@step(name="results")
def results(acc_linear_svc, acc_log, acc_random_forest):
    import pandas as pd

    results = pd.DataFrame({
        'Model': ['Support Vector Machines', 'logistic Regression',
                  'Random Forest'],
        'Score': [acc_linear_svc, acc_log, acc_random_forest]})
    result_df = results.sort_values(by='Score', ascending=False)
    result_df = result_df.set_index('Score')
    print(result_df)
