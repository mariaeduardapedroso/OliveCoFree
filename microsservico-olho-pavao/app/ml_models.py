"""
Modelo ML - Microsserviço Olho de Pavão

Abordagem híbrida: Logistic Regression + Índice de Favorabilidade Biológica

Com apenas 29 amostras de treino, o modelo ML puro pode aprender padrões
espúrios. A abordagem híbrida combina:
  - Logistic Regression (padrões dos dados reais de campo)
  - Índice de Favorabilidade Epidemiológica (conhecimento biológico)

A previsão final pondera ambos os componentes, garantindo que condições
biologicamente favoráveis (15-20°C, humidade ≥80%) produzem risco mais alto.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score

from .config import FEATURES_MODELO, THRESHOLD_MEDIO, THRESHOLD_ALTO

# Peso do componente biológico vs ML na previsão final
PESO_BIOLOGICO = 0.65
PESO_ML = 0.35


class ModeloOlhoPavao:
    """Modelo de previsão de Olho de Pavão (abordagem híbrida)."""

    def __init__(self):
        self.modelo = None
        self.scaler = None
        self.metricas = {}
        self.pronto = False
        self.features_utilizadas = []
        self.dataset_info = {}

    def treinar(self, df: pd.DataFrame):
        """Treina o modelo com o dataset processado das planilhas."""
        print("\n" + "=" * 60)
        print("[Modelo] Treino: Logistic Regression + Índice Biológico")
        print("=" * 60)

        # Selecionar features disponíveis
        self.features_utilizadas = [f for f in FEATURES_MODELO if f in df.columns]
        X = df[self.features_utilizadas].fillna(0)
        y = df['infectado']

        print(f"  Features: {len(self.features_utilizadas)}")
        print(f"  Amostras: {len(X)}")
        print(f"  Distribuição: {dict(zip(*np.unique(y, return_counts=True)))}")

        # Normalizar features (StandardScaler)
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Debug: mostrar ranges do scaler
        print(f"\n  Scaler (média / desvio-padrão):")
        for feat, mean, std in zip(self.features_utilizadas, self.scaler.mean_, self.scaler.scale_):
            print(f"    {feat}: média={mean:.2f}, std={std:.2f}")

        # Logistic Regression
        self.modelo = LogisticRegression(
            max_iter=1000,
            C=0.5,
            random_state=42
        )

        # Cross-validation para métricas (com 29 amostras, melhor que split)
        cv_acc = cross_val_score(self.modelo, X_scaled, y, cv=5, scoring='accuracy')
        cv_f1 = cross_val_score(self.modelo, X_scaled, y, cv=5, scoring='f1')

        # Treinar no dataset COMPLETO (29 amostras é muito pouco para separar)
        self.modelo.fit(X_scaled, y)

        # Log dos coeficientes e intercept
        print(f"\n  Coeficientes do modelo:")
        for feat, coef in zip(self.features_utilizadas, self.modelo.coef_[0]):
            print(f"    {feat}: {coef:.4f}")
        print(f"  Intercept: {self.modelo.intercept_[0]:.4f}")
        print(f"\n  Pesos: Biológico={PESO_BIOLOGICO}, ML={PESO_ML}")

        self.metricas = {
            'modelo': 'Logistic Regression + Índice Biológico',
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
        print(f"\n  Cross-Val Acurácia: {cv_acc.mean():.3f} (±{cv_acc.std():.3f})")
        print(f"  Cross-Val F1-Score: {cv_f1.mean():.3f} (±{cv_f1.std():.3f})")
        print("[Modelo] Pronto!")
        print("=" * 60)

    def prever(self, features: pd.Series) -> dict:
        """
        Faz previsão combinando ML com conhecimento biológico.

        Retorna:
          - percentual_infeccao: probabilidade de infeção significativa (%)
          - classificacao: baixo / medio / alto
          - confianca: certeza do modelo na previsão (%)
        """
        if not self.pronto:
            raise RuntimeError("Modelo não treinado.")

        # ---- Componente ML (Logistic Regression) ----
        X = np.array([[features.get(f, 0.0) for f in self.features_utilizadas]])
        X = np.nan_to_num(X, nan=0.0)
        X_scaled = self.scaler.transform(X)

        probabilidades_ml = self.modelo.predict_proba(X_scaled)[0]
        prob_ml = float(probabilidades_ml[1])  # 0-1

        # ---- Componente Biológico (Índice de Favorabilidade) ----
        indice_fav = features.get('indice_favorabilidade_semana', 0.3)

        # Escalar o índice: favorabilidade 0→0.1, 0.5→0.55, 1.0→0.95
        # Garante que sempre há risco mínimo e nunca 100%
        prob_bio = 0.1 + indice_fav * 0.85

        # ---- Previsão Final (ponderada) ----
        prob_combinada = PESO_BIOLOGICO * prob_bio + PESO_ML * prob_ml
        prob_infeccao = round(prob_combinada * 100, 1)

        # Confiança: baseada na concordância entre os dois componentes
        # Quanto mais concordam, maior a confiança
        diferenca = abs(prob_bio - prob_ml)
        confianca = round((1.0 - diferenca * 0.5) * 100, 1)
        confianca = max(50.0, min(confianca, 99.0))

        # Classificação baseada na probabilidade combinada
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
