-- Schema do banco de dados OlhoPavao
-- Supabase PostgreSQL

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de doenças (referência)
CREATE TABLE IF NOT EXISTS doencas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nome_cientifico VARCHAR(150),
    cor VARCHAR(7) DEFAULT '#22c55e',
    threshold_baixo DECIMAL(5,2) DEFAULT 10.0,
    threshold_alto DECIMAL(5,2) DEFAULT 15.0,
    unidade VARCHAR(50) DEFAULT 'folhas',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir doenças padrão
INSERT INTO doencas (id, nome, nome_cientifico, cor, threshold_baixo, threshold_alto, unidade) VALUES
    ('olho-pavao', 'Olho de Pavão', 'Spilocaea oleagina', '#ec4899', 10.0, 15.0, 'folhas'),
    ('antracnose', 'Antracnose', 'Colletotrichum spp.', '#8b5cf6', 8.0, 12.0, 'oliveiras')
ON CONFLICT (id) DO NOTHING;

-- Tabela de previsões
CREATE TABLE IF NOT EXISTS previsoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    doenca_id VARCHAR(50) NOT NULL REFERENCES doencas(id),
    data DATE NOT NULL,
    semana INTEGER NOT NULL CHECK (semana >= 1 AND semana <= 53),
    ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
    percentual_infectadas DECIMAL(5,2) NOT NULL CHECK (percentual_infectadas >= 0 AND percentual_infectadas <= 100),
    risco VARCHAR(10) NOT NULL CHECK (risco IN ('baixo', 'medio', 'alto')),
    temperatura DECIMAL(5,2),
    humidade DECIMAL(5,2),
    precipitacao DECIMAL(7,2),
    confianca INTEGER CHECK (confianca >= 0 AND confianca <= 100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_previsoes_usuario ON previsoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_previsoes_doenca ON previsoes(doenca_id);
CREATE INDEX IF NOT EXISTS idx_previsoes_data ON previsoes(data);
CREATE INDEX IF NOT EXISTS idx_previsoes_ano_semana ON previsoes(ano, semana);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS usuarios_updated_at ON usuarios;
CREATE TRIGGER usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
