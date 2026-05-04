"""
Serviço de Clima - Integração com Open-Meteo API

Busca dados climáticos reais de Mirandela, Portugal.
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional
from ..config import MIRANDELA_COORDS, OPEN_METEO_URL


def get_condicao_clima(weather_code: int) -> tuple[str, str]:
    """
    Converte código WMO para condição e ícone.
    https://open-meteo.com/en/docs#weathervariables
    """
    condicoes = {
        0: ("Céu limpo", "sun"),
        1: ("Principalmente limpo", "sun"),
        2: ("Parcialmente nublado", "cloud-sun"),
        3: ("Nublado", "cloud"),
        45: ("Nevoeiro", "cloud-fog"),
        48: ("Nevoeiro com geada", "cloud-fog"),
        51: ("Chuvisco leve", "cloud-drizzle"),
        53: ("Chuvisco moderado", "cloud-drizzle"),
        55: ("Chuvisco intenso", "cloud-drizzle"),
        61: ("Chuva leve", "cloud-rain"),
        63: ("Chuva moderada", "cloud-rain"),
        65: ("Chuva forte", "cloud-rain"),
        71: ("Neve leve", "cloud-snow"),
        73: ("Neve moderada", "cloud-snow"),
        75: ("Neve forte", "cloud-snow"),
        80: ("Aguaceiros leves", "cloud-rain"),
        81: ("Aguaceiros moderados", "cloud-rain"),
        82: ("Aguaceiros fortes", "cloud-rain"),
        95: ("Trovoada", "cloud-lightning"),
        96: ("Trovoada com granizo", "cloud-lightning"),
        99: ("Trovoada forte", "cloud-lightning"),
    }
    return condicoes.get(weather_code, ("Desconhecido", "cloud"))


def calcular_favorabilidade(temperatura: float, humidade: float) -> float:
    """
    Calcula o índice de favorabilidade para Olho de Pavão.

    Condições ideais para Spilocaea oleagina:
    - Temperatura: 15-20°C (ótimo ~18°C)
    - Humidade: >80% (ótimo ~90%)
    - Molhamento foliar prolongado
    """
    # Fator temperatura (0-100)
    if 15 <= temperatura <= 20:
        fator_temp = 100 - abs(temperatura - 17.5) * 10
    elif 10 <= temperatura < 15:
        fator_temp = 50 + (temperatura - 10) * 10
    elif 20 < temperatura <= 25:
        fator_temp = 100 - (temperatura - 20) * 15
    else:
        fator_temp = max(0, 30 - abs(temperatura - 17.5) * 3)

    # Fator humidade (0-100)
    if humidade >= 90:
        fator_hum = 100
    elif humidade >= 80:
        fator_hum = 80 + (humidade - 80) * 2
    elif humidade >= 70:
        fator_hum = 50 + (humidade - 70) * 3
    else:
        fator_hum = max(0, humidade * 0.7)

    # Índice combinado (ponderado: humidade mais importante)
    favorabilidade = (fator_temp * 0.4 + fator_hum * 0.6)

    return round(min(100, max(0, favorabilidade)), 1)


async def obter_clima_hoje() -> Optional[dict]:
    """
    Busca dados climáticos do dia atual de Mirandela.
    Retorna dados para o Dashboard.
    """
    try:
        params = {
            "latitude": MIRANDELA_COORDS["latitude"],
            "longitude": MIRANDELA_COORDS["longitude"],
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "weather_code",
                "wind_speed_10m"
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min"
            ],
            "timezone": "Europe/Lisbon",
            "forecast_days": 1
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(OPEN_METEO_URL, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

        current = data.get("current", {})
        daily = data.get("daily", {})

        weather_code = current.get("weather_code", 0)
        condicao, icone = get_condicao_clima(weather_code)

        temperatura = current.get("temperature_2m", 15.0)
        humidade = current.get("relative_humidity_2m", 70.0)

        return {
            "data": datetime.now().strftime("%Y-%m-%d"),
            "temperatura": round(temperatura, 1),
            "temperatura_min": round(daily.get("temperature_2m_min", [temperatura])[0], 1),
            "temperatura_max": round(daily.get("temperature_2m_max", [temperatura])[0], 1),
            "humidade": round(humidade, 1),
            "precipitacao": round(current.get("precipitation", 0.0), 1),
            "vento": round(current.get("wind_speed_10m", 0.0), 1),
            "condicao": condicao,
            "icone": icone,
            "localizacao": "Mirandela, Portugal",
            "favorabilidade": calcular_favorabilidade(temperatura, humidade)
        }

    except Exception as e:
        print(f"Erro ao buscar clima hoje: {e}")
        # Retornar mock em caso de erro
        return _get_mock_clima_hoje()


async def obter_clima_semana(
    semana: int,
    ano: int,
    permitir_mock: bool = True,
) -> Optional[dict]:
    """
    Busca dados climáticos de uma semana específica.
    Calcula médias para usar na previsão.

    Args:
        semana: Número da semana (1-52)
        ano: Ano (ex: 2026)
        permitir_mock: Se True (default), devolve mock em caso de erro.
            Se False, propaga a excepção (usado pelo previsao_service para
            falhar 503 quando Open-Meteo está indisponível e não temos
            como obter os lags climáticos da semana anterior).

    Returns:
        Médias climáticas da semana
    """
    try:
        # Calcular datas da semana usando ISO week (alinhado com isocalendar()
        # do resto do projecto, incluindo o pipeline ML).
        primeira_segunda = datetime.fromisocalendar(ano, semana, 1)
        ultima_domingo = primeira_segunda + timedelta(days=6)
        primeira_segunda_str = primeira_segunda.strftime("%Y-%m-%d")
        ultima_domingo_str = ultima_domingo.strftime("%Y-%m-%d")

        # past_days=92 + forecast_days=16 sao os maximos da Open-Meteo
        # (-92 a +15 dias do hoje). Usamos isto SEM start_date/end_date
        # porque a Open-Meteo recusa a combinacao (mutuamente exclusivos).
        # Filtramos os dias pedidos da resposta abaixo.
        params = {
            "latitude": MIRANDELA_COORDS["latitude"],
            "longitude": MIRANDELA_COORDS["longitude"],
            "daily": [
                "temperature_2m_mean",
                "temperature_2m_max",
                "temperature_2m_min",
                "relative_humidity_2m_mean",
                "precipitation_sum",
                "wind_speed_10m_max"
            ],
            "timezone": "Europe/Lisbon",
            "forecast_days": 16,
            "past_days": 92,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(OPEN_METEO_URL, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

        daily = data.get("daily", {})
        time_list = daily.get("time", [])

        # Indices dos dias da semana pedida (entre primeira_segunda e ultima_domingo)
        idxs = [
            i for i, d in enumerate(time_list)
            if primeira_segunda_str <= d <= ultima_domingo_str
        ]

        # Filtrar listas para os 7 dias da semana pedida
        def _pick(key):
            full = daily.get(key, [])
            return [full[i] for i in idxs if i < len(full)]

        temps = _pick("temperature_2m_mean")
        temps_min = _pick("temperature_2m_min")
        temps_max = _pick("temperature_2m_max")
        humidades = _pick("relative_humidity_2m_mean")
        precipitacoes = _pick("precipitation_sum")
        ventos = _pick("wind_speed_10m_max")

        if not temps:
            if not permitir_mock:
                raise RuntimeError(
                    f"Open-Meteo nao tem dados para a semana {semana}/{ano} "
                    f"(fora do range -92/+15 dias do dia de hoje)"
                )
            return _get_mock_clima_semana(semana, ano)

        temp_media = sum(temps) / len(temps)
        hum_media = sum(humidades) / len(humidades) if humidades else 70.0
        precip_total = sum(precipitacoes) if precipitacoes else 0.0
        precip_media = precip_total / len(precipitacoes) if precipitacoes else 0.0
        vento_medio = sum(ventos) / len(ventos) if ventos else 10.0
        dias_chuva = sum(1 for p in precipitacoes if p > 0.5) if precipitacoes else 0

        return {
            "semana": semana,
            "ano": ano,
            "data_inicio": primeira_segunda.strftime("%Y-%m-%d"),
            "data_fim": ultima_domingo.strftime("%Y-%m-%d"),
            "temperatura_media": round(temp_media, 1),
            "temperatura_min": round(min(temps_min) if temps_min else temp_media - 5, 1),
            "temperatura_max": round(max(temps_max) if temps_max else temp_media + 5, 1),
            "humidade_media": round(hum_media, 1),
            "precipitacao_total": round(precip_total, 1),
            "precipitacao_media": round(precip_media, 2),
            "vento_medio": round(vento_medio, 1),
            "dias_com_chuva": dias_chuva,
            "localizacao": "Mirandela, Portugal",
            "favorabilidade": calcular_favorabilidade(temp_media, hum_media)
        }

    except Exception as e:
        print(f"Erro ao buscar clima da semana: {e}")
        if not permitir_mock:
            raise
        return _get_mock_clima_semana(semana, ano)


async def obter_clima_semanas(semanas: list[tuple[int, int]]) -> list[dict]:
    """
    Busca dados climáticos de várias semanas.

    Args:
        semanas: Lista de tuplas (semana, ano)

    Returns:
        Lista de dados climáticos por semana
    """
    resultados = []
    for semana, ano in semanas:
        dados = await obter_clima_semana(semana, ano)
        if dados:
            resultados.append(dados)
    return resultados


def _get_mock_clima_hoje() -> dict:
    """Mock de dados climáticos do dia (fallback)"""
    import random
    temp = round(random.uniform(10, 20), 1)
    hum = round(random.uniform(60, 90), 1)
    return {
        "data": datetime.now().strftime("%Y-%m-%d"),
        "temperatura": temp,
        "temperatura_min": round(temp - 3, 1),
        "temperatura_max": round(temp + 5, 1),
        "humidade": hum,
        "precipitacao": round(random.uniform(0, 10), 1),
        "vento": round(random.uniform(5, 20), 1),
        "condicao": "Parcialmente nublado",
        "icone": "cloud-sun",
        "localizacao": "Mirandela, Portugal",
        "favorabilidade": calcular_favorabilidade(temp, hum)
    }


def _get_mock_clima_semana(semana: int, ano: int) -> dict:
    """Mock de dados climáticos semanais (fallback)"""
    import random

    # Simular variação sazonal
    if semana <= 10 or semana >= 45:  # Inverno
        temp_base = random.uniform(5, 12)
        hum_base = random.uniform(75, 95)
        precip = random.uniform(10, 40)
    elif 11 <= semana <= 20:  # Primavera
        temp_base = random.uniform(12, 20)
        hum_base = random.uniform(65, 85)
        precip = random.uniform(5, 25)
    elif 21 <= semana <= 35:  # Verão
        temp_base = random.uniform(22, 32)
        hum_base = random.uniform(40, 65)
        precip = random.uniform(0, 10)
    else:  # Outono
        temp_base = random.uniform(12, 20)
        hum_base = random.uniform(70, 90)
        precip = random.uniform(10, 35)

    primeira_segunda = datetime.fromisocalendar(ano, semana, 1)
    ultima_domingo = primeira_segunda + timedelta(days=6)

    return {
        "semana": semana,
        "ano": ano,
        "data_inicio": primeira_segunda.strftime("%Y-%m-%d"),
        "data_fim": ultima_domingo.strftime("%Y-%m-%d"),
        "temperatura_media": round(temp_base, 1),
        "temperatura_min": round(temp_base - 4, 1),
        "temperatura_max": round(temp_base + 6, 1),
        "humidade_media": round(hum_base, 1),
        "precipitacao_total": round(precip, 1),
        "precipitacao_media": round(precip / 7, 2),
        "vento_medio": round(random.uniform(8, 18), 1),
        "dias_com_chuva": random.randint(0, 5),
        "localizacao": "Mirandela, Portugal",
        "favorabilidade": calcular_favorabilidade(temp_base, hum_base)
    }
