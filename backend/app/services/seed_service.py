"""
Servico de Seed - Popula tabelas de dados de treino a partir do GitHub.

Executa apenas quando as tabelas estao vazias (primeira execucao).
"""
import unicodedata
import pandas as pd
from sqlalchemy.orm import Session

from ..models.dados_treino import DadosOlhoPavao, DadosAntracnose, DadosClima

# URLs dos dados no GitHub
URLS_OLHO_PAVAO = [
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2021_Data_Olive%20leaf%20spot%20Trat1.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2022_Data_Olive%20leaf%20spot%20Trat1.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2023_Data_Olive%20leaf%20spot%20Trat1.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2025_Data_Olive%20leaf%20spot.xlsx",
]

URLS_ANTRACNOSE = [
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2024_Data_Anthracnose.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2025_Data_Anthracnose.xlsx",
]
SHEETS_ANTRACNOSE = ["Antracnose_2024", "Antracnose_2025"]

URL_CLIMA = "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/clima.xlsx"
SHEET_CLIMA = "Mirandela"


def _normalizar_nome(nome: str) -> str:
    return unicodedata.normalize('NFKD', str(nome)).encode('ascii', 'ignore').decode().strip().lower()


def _seed_olho_pavao(db: Session):
    if db.query(DadosOlhoPavao).first() is not None:
        print("[Seed] dados_olho_pavao ja tem dados, pulando.")
        return

    print("[Seed] Semeando dados_olho_pavao do GitHub...")
    frames = []
    for url in URLS_OLHO_PAVAO:
        nome = url.split('/')[-1]
        print(f"[Seed]   Baixando: {nome}")
        df = pd.read_excel(url, header=1)
        df.columns = df.columns.astype(str).str.strip()
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        frames.append(df)

    df_all = pd.concat(frames, ignore_index=True)
    df_all.columns = [_normalizar_nome(c) for c in df_all.columns]

    registos = []
    for _, row in df_all.iterrows():
        try:
            registos.append(DadosOlhoPavao(
                data=pd.to_datetime(row.get('data')),
                repeticao=int(row.get('repeticao', 0)) if pd.notna(row.get('repeticao')) else None,
                arvore=int(row.get('arvore', 0)) if pd.notna(row.get('arvore')) else None,
                folha=int(row.get('folha', 0)) if pd.notna(row.get('folha')) else None,
                visiveis=int(row.get('visiveis', 0)) if pd.notna(row.get('visiveis')) else None,
                visiveis_latentes=int(row.get('visiveis + latentes', 0)) if pd.notna(row.get('visiveis + latentes')) else None,
            ))
        except Exception:
            continue

    db.bulk_save_objects(registos)
    db.commit()
    print(f"[Seed] dados_olho_pavao: {len(registos)} registos inseridos.")


def _seed_antracnose(db: Session):
    if db.query(DadosAntracnose).first() is not None:
        print("[Seed] dados_antracnose ja tem dados, pulando.")
        return

    print("[Seed] Semeando dados_antracnose do GitHub...")
    frames = []
    for url, sheet in zip(URLS_ANTRACNOSE, SHEETS_ANTRACNOSE):
        print(f"[Seed]   Baixando: {sheet}")
        df = pd.read_excel(url, sheet_name=sheet, header=1)
        df.columns = df.columns.astype(str).str.strip()
        frames.append(df)

    df_all = pd.concat(frames, ignore_index=True)
    df_all.columns = [_normalizar_nome(c) for c in df_all.columns]

    registos = []
    for _, row in df_all.iterrows():
        try:
            registos.append(DadosAntracnose(
                data=pd.to_datetime(row.get('data')),
                olival_parcela=str(row.get('olival/parcela', '')) if pd.notna(row.get('olival/parcela')) else None,
                arvore=int(row.get('arvore', 0)) if pd.notna(row.get('arvore')) else None,
                azeitona=int(row.get('azeitona', 0)) if pd.notna(row.get('azeitona')) else None,
                severidade=float(row.get('severidade', 0)) if pd.notna(row.get('severidade')) else None,
                incidencia=float(row.get('incidencia', 0)) if pd.notna(row.get('incidencia')) else None,
            ))
        except Exception:
            continue

    db.bulk_save_objects(registos)
    db.commit()
    print(f"[Seed] dados_antracnose: {len(registos)} registos inseridos.")


def _seed_clima(db: Session):
    if db.query(DadosClima).first() is not None:
        print("[Seed] dados_clima ja tem dados, pulando.")
        return

    print("[Seed] Semeando dados_clima do GitHub...")
    print(f"[Seed]   Baixando: clima.xlsx (sheet: {SHEET_CLIMA})")
    df = pd.read_excel(URL_CLIMA, sheet_name=SHEET_CLIMA)
    df.columns = [str(c).strip().upper() for c in df.columns]

    registos = []
    for _, row in df.iterrows():
        try:
            registos.append(DadosClima(
                ano=int(row['ANO']),
                mes=int(row['MES']),
                dia=int(row['DIA']),
                t_med=float(row['T_MED']) if pd.notna(row['T_MED']) else None,
                t_max=float(row['T_MAX']) if pd.notna(row['T_MAX']) else None,
                t_min=float(row['T_MIN']) if pd.notna(row['T_MIN']) else None,
                hr_med=float(row['HR_MED']) if pd.notna(row['HR_MED']) else None,
                ff_med=float(row['FF_MED']) if pd.notna(row['FF_MED']) else None,
                pr_qtd=float(row['PR_QTD']) if pd.notna(row['PR_QTD']) else None,
            ))
        except Exception:
            continue

    db.bulk_save_objects(registos)
    db.commit()
    print(f"[Seed] dados_clima: {len(registos)} registos inseridos.")


def seed_dados_treino(db: Session):
    """Semeia as tabelas de treino com dados do GitHub (se vazias)."""
    print("=" * 60)
    print("[Seed] Verificando dados de treino...")
    print("=" * 60)
    try:
        _seed_olho_pavao(db)
        _seed_antracnose(db)
        _seed_clima(db)
        print("[Seed] Seed concluido com sucesso.")
    except Exception as e:
        print(f"[Seed] ERRO ao semear dados: {e}")
        print("[Seed] O sistema continuara sem dados iniciais.")
