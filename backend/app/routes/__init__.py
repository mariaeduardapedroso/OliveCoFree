# Routes
from .clima import router as clima_router
from .auth import router as auth_router
from .previsao import router as previsao_router

__all__ = ["clima_router", "auth_router", "previsao_router"]
