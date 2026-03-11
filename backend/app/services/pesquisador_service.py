"""
Servico do Pesquisador - Painel Cientifico

Funcionalidades:
  - Obter info dos modelos dos microsservicos
  - Gerar templates Excel para download
  - Validar arquivos de upload
  - Enviar dados para retreino dos microsservicos
  - Registrar e listar historico de uploads
"""
import json
import unicodedata
import logging
from io import BytesIO
from typing import List, Optional
from uuid import UUID
from datetime import datetime

import httpx
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..config import MICROSSERVICO_OLHO_PAVAO_URL, MICROSSERVICO_ANTRACNOSE_URL
from ..models.upload import UploadDados

logger = logging.getLogger(__name__)

_MICROSSERVICO_URLS = {
    "olho-pavao": MICROSSERVICO_OLHO_PAVAO_URL,
    "antracnose": MICROSSERVICO_ANTRACNOSE_URL,
}


# ============================================================
# OBTER INFO DOS MODELOS
# ============================================================

async def obter_info_modelos() -> list:
    """Busca info dos modelos de ambos os microsservicos."""
    resultados = []
    for doenca_id, base_url in _MICROSSERVICO_URLS.items():
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/modelo/info", timeout=10.0)
                response.raise_for_status()
                data = response.json()
                data['doenca_id'] = doenca_id
                resultados.append(data)
        except Exception as e:
            logger.warning(f"Microsservico {doenca_id} indisponivel: {e}")
            resultados.append({
                'doenca_id': doenca_id,
                'modelo': 'Indisponivel',
                'accuracy': 0,
                'f1_score': 0,
                'total_amostras_treino': 0,
                'anos_treino': [],
                'features_utilizadas': [],
                'thresholds': {},
            })
    return resultados


async def obter_info_modelo_unico(doenca_id: str) -> Optional[dict]:
    """Busca info de um modelo especifico."""
    base_url = _MICROSSERVICO_URLS.get(doenca_id)
    if not base_url:
        return None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/modelo/info", timeout=10.0)
            response.raise_for_status()
            data = response.json()
            data['doenca_id'] = doenca_id
            return data
    except Exception:
        return None


# ============================================================
# GERAR TEMPLATES EXCEL
# ============================================================

