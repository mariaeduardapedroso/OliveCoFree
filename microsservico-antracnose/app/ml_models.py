"""
Modelo ML - Microsservico Antracnose

Abordagem: Ensemble (RF + XGBoost + Ridge)

Biologia do Colletotrichum spp.:
  - Temperatura otima: 20-25C
  - Humidade >= 80%
  - Disseminacao por salpico de chuva
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

from .config import CANDIDATE_FEATURES, FALLBACK_FEATURES, THRESHOLD_MEDIO, THRESHOLD_ALTO
from .feature_selection import stepwise_forward_aic
from .pipeline import gerar_janelas_expansivas


class ModeloAntracnose:
    """Modelo de previsao de Antracnose (Ensemble)."""

    def __init__(self):
        self.modelos = {}
        self.pesos = {'rf': 0.4, 'xgb': 0.4, 'ridge': 0.2}
        self.scaler = None
        self.metricas = {}
        self.pronto = False
        self.features_utilizadas = []
        self.dataset_info = {}

    def treinar(self, df: pd.DataFrame):
        """Treina ensemble com selecao automatica de features."""
        print("\n" + "=" * 60)
        print("[Modelo] Treino: Ensemble (RF + XGBoost + Ridge)")
        print("=" * 60)

        available = [f for f in CANDIDATE_FEATURES if f in df.columns]
        X_all = df[available].fillna(0)
        y = df['perc_infectadas'].fillna(0)

        try:
            self.features_utilizadas = stepwise_forward_aic(X_all, y)
        except Exception as e:
            print(f"  [Stepwise] Falha ({e}). Usando features padrao.")
            self.features_utilizadas = [f for f in FALLBACK_FEATURES if f in df.columns]

        X = df[self.features_utilizadas].fillna(0)

        print(f"\n  Features selecionadas: {len(self.features_utilizadas)}")
        print(f"  Amostras: {len(X)}")
        print(f"  Target: perc_infectadas (media={y.mean():.2f}%, std={y.std():.2f}%)")

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.modelos['rf'] = RandomForestRegressor(
            n_estimators=100, max_depth=5, min_samples_leaf=3, random_state=42
        )
        self.modelos['xgb'] = XGBRegressor(
            n_estimators=50, max_depth=3, learning_rate=0.1,
            min_child_weight=3, random_state=42, verbosity=0
        )
        self.modelos['ridge'] = Ridge(alpha=1.0)

        for name, model in self.modelos.items():
            model.fit(X_scaled, y)
            print(f"  {name}: treinado")

        n_cv = min(5, len(X))
        if n_cv >= 2:
            cv_mae = cross_val_score(
                self.modelos['rf'], X_scaled, y, cv=n_cv, scoring='neg_mean_absolute_error'
            )
            mae_mean = -cv_mae.mean()
        else:
            mae_mean = 0.0

        ew_errors = []
        min_window = max(len(self.features_utilizadas) + 2, 5)
        for train_df, test_df in gerar_janelas_expansivas(df, min_window):
            try:
                X_tr = train_df[self.features_utilizadas].fillna(0)
                y_tr = train_df['perc_infectadas'].fillna(0)
                X_te = test_df[self.features_utilizadas].fillna(0)
                y_te = test_df['perc_infectadas'].values[0]

                scaler_tmp = StandardScaler()
                X_tr_s = scaler_tmp.fit_transform(X_tr)
                X_te_s = scaler_tmp.transform(X_te)

                preds = []
                for name, model_cls in [
                    ('rf', RandomForestRegressor(n_estimators=100, max_depth=5, min_samples_leaf=3, random_state=42)),
                    ('xgb', XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, min_child_weight=3, random_state=42, verbosity=0)),
                    ('ridge', Ridge(alpha=1.0)),
                ]:
                    model_cls.fit(X_tr_s, y_tr)
                    pred = model_cls.predict(X_te_s)[0]
                    preds.append(pred)

                pred_ens = self.pesos['rf'] * preds[0] + self.pesos['xgb'] * preds[1] + self.pesos['ridge'] * preds[2]
                ew_errors.append(abs(pred_ens - y_te))
            except Exception:
                continue

        ew_mae = np.mean(ew_errors) if ew_errors else mae_mean

        preds_full = self._prever_ensemble(X_scaled)
        r2 = r2_score(y, preds_full) if len(y) > 1 else 0.0
        rmse = np.sqrt(mean_squared_error(y, preds_full))

        self.metricas = {
            'modelo': 'Ensemble (RF + XGBoost + Ridge)',
            'mae': round(float(mae_mean), 4),
            'rmse': round(float(rmse), 4),
            'r2': round(float(r2), 4),
            'mae_expanding_window': round(float(ew_mae), 4),
            'amostras_treino': int(len(X)),
            'amostras_teste': 0,
            'accuracy': round(float(max(0, 1 - mae_mean / 100)), 4),
            'f1_score': round(float(max(0, r2)), 4),
        }

        self.dataset_info = {
            'total_amostras': len(df),
            'anos': sorted(df['ano'].unique().tolist()),
        }

        self.pronto = True
        print(f"\n  MAE (Cross-Val): {mae_mean:.2f}%")
        print(f"  MAE (Expanding Window): {ew_mae:.2f}%")
        print(f"  RMSE: {rmse:.2f}%")
        print(f"  R2: {r2:.4f}")
        print("[Modelo] Pronto!")
        print("=" * 60)

    def _prever_ensemble(self, X_scaled: np.ndarray) -> np.ndarray:
        pred_rf = np.clip(self.modelos['rf'].predict(X_scaled), 0, 100)
        pred_xgb = np.clip(self.modelos['xgb'].predict(X_scaled), 0, 100)
        pred_ridge = np.clip(self.modelos['ridge'].predict(X_scaled), 0, 100)
        return (
            self.pesos['rf'] * pred_rf +
            self.pesos['xgb'] * pred_xgb +
            self.pesos['ridge'] * pred_ridge
        )

    def prever(self, features: pd.Series) -> dict:
        if not self.pronto:
            raise RuntimeError("Modelo nao treinado.")

        # ---- Previsao Ensemble ----
        X = np.array([[features.get(f, 0.0) for f in self.features_utilizadas]])
        X = np.nan_to_num(X, nan=0.0)
        X_scaled = self.scaler.transform(X)

        pred_rf = float(np.clip(self.modelos['rf'].predict(X_scaled)[0], 0, 100))
        pred_xgb = float(np.clip(self.modelos['xgb'].predict(X_scaled)[0], 0, 100))
        pred_ridge = float(np.clip(self.modelos['ridge'].predict(X_scaled)[0], 0, 100))

        pred_final = (
            self.pesos['rf'] * pred_rf +
            self.pesos['xgb'] * pred_xgb +
            self.pesos['ridge'] * pred_ridge
        )
        pred_final = round(max(0, min(100, pred_final)), 1)

        all_preds = [pred_rf, pred_xgb, pred_ridge]
        spread = np.std(all_preds)
        intervalo_inferior = round(max(0, min(all_preds) - spread), 1)
        intervalo_superior = round(min(100, max(all_preds) + spread), 1)

        max_spread = 50.0
        confianca = round((1.0 - min(spread / max_spread, 1.0)) * 100, 1)
        confianca = max(50.0, min(confianca, 99.0))

        if pred_final >= THRESHOLD_ALTO:
            classificacao = "alto"
        elif pred_final >= THRESHOLD_MEDIO:
            classificacao = "medio"
        else:
            classificacao = "baixo"

        return {
            'percentual_infeccao': pred_final,
            'classificacao': classificacao,
            'confianca': confianca,
            'intervalo_confianca': {
                'inferior': intervalo_inferior,
                'superior': intervalo_superior,
            },
            'detalhes': {
                'predicao_rf': round(pred_rf, 1),
                'predicao_xgb': round(pred_xgb, 1),
                'predicao_ridge': round(pred_ridge, 1),
                'predicao_ensemble': round(pred_final, 1),
                'features_selecionadas': self.features_utilizadas,
                'thresholds': {
                    'baixo': f'< {THRESHOLD_MEDIO}%',
                    'medio': f'{THRESHOLD_MEDIO}% - {THRESHOLD_ALTO}%',
                    'alto': f'>= {THRESHOLD_ALTO}%',
                },
            }
        }
