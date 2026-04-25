"""
Modelo ML - Microsservico Olho de Pavao

Abordagem: Ensemble (RF + XGBoost + Ridge) com pesos por
Inverse-Variance Weighting (IVW).

Pipeline:
  1. Selecao de features por Stepwise Forward (criterio AIC)
  2. Treino dos 3 modelos individuais sobre todos os dados
  3. Calculo dos pesos por IVW (variancia dos erros de cada modelo)
  4. Clipping [0, 100%] aplicado a CADA modelo antes da media ponderada
  5. Avaliacao por dataset completo + Janela Deslizante
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    f1_score,
)
from xgboost import XGBRegressor

from .config import (
    CANDIDATE_FEATURES,
    FALLBACK_FEATURES,
    THRESHOLD_MEDIO,
    THRESHOLD_ALTO,
)
from .feature_selection import stepwise_forward_aic
from .pipeline import gerar_janelas_deslizantes


# ============================================================
# Funcoes auxiliares
# ============================================================

def _classificar(valor: float) -> str:
    """Classifica percentual de infecao em risco baixo / medio / alto."""
    if valor >= THRESHOLD_ALTO:
        return 'alto'
    if valor >= THRESHOLD_MEDIO:
        return 'medio'
    return 'baixo'


def _construir_modelos() -> dict:
    """Constroi instancias novas dos 3 modelos do ensemble."""
    return {
        'rf': RandomForestRegressor(
            n_estimators=100, max_depth=5, min_samples_leaf=3, random_state=42
        ),
        'xgb': XGBRegressor(
            n_estimators=50, max_depth=3, learning_rate=0.1,
            min_child_weight=3, random_state=42, verbosity=0,
        ),
        'ridge': Ridge(alpha=1.0),
    }


def _calcular_pesos_ivw(y_true: pd.Series, preds_clip: dict) -> dict:
    """
    Calcula pesos do ensemble por Inverse-Variance Weighting (IVW).

    Cada modelo recebe peso inversamente proporcional a variancia dos
    seus erros: modelos mais consistentes (menor variancia) contribuem
    mais para a previsao final.

        peso_i = (1 / var_i) / sum_j (1 / var_j)
    """
    inv_var = {}
    for name, pred in preds_clip.items():
        erros = y_true.values - pred
        var = float(np.var(erros))
        inv_var[name] = 1.0 / max(var, 1e-10)
    total = sum(inv_var.values())
    return {name: inv_var[name] / total for name in preds_clip}


# ============================================================
# Modelo principal
# ============================================================

class ModeloOlhoPavao:
    """Modelo de previsao de Olho de Pavao (Ensemble com IVW)."""

    def __init__(self):
        self.modelos = {}
        self.pesos = None  # Calculado por IVW apos treino
        self.scaler = None
        self.metricas = {}
        self.pronto = False
        self.features_utilizadas = []
        self.dataset_info = {}

    # --------------------------------------------------------
    # TREINO
    # --------------------------------------------------------
    def treinar(self, df: pd.DataFrame):
        """Treina o ensemble e calcula metricas de avaliacao."""
        print("\n" + "=" * 60)
        print("[Modelo] Treino: Ensemble (RF + XGBoost + Ridge) - IVW")
        print("=" * 60)

        # --- 1. Selecao de features (Stepwise Forward + AIC) ---
        available = [f for f in CANDIDATE_FEATURES if f in df.columns]
        X_all = df[available].fillna(0)
        y = df['perc_infectadas'].fillna(0)

        try:
            self.features_utilizadas = stepwise_forward_aic(X_all, y)
        except Exception as e:
            print(f"  [Stepwise] Falha ({e}). Usando features padrao.")
            self.features_utilizadas = [
                f for f in FALLBACK_FEATURES if f in df.columns
            ]

        X = df[self.features_utilizadas].fillna(0)

        print(f"\n  Features selecionadas: {len(self.features_utilizadas)}")
        print(f"  Amostras: {len(X)}")
        print(f"  Target: perc_infectadas (media={y.mean():.2f}%, std={y.std():.2f}%)")

        # --- 2. Normalizacao ---
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # --- 3. Treino dos 3 modelos individuais ---
        self.modelos = _construir_modelos()
        for name, model in self.modelos.items():
            model.fit(X_scaled, y)
            print(f"  {name}: treinado")

        # --- 4. Pesos por IVW (clipping aplicado ANTES) ---
        preds_clip = {
            name: np.clip(model.predict(X_scaled), 0, 100)
            for name, model in self.modelos.items()
        }
        self.pesos = _calcular_pesos_ivw(y, preds_clip)

        print("\n  Pesos calculados por IVW:")
        for name, peso in self.pesos.items():
            print(f"    {name:8s}: {peso:.4f} ({peso * 100:.1f}%)")

        # --- 5. Metricas no dataset completo ---
        pred_ensemble_full = self._combinar(preds_clip)
        mae_full = float(mean_absolute_error(y, pred_ensemble_full))
        rmse_full = float(np.sqrt(mean_squared_error(y, pred_ensemble_full)))
        r2_full = float(r2_score(y, pred_ensemble_full)) if len(y) > 1 else 0.0

        # Classificacao em niveis de risco -> Accuracy / F1
        y_classes = [_classificar(v) for v in y]
        pred_classes = [_classificar(v) for v in pred_ensemble_full]
        acc = float(accuracy_score(y_classes, pred_classes))
        f1 = float(
            f1_score(y_classes, pred_classes, average='weighted', zero_division=0)
        )

        # --- 6. Avaliacao por Janela Deslizante ---
        sw_metrics = self._avaliar_janela_deslizante(df)

        # --- 7. Guardar metricas ---
        self.metricas = {
            'modelo': 'Ensemble (RF + XGBoost + Ridge) - IVW',
            'mae': round(mae_full, 4),
            'rmse': round(rmse_full, 4),
            'r2': round(r2_full, 4),
            'accuracy': round(acc, 4),
            'f1_score': round(f1, 4),
            'mae_sliding_window': (
                round(sw_metrics['mae'], 4) if sw_metrics else None
            ),
            'rmse_sliding_window': (
                round(sw_metrics['rmse'], 4) if sw_metrics else None
            ),
            'r2_sliding_window': (
                round(sw_metrics['r2'], 4) if sw_metrics else None
            ),
            'accuracy_sliding_window': (
                round(sw_metrics['accuracy'], 4) if sw_metrics else None
            ),
            'f1_score_sliding_window': (
                round(sw_metrics['f1_score'], 4) if sw_metrics else None
            ),
            'pesos_ensemble': {k: round(v, 4) for k, v in self.pesos.items()},
            'amostras_treino': int(len(X)),
        }

        self.dataset_info = {
            'total_amostras': len(df),
            'anos': sorted(df['ano'].unique().tolist()),
        }

        self.pronto = True
        print(f"\n  --- Metricas no dataset completo ---")
        print(f"  MAE:      {mae_full:.2f}%")
        print(f"  RMSE:     {rmse_full:.2f}%")
        print(f"  R2:       {r2_full:.4f}")
        print(f"  Accuracy: {acc:.4f}")
        print(f"  F1:       {f1:.4f}")
        if sw_metrics:
            print(f"\n  --- Metricas por Janela Deslizante ---")
            print(f"  MAE:      {sw_metrics['mae']:.2f}%")
            print(f"  RMSE:     {sw_metrics['rmse']:.2f}%")
            print(f"  R2:       {sw_metrics['r2']:.4f}")
            print(f"  Accuracy: {sw_metrics['accuracy']:.4f}")
            print(f"  F1:       {sw_metrics['f1_score']:.4f}")
        else:
            print("\n  --- Janela Deslizante: anos insuficientes ---")
        print("[Modelo] Pronto!")
        print("=" * 60)

    # --------------------------------------------------------
    # PREVISAO EM PRODUCAO
    # --------------------------------------------------------
    def prever(self, features: pd.Series) -> dict:
        """
        Faz previsao para a entrada do utilizador.

        Aplica clipping a CADA modelo antes da media ponderada (IVW).
        """
        if not self.pronto:
            raise RuntimeError("Modelo nao treinado.")

        X = np.array([[features.get(f, 0.0) for f in self.features_utilizadas]])
        X = np.nan_to_num(X, nan=0.0)
        X_scaled = self.scaler.transform(X)

        # Clipping [0, 100%] aplicado a CADA modelo antes da combinacao
        preds_individuais = {
            name: float(np.clip(m.predict(X_scaled)[0], 0, 100))
            for name, m in self.modelos.items()
        }

        # Media ponderada com pesos IVW
        pred_final = sum(
            self.pesos[name] * preds_individuais[name]
            for name in preds_individuais
        )
        pred_final = round(max(0, min(100, pred_final)), 1)

        # Intervalo de confianca a partir do spread das previsoes individuais
        all_preds = list(preds_individuais.values())
        spread = float(np.std(all_preds))
        intervalo_inferior = round(max(0, min(all_preds) - spread), 1)
        intervalo_superior = round(min(100, max(all_preds) + spread), 1)

        # Confianca derivada do spread (50% a 99%)
        max_spread = 50.0
        confianca = round((1.0 - min(spread / max_spread, 1.0)) * 100, 1)
        confianca = max(50.0, min(confianca, 99.0))

        return {
            'percentual_infeccao': pred_final,
            'classificacao': _classificar(pred_final),
            'confianca': confianca,
            'intervalo_confianca': {
                'inferior': intervalo_inferior,
                'superior': intervalo_superior,
            },
            'detalhes': {
                'predicao_rf': round(preds_individuais['rf'], 1),
                'predicao_xgb': round(preds_individuais['xgb'], 1),
                'predicao_ridge': round(preds_individuais['ridge'], 1),
                'predicao_ensemble': round(pred_final, 1),
                'features_selecionadas': self.features_utilizadas,
                'pesos_ensemble': {
                    k: round(v, 4) for k, v in self.pesos.items()
                },
                'thresholds': {
                    'baixo': f'< {THRESHOLD_MEDIO}%',
                    'medio': f'{THRESHOLD_MEDIO}% - {THRESHOLD_ALTO}%',
                    'alto': f'>= {THRESHOLD_ALTO}%',
                },
            }
        }

    # --------------------------------------------------------
    # Helpers internos
    # --------------------------------------------------------
    def _combinar(self, preds_clip: dict) -> np.ndarray:
        """Combina previsoes (ja com clipping) por media ponderada IVW."""
        return sum(
            self.pesos[name] * pred for name, pred in preds_clip.items()
        )

    def _avaliar_janela_deslizante(self, df: pd.DataFrame):
        """
        Avalia o ensemble por Janela Deslizante (Sliding Window).

        Treina com N anos consecutivos, testa no ano seguinte.
        Tenta janela=2; se nao houver anos suficientes, fallback para janela=1.
        Retorna None se nao houver dados suficientes.
        """
        anos = sorted(df['ano'].unique())
        if len(anos) >= 3:
            tamanho_janela = 2
        elif len(anos) >= 2:
            tamanho_janela = 1
        else:
            return None

        print(
            f"\n  [Janela Deslizante] tamanho_janela={tamanho_janela} "
            f"({len(anos)} anos disponiveis)"
        )

        y_real, y_pred = [], []

        for anos_treino, ano_teste, train_df, test_df in gerar_janelas_deslizantes(
            df, tamanho_janela
        ):
            if len(train_df) < 5 or len(test_df) == 0:
                continue

            X_tr = train_df[self.features_utilizadas].fillna(0)
            y_tr = train_df['perc_infectadas'].fillna(0)
            X_te = test_df[self.features_utilizadas].fillna(0)
            y_te = test_df['perc_infectadas'].fillna(0)

            scaler_tmp = StandardScaler()
            X_tr_s = scaler_tmp.fit_transform(X_tr)
            X_te_s = scaler_tmp.transform(X_te)

            modelos_tmp = _construir_modelos()
            for m in modelos_tmp.values():
                m.fit(X_tr_s, y_tr)

            # Clipping aplicado a CADA modelo antes da media ponderada
            preds_te = {
                name: np.clip(m.predict(X_te_s), 0, 100)
                for name, m in modelos_tmp.items()
            }
            pred_ens = sum(
                self.pesos[name] * preds_te[name] for name in preds_te
            )

            y_real.extend(y_te.tolist())
            y_pred.extend(pred_ens.tolist())

            print(
                f"    Treino {anos_treino} -> Teste {ano_teste}: "
                f"{len(test_df)} semanas"
            )

        if not y_real:
            return None

        y_real_np = np.array(y_real)
        y_pred_np = np.array(y_pred)

        y_real_classes = [_classificar(v) for v in y_real_np]
        y_pred_classes = [_classificar(v) for v in y_pred_np]

        return {
            'mae': float(mean_absolute_error(y_real_np, y_pred_np)),
            'rmse': float(np.sqrt(mean_squared_error(y_real_np, y_pred_np))),
            'r2': (
                float(r2_score(y_real_np, y_pred_np))
                if len(y_real_np) > 1 else 0.0
            ),
            'accuracy': float(accuracy_score(y_real_classes, y_pred_classes)),
            'f1_score': float(
                f1_score(
                    y_real_classes, y_pred_classes,
                    average='weighted', zero_division=0
                )
            ),
        }
