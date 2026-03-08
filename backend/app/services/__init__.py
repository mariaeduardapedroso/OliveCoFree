# Services
from .clima_service import (
    obter_clima_hoje,
    obter_clima_semana,
    obter_clima_semanas,
    calcular_favorabilidade
)
from .auth_service import (
    get_current_user,
    authenticate_user,
    create_user,
    create_access_token
)
from .previsao_service import (
    criar_previsao,
    listar_previsoes,
    obter_previsao,
    deletar_previsao,
    obter_ultima_previsao,
    listar_doencas
)
