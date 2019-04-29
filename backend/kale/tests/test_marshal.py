import torch
import torch.nn as nn
import torch.nn.functional as F

from kale.marshal import resource_save


class pheno_model_classifier(nn.Module):
    def __init__(self, input_size=365):
        # super(pheno_model_classifier, self).__init__()
        nn.Module.__init__(self)

        self.input_size = input_size
        self.start_n = (input_size + 1) // 2
        self.lin1 = nn.Linear(self.input_size, self.start_n)
        self.lin2 = nn.Linear(self.start_n, int(self.start_n / 2))
        self.lin3 = nn.Linear(int(self.start_n / 2), 1)

    def forward(self, x):
        x = self.lin1(x)
        x = torch.sigmoid(x)
        x = F.dropout(x, p=0.4)
        x = self.lin2(x)
        x = torch.sigmoid(x)
        x = F.dropout(x, p=0.4)
        x = self.lin3(x)
        x = torch.sigmoid(x)

        return x


if __name__ == "__main__":
    ph_model_b = pheno_model_classifier()
    resource_save(ph_model_b, "_private/")
