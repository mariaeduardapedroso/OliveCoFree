"""
Rotas do Pesquisador - Painel Cientifico

Endpoints:
  GET  /pesquisador/modelo/info       - Info dos modelos
  GET  /pesquisador/templates/{tipo}  - Download template Excel
  POST /pesquisador/upload            - Upload dados + retreino
  GET  /pesquisador/uploads           - Historico de uploads
"""
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario
from ..services.auth_service import get_current_user
from ..services.pesquisador_service import (
    obter_info_modelos,
    obter_info_modelo_unico,
    gerar_template,
    validar_arquivo_doenca,
    validar_arquivo_clima,
    enviar_retreino,
    registrar_upload,
    listar_uploads,
)
from ..schemas.pesquisador import ModeloInfoCombinado, ModeloInfoItem, UploadResponse

router = APIRouter(prefix="/pesquisador", tags=["Pesquisador"])


# ============================================================
# DEPENDENCY: verificar tipo pesquisador
# ============================================================

async def require_pesquisador(current_user: Usuario = Depends(get_current_user)):
    """Verifica se o usuario e pesquisador."""
    if current_user.tipo != 'pesquisador':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a pesquisadores."
        )
    return current_user


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/modelo/info")
async def info_modelos(current_user: Usuario = Depends(require_pesquisador)):
    """Retorna informacoes dos modelos de ambos os microsservicos."""
    modelos = await obter_info_modelos()
    return {"modelos": modelos}


@router.get("/templates/{tipo_template}")
async def download_template(
    tipo_template: str,
    current_user: Usuario = Depends(require_pesquisador),
):
    """
    Download de template Excel para preenchimento.

    Tipos disponiveis:
    - **olho-pavao**: Template de dados de Olho de Pavao
    - **antracnose**: Template de dados de Antracnose
    - **clima**: Template de dados climaticos
    """
    if tipo_template not in ["olho-pavao", "antracnose", "clima"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template invalido. Use: olho-pavao, antracnose ou clima"
        )

    buffer = gerar_template(tipo_template)
    filename = f"template_{tipo_template.replace('-', '_')}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_dados(
    doenca_id: str = Form(...),
    arquivo_doenca: UploadFile = File(...),
    arquivo_clima: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_pesquisador),
):
    """
    Upload de dados de campo e clima para retreinar o modelo.

    Ambos os ficheiros (.xlsx) sao obrigatorios.
    Os dados novos sao combinados com os dados originais do GitHub.
    """
    # 1. Validar extensoes
    for f in [arquivo_doenca, arquivo_clima]:
        if not f.filename.endswith('.xlsx'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ficheiro '{f.filename}' deve ser .xlsx"
            )

    if doenca_id not in ["olho-pavao", "antracnose"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="doenca_id deve ser 'olho-pavao' ou 'antracnose'"
        )

    # 2. Ler ficheiros em DataFrames
    try:
        conteudo_doenca = await arquivo_doenca.read()
        df_doenca = pd.read_excel(BytesIO(conteudo_doenca), header=1)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao ler ficheiro de doenca: {str(e)}"
        )

    try:
        conteudo_clima = await arquivo_clima.read()
        df_clima = pd.read_excel(BytesIO(conteudo_clima))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao ler ficheiro de clima: {str(e)}"
        )

    # 3. Validar colunas
    erros_doenca = validar_arquivo_doenca(df_doenca, doenca_id)
    erros_clima = validar_arquivo_clima(df_clima)

    if erros_doenca or erros_clima:
        detail = {}
        if erros_doenca:
            detail["erros_doenca"] = erros_doenca
        if erros_clima:
            detail["erros_clima"] = erros_clima
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )

    # 4. Inserir dados no banco
    from ..services.pesquisador_service import inserir_dados_upload
    inserir_dados_upload(db, doenca_id, df_doenca, df_clima)

    # 5. Obter metricas antes do retreino
    metricas_antes = await obter_info_modelo_unico(doenca_id)

    # 6. Enviar para microsservico retreinar (dados ja estao no banco)
    try:
        resultado = await enviar_retreino(doenca_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

    # 6. Detectar anos nos dados enviados
    try:
        df_doenca_tmp = df_doenca.copy()
        df_doenca_tmp.columns = [str(c).strip().lower() for c in df_doenca_tmp.columns]
        if 'data' in df_doenca_tmp.columns:
            datas = pd.to_datetime(df_doenca_tmp['data'], errors='coerce')
            anos = sorted(datas.dt.year.dropna().unique().astype(int).tolist())
        else:
            anos = []
    except Exception:
        anos = []

    # 7. Registrar upload no historico
    registrar_upload(
        db=db,
        usuario_id=current_user.id,
        doenca_id=doenca_id,
        amostras_doenca=len(df_doenca),
        amostras_clima=len(df_clima),
        anos_dados=anos,
        accuracy_antes=metricas_antes.get('accuracy') if metricas_antes else None,
        accuracy_depois=resultado.get('accuracy', 0),
        f1_antes=metricas_antes.get('f1_score') if metricas_antes else None,
        f1_depois=resultado.get('f1_score', 0),
        total_amostras_depois=resultado.get('total_amostras_treino', 0),
    )

    # 8. Montar resposta
    metricas_depois = ModeloInfoItem(
        doenca_id=doenca_id,
        modelo=resultado.get('modelo', ''),
        accuracy=resultado.get('accuracy', 0),
        f1_score=resultado.get('f1_score', 0),
        total_amostras_treino=resultado.get('total_amostras_treino', 0),
        anos_treino=resultado.get('anos_treino', []),
        features_utilizadas=resultado.get('features_utilizadas', []),
        thresholds=resultado.get('thresholds', {}),
    )

    metricas_antes_item = None
    if metricas_antes:
        metricas_antes_item = ModeloInfoItem(
            doenca_id=doenca_id,
            modelo=metricas_antes.get('modelo', ''),
            accuracy=metricas_antes.get('accuracy', 0),
            f1_score=metricas_antes.get('f1_score', 0),
            total_amostras_treino=metricas_antes.get('total_amostras_treino', 0),
            anos_treino=metricas_antes.get('anos_treino', []),
            features_utilizadas=metricas_antes.get('features_utilizadas', []),
            thresholds=metricas_antes.get('thresholds', {}),
        )

    return UploadResponse(
        sucesso=True,
        mensagem=f"Modelo de {doenca_id} retreinado com sucesso! "
                 f"{len(df_doenca)} registos de doenca + {len(df_clima)} registos de clima adicionados.",
        metricas_antes=metricas_antes_item,
        metricas_depois=metricas_depois,
    )


@router.get("/uploads")
async def historico_uploads(
    pagina: int = 1,
    tamanho: int = 10,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_pesquisador),
):
    """Retorna historico de uploads de dados com paginacao."""
    return listar_uploads(db, pagina=pagina, tamanho=tamanho)
