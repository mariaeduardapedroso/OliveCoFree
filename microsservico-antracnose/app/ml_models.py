"""
Modelo ML - Microsservico Antracnose

Abordagem hibrida: Logistic Regression + Indice de Favorabilidade Biologica

Biologia do Colletotrichum spp. (Antracnose):
  - Temperatura otima para germinacao dos conidios: 20-25C
  - Humidade relativa >= 80% favorece esporulacao
  - Disseminacao principalmente por salpico de chuva
  - Periodo critico: maturacao da azeitona (outubro-novembro)

A previsao final pondera ambos os componentes (ML + biologico).
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score

from .config import FEATURES_MODELO, THRESHOLD_MEDIO, THRESHOLD_ALTO

# Peso do componente biologico vs ML na previsao final
PESO_BIOLOGICO = 0.65
PESO_ML = 0.35


class ModeloAntracnose:
    """Modelo de previsao de Antracnose (abordagem hibrida)."""

    def __init__(self):
        self.modelo = None
        self.scaler = None
        self.metricas = {}
        self.pronto = False
        self.features_utilizadas = []
        self.dataset_info = {}

    def treinar(self, df: pd.DataFrame):
        """Treina o modelo com o dataset processado dos dados do GitHub."""
        print("\n" + "=" * 60)
        print("[Modelo] Treino: Logistic Regression + Indice Biologico")
        print("=" * 60)

        # Selecionar features disponiveis
        self.features_utilizadas = [f for f in FEATURES_MODELO if f in df.columns]
        X = df[self.features_utilizadas].fillna(0)
        y = df['infectado']

        print(f"  Features: {len(self.features_utilizadas)}")
        print(f"  Amostras: {len(X)}")
        print(f"  Distribuicao: {dict(zip(*np.unique(y, return_counts=True)))}")

        # Normalizar features (StandardScaler)
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        print(f"\n  Scaler (media / desvio-padrao):")
        for feat, mean, std in zip(self.features_utilizadas, self.scaler.mean_, self.scaler.scale_):
            print(f"    {feat}: media={mean:.2f}, std={std:.2f}")

        # Logistic Regression
        self.modelo = LogisticRegression(
            max_iter=1000,
            C=0.5,
            random_state=42
        )

        # Cross-validation para metricas
        n_splits = min(5, len(X))
        cv_acc = cross_val_score(self.modelo, X_scaled, y, cv=n_splits, scoring='accuracy')
        cv_f1 = cross_val_score(self.modelo, X_scaled, y, cv=n_splits, scoring='f1')

        # Treinar no dataset COMPLETO
        self.modelo.fit(X_scaled, y)

        print(f"\n  Coeficientes do modelo:")
        for feat, coef in zip(self.features_utilizadas, self.modelo.coef_[0]):
            print(f"    {feat}: {coef:.4f}")
        print(f"  Intercept: {self.modelo.intercept_[0]:.4f}")
        print(f"\n  Pesos: Biologico={PESO_BIOLOGICO}, ML={PESO_ML}")

        self.metricas = {
            'modelo': 'Logistic Regression + Indice Biologico',
            'accuracy': round(float(cv_acc.mean()), 4),
            'f1_score': round(float(cv_f1.mean()), 4),
            'amostras_treino': int(len(X)),
            'amostras_teste': 0,
        }

        self.dataset_info = {
            'total_amostras': len(df),
            'anos': sorted(df['ano'].unique().tolist()),
        }

        self.pronto = True
        print(f"\n  Cross-Val Acuracia: {cv_acc.mean():.3f} (+/-{cv_acc.std():.3f})")
        print(f"  Cross-Val F1-Score: {cv_f1.mean():.3f} (+/-{cv_f1.std():.3f})")
        print("[Modelo] Pronto!")
        print("=" * 60)

    def prever(self, features: pd.Series) -> dict:
        """
        Faz previsao combinando ML com conhecimento biologico.

        Retorna:
          - percentual_infeccao: probabilidade de infecao significativa (%)
          - classificacao: baixo / medio / alto
          - confianca: certeza do modelo na previsao (%)
        """
        if not self.pronto:
            raise RuntimeError("Modelo nao treinado.")

        # ---- Componente ML (Logistic Regression) ----
        X = np.array([[features.get(f, 0.0) for f in self.features_utilizadas]])
        X = np.nan_to_num(X, nan=0.0)
        X_scaled = self.scaler.transform(X)

        probabilidades_ml = self.modelo.predict_proba(X_scaled)[0]
        prob_ml = float(probabilidades_ml[1])  # 0-1

        # ---- Componente Biologico (Indice de Favorabilidade) ----
        indice_fav = features.get('indice_favorabilidade_semana', 0.3)

        # Escalar o indice: favorabilidade 0->0.1, 0.5->0.55, 1.0->0.95
        prob_bio = 0.1 + indice_fav * 0.85

        # ---- Previsao Final (ponderada) ----
        prob_combinada = PESO_BIOLOGICO * prob_bio + PESO_ML * prob_ml
        prob_infeccao = round(prob_combinada * 100, 1)

        # Confianca: baseada na concordancia entre os dois componentes
        diferenca = abs(prob_bio - prob_ml)
        confianca = round((1.0 - diferenca * 0.5) * 100, 1)
        confianca = max(50.0, min(confianca, 99.0))

        # Classificacao baseada na probabilidade combinada
        if prob_infeccao >= THRESHOLD_ALTO:
            classificacao = "alto"
        elif prob_infeccao >= THRESHOLD_MEDIO:
            classificacao = "medio"
        else:
            classificacao = "baixo"

        return {
            'percentual_infeccao': prob_infeccao,
            'classificacao': classificacao,
            'confianca': confianca,
            'detalhes': {
                'probabilidade_ml': round(prob_ml * 100, 1),
                'probabilidade_biologica': round(prob_bio * 100, 1),
                'indice_favorabilidade': round(indice_fav, 3),
                'thresholds': {
                    'baixo': f'< {THRESHOLD_MEDIO}%',
                    'medio': f'{THRESHOLD_MEDIO}% - {THRESHOLD_ALTO}%',
                    'alto': f'>= {THRESHOLD_ALTO}%',
                },
            }
        }
