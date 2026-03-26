"""
Selecao Automatica de Features - Stepwise Forward (AIC)

Seleciona automaticamente as melhores features para o modelo
usando o criterio AIC (Akaike Information Criterion).
Mais robusto que p-value para datasets pequenos.
"""
import numpy as np
import pandas as pd
import statsmodels.api as sm
from typing import List

from .config import FALLBACK_FEATURES


def stepwise_forward_aic(
    X: pd.DataFrame,
    y: pd.Series,
    max_features: int = 10,
    min_features: int = 3,
) -> List[str]:
    """
    Selecao forward stepwise baseada em AIC.

    A cada passo, adiciona a feature que mais reduz o AIC.
    Para quando adicionar qualquer feature aumenta o AIC.
    """
    n_samples = len(X)
    candidates = list(X.columns)

    # Guard for small datasets
    safe_max = max(min_features, n_samples // 4)
    max_features = min(max_features, safe_max)

    if n_samples < min_features + 2:
        print(f"  [Stepwise] Dataset muito pequeno ({n_samples} amostras). Usando features padrao.")
        return [f for f in FALLBACK_FEATURES if f in candidates]

    selected = []
    best_aic = np.inf

    print(f"\n  [Stepwise] Selecao de features (AIC) - {len(candidates)} candidatas, max={max_features}")

    for step in range(max_features):
        remaining = [f for f in candidates if f not in selected]
        if not remaining:
            break

        step_results = []
        for feat in remaining:
            try:
                test_features = selected + [feat]
                X_test = sm.add_constant(X[test_features])
                model = sm.OLS(y, X_test).fit()
                step_results.append((feat, model.aic))
            except Exception:
                continue

        if not step_results:
            break

        # Best candidate this step
        best_feat, best_step_aic = min(step_results, key=lambda x: x[1])

        # Stop if AIC increases (and we have minimum features)
        if best_step_aic >= best_aic and len(selected) >= min_features:
            print(f"  [Stepwise] Parou no passo {step+1}: AIC nao melhorou ({best_step_aic:.2f} >= {best_aic:.2f})")
            break

        selected.append(best_feat)
        best_aic = best_step_aic
        print(f"  [Stepwise] +{best_feat} (AIC={best_aic:.2f})")

    if len(selected) < min_features:
        # Force minimum features
        for feat in FALLBACK_FEATURES:
            if feat not in selected and feat in candidates:
                selected.append(feat)
                if len(selected) >= min_features:
                    break

    print(f"  [Stepwise] Selecionadas: {selected}")
    return selected