def _estilizar_header(ws, row, num_cols):
    """Aplica estilo ao cabecalho do Excel."""
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="4F7942", end_color="4F7942", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin'),
    )
    for col in range(1, num_cols + 1):
        cell = ws.cell(row=row, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center')
        cell.border = thin_border


def gerar_template(tipo: str) -> BytesIO:
    """Gera template Excel com cabecalhos corretos e linha de exemplo."""
    wb = Workbook()
    ws = wb.active

    if tipo == "olho-pavao":
        ws.title = "Olho de Pavao"
        # Linha 1: titulo (porque pipeline usa header=1)
        ws.append(["Dados de campo - Olho de Pavao (preencha a partir da linha 3)"])
        ws.merge_cells('A1:F1')
        ws['A1'].font = Font(bold=True, size=12, color="4F7942")
        # Linha 2: cabecalhos
        headers = ["data", "repeticao", "arvore", "folha", "visiveis", "visiveis + latentes"]
        ws.append(headers)
        _estilizar_header(ws, 2, len(headers))
        # Linha 3: exemplo
        ws.append(["2026-01-15", 1, 1, 1, 0, 0])
        ws.append(["2026-01-15", 1, 1, 2, 1, 2])
        # Ajustar largura
        for col_letter in ['A', 'B', 'C', 'D', 'E', 'F']:
            ws.column_dimensions[col_letter].width = 18

    elif tipo == "antracnose":
        ws.title = "Antracnose"
        ws.append(["Dados de campo - Antracnose (preencha a partir da linha 3)"])
        ws.merge_cells('A1:F1')
        ws['A1'].font = Font(bold=True, size=12, color="8B5CF6")
        headers = ["data", "olival/parcela", "arvore", "azeitona", "severidade", "incidencia"]
        ws.append(headers)
        _estilizar_header(ws, 2, len(headers))
        ws.append(["2026-10-15", "Parcela1", 1, 1, 0, 0])
        ws.append(["2026-10-15", "Parcela1", 1, 2, 1.5, 1])
        for col_letter in ['A', 'B', 'C', 'D', 'E', 'F']:
            ws.column_dimensions[col_letter].width = 18

    elif tipo == "clima":
        ws.title = "Clima"
        # Clima nao usa header=1, cabecalhos na linha 1
        headers = ["ANO", "MES", "DIA", "T_MED", "T_MAX", "T_MIN", "HR_MED", "FF_MED", "PR_QTD"]
        ws.append(headers)
        _estilizar_header(ws, 1, len(headers))
        ws.append([2026, 1, 15, 12.5, 17.0, 8.0, 75.0, 2.5, 1.2])
        ws.append([2026, 1, 16, 13.0, 18.0, 9.0, 78.0, 1.8, 0.5])
        for col_letter in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']:
            ws.column_dimensions[col_letter].width = 12

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


# ============================================================
# VALIDACAO DE ARQUIVOS
# ============================================================

def _normalizar_colunas(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza nomes das colunas: strip accents, lowercase, trim."""
    df.columns = [
        unicodedata.normalize('NFKD', str(c)).encode('ascii', 'ignore').decode().strip().lower()
        for c in df.columns
    ]
    return df


def validar_arquivo_doenca(df: pd.DataFrame, doenca_id: str) -> List[str]:
    """Valida colunas e dados do arquivo de doenca."""
    erros = []
    df = _normalizar_colunas(df)

    if doenca_id == "olho-pavao":
        required = ['data', 'repeticao', 'arvore', 'folha', 'visiveis', 'visiveis + latentes']
    else:
        required = ['data', 'olival/parcela', 'arvore', 'azeitona', 'severidade', 'incidencia']

    # Verificar colunas presentes
    colunas_existentes = list(df.columns)
    for col in required:
        if col not in colunas_existentes:
            erros.append(f"Coluna obrigatoria ausente: '{col}'")

    if erros:
        erros.append(f"Colunas encontradas: {colunas_existentes}")
        return erros

    # Verificar linhas
    if len(df) == 0:
        erros.append("Ficheiro sem dados (0 linhas)")
        return erros

    # Verificar data parseavel
    try:
        pd.to_datetime(df['data'])
    except Exception:
        erros.append("Coluna 'data' contem valores que nao sao datas validas")

    # Verificar colunas numericas
    if doenca_id == "olho-pavao":
        for col in ['visiveis', 'visiveis + latentes']:
            if col in df.columns:
                non_numeric = pd.to_numeric(df[col], errors='coerce').isna().sum()
                if non_numeric > 0:
                    erros.append(f"Coluna '{col}' tem {non_numeric} valores nao numericos")
    else:
        for col in ['severidade', 'incidencia']:
            if col in df.columns:
                non_numeric = pd.to_numeric(df[col], errors='coerce').isna().sum()
                if non_numeric > 0:
                    erros.append(f"Coluna '{col}' tem {non_numeric} valores nao numericos")

    return erros


def validar_arquivo_clima(df: pd.DataFrame) -> List[str]:
    """Valida colunas e dados do arquivo de clima."""
    erros = []

    # Clima usa nomes uppercase
    df.columns = [str(c).strip().upper() for c in df.columns]

    required = ['ANO', 'MES', 'DIA', 'T_MED', 'T_MAX', 'T_MIN', 'HR_MED', 'FF_MED', 'PR_QTD']
    colunas_existentes = list(df.columns)
    for col in required:
        if col not in colunas_existentes:
            erros.append(f"Coluna obrigatoria ausente: '{col}'")

    if erros:
        erros.append(f"Colunas encontradas: {colunas_existentes}")
        return erros

    if len(df) == 0:
        erros.append("Ficheiro sem dados (0 linhas)")
        return erros

    # Verificar ANO, MES, DIA sao inteiros
    for col in ['ANO', 'MES', 'DIA']:
        non_numeric = pd.to_numeric(df[col], errors='coerce').isna().sum()
        if non_numeric > 0:
            erros.append(f"Coluna '{col}' tem {non_numeric} valores nao numericos")

    # Verificar colunas climaticas sao numericas
    for col in ['T_MED', 'T_MAX', 'T_MIN', 'HR_MED', 'FF_MED', 'PR_QTD']:
        non_numeric = pd.to_numeric(df[col], errors='coerce').isna().sum()
        if non_numeric > 0:
            erros.append(f"Coluna '{col}' tem {non_numeric} valores nao numericos")

    return erros


# ============================================================
# ENVIAR RETREINO AO MICROSSERVICO
# ============================================================

async def enviar_retreino(doenca_id: str, df_doenca: pd.DataFrame, df_clima: pd.DataFrame) -> dict:
    """Envia dados para o microsservico retreinar o modelo."""
    base_url = _MICROSSERVICO_URLS.get(doenca_id)
    if not base_url:
        raise Exception(f"Doenca desconhecida: {doenca_id}")

    payload = {
        "dados_doenca": df_doenca.to_dict(orient='records'),
        "dados_clima": df_clima.to_dict(orient='records'),
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/modelo/retreinar",
                json=payload,
                timeout=120.0,
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        raise Exception(f"Microsservico de {doenca_id} indisponivel.")
    except httpx.TimeoutException:
        raise Exception(f"Retreino demorou demais (timeout 120s).")
    except httpx.HTTPStatusError as e:
        detail = e.response.text
        raise Exception(f"Erro ao retreinar: {detail}")


# ============================================================
# HISTORICO DE UPLOADS
# ============================================================

def registrar_upload(
    db: Session,
    usuario_id: UUID,
    doenca_id: str,
    amostras_doenca: int,
    amostras_clima: int,
    anos_dados: List[int],
    accuracy_antes: Optional[float],
    accuracy_depois: float,
    f1_antes: Optional[float],
    f1_depois: float,
    total_amostras_depois: int,
) -> UploadDados:
    """Registra upload no historico."""
    upload = UploadDados(
        usuario_id=usuario_id,
        doenca_id=doenca_id,
        amostras_doenca=amostras_doenca,
        amostras_clima=amostras_clima,
        anos_dados=json.dumps(anos_dados),
        accuracy_antes=accuracy_antes,
        accuracy_depois=accuracy_depois,
        f1_antes=f1_antes,
        f1_depois=f1_depois,
        total_amostras_depois=total_amostras_depois,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


def listar_uploads(db: Session) -> list:
    """Lista historico de uploads com nome do usuario."""
    from ..models.usuario import Usuario
    uploads = (
        db.query(UploadDados, Usuario.nome)
        .join(Usuario, UploadDados.usuario_id == Usuario.id)
        .order_by(desc(UploadDados.criado_em))
        .all()
    )
    resultado = []
    for upload, nome in uploads:
        resultado.append({
            'id': str(upload.id),
            'doenca_id': upload.doenca_id,
            'usuario_nome': nome,
            'data_upload': upload.criado_em.isoformat() if upload.criado_em else None,
            'amostras_doenca': upload.amostras_doenca,
            'amostras_clima': upload.amostras_clima,
            'anos_dados': json.loads(upload.anos_dados) if upload.anos_dados else [],
            'accuracy_antes': float(upload.accuracy_antes) if upload.accuracy_antes else None,
            'accuracy_depois': float(upload.accuracy_depois),
            'f1_antes': float(upload.f1_antes) if upload.f1_antes else None,
            'f1_depois': float(upload.f1_depois),
            'total_amostras_depois': upload.total_amostras_depois,
        })
    return resultado
