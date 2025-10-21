-- =============================================
-- PET SUPPORT DATABASE SCHEMA
-- Sistema de suporte para organizações que cuidam de animais
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

-- Status das organizações
CREATE TYPE organization_status AS ENUM ('Pendente', 'Verificado', 'Rejeitado');

-- Status dos recursos
CREATE TYPE resource_status AS ENUM ('Disponível', 'Solicitado', 'Doado');

-- Status das solicitações
CREATE TYPE application_status AS ENUM ('Pendente', 'Aprovado', 'Rejeitado');

-- Condição dos artigos
CREATE TYPE article_condition AS ENUM ('Novo', 'Usado');

-- Categorias dos artigos
CREATE TYPE article_category AS ENUM (
    'Coleiras e Guias',
    'Acessórios e Abrigo', 
    'Higiene e Limpeza',
    'Outros'
);

-- Tipos de recursos
CREATE TYPE resource_type AS ENUM ('medicines', 'rations', 'articles');

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- Tabela de organizações (ONGs)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    
    -- Contato
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Autenticação e status
    password_hash TEXT NOT NULL,
    status organization_status DEFAULT 'Pendente',
    owner_user_id UUID NOT NULL,
    
    -- Metadados
    type VARCHAR(20) DEFAULT 'organization',
    
    -- Campos adicionais para ONGs
    description TEXT,
    website VARCHAR(255),
    address TEXT,
    zip_code VARCHAR(10),
    responsible_name VARCHAR(255),
    responsible_phone VARCHAR(20),
    
    -- Verificação
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    
    -- Índices
    CONSTRAINT valid_cnpj CHECK (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'),
    CONSTRAINT valid_email CHECK (contact_email ~ '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT valid_state CHECK (LENGTH(state) = 2)
);

-- Tabela de medicamentos
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamento
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados do medicamento
    name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255) NOT NULL,
    quantity VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    observations TEXT,
    
    -- Status e foto
    status resource_status DEFAULT 'Disponível',
    photo_base64 TEXT,
    
    -- Metadados
    batch_number VARCHAR(100),
    manufacturer VARCHAR(255),
    dosage VARCHAR(100),
    
    -- Índices
    CONSTRAINT valid_expiration_date CHECK (expiration_date > CURRENT_DATE)
);

-- Tabela de rações
CREATE TABLE rations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamento
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados da ração
    brand VARCHAR(255) NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    expiration_date DATE NOT NULL,
    observations TEXT,
    
    -- Status e foto
    status resource_status DEFAULT 'Disponível',
    photo_base64 TEXT,
    
    -- Metadados
    animal_type VARCHAR(100), -- Cão, Gato, etc.
    age_group VARCHAR(100), -- Filhote, Adulto, Sênior
    special_diet BOOLEAN DEFAULT FALSE, -- Dieta especial, hipoalergênica, etc.
    
    -- Índices
    CONSTRAINT valid_quantity CHECK (quantity_kg > 0),
    CONSTRAINT valid_expiration_date CHECK (expiration_date > CURRENT_DATE)
);

-- Tabela de artigos
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamento
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados do artigo
    name VARCHAR(255) NOT NULL,
    category article_category NOT NULL,
    quantity INTEGER NOT NULL,
    condition article_condition NOT NULL,
    size_specification VARCHAR(100),
    observations TEXT,
    
    -- Status e foto
    status resource_status DEFAULT 'Disponível',
    photo_base64 TEXT,
    
    -- Metadados
    brand VARCHAR(255),
    color VARCHAR(50),
    material VARCHAR(100),
    
    -- Índices
    CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Tabela de solicitações de recursos
CREATE TABLE resource_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamentos
    resource_id UUID NOT NULL,
    resource_type resource_type NOT NULL,
    donating_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requesting_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Status e dados da solicitação
    status application_status DEFAULT 'Pendente',
    request_message TEXT,
    response_message TEXT,
    
    -- Metadados
    requested_quantity INTEGER, -- Quantidade solicitada (pode ser diferente da disponível)
    approved_quantity INTEGER, -- Quantidade aprovada
    
    -- Índices
    CONSTRAINT different_organizations CHECK (donating_organization_id != requesting_organization_id),
    CONSTRAINT valid_quantities CHECK (
        (requested_quantity IS NULL OR requested_quantity > 0) AND
        (approved_quantity IS NULL OR approved_quantity > 0)
    )
);

-- =============================================
-- TABELAS DE SISTEMA
-- =============================================

-- Tabela de mensagens entre organizações
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamentos
    sender_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_request_id UUID REFERENCES resource_requests(id) ON DELETE SET NULL,
    
    -- Conteúdo
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    message_type VARCHAR(50) DEFAULT 'general', -- general, request, response, notification
    
    -- Índices
    CONSTRAINT different_sender_recipient CHECK (sender_organization_id != recipient_organization_id)
);

-- Tabela de notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamento
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- request, approval, rejection, system
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    action_url VARCHAR(500), -- URL para ação relacionada
    metadata JSONB -- Dados adicionais em formato JSON
);

-- Tabela de logs de atividades
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relacionamento
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Dados da atividade
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    
    -- Metadados
    ip_address INET,
    user_agent TEXT
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para organizations
CREATE INDEX idx_organizations_email ON organizations(contact_email);
CREATE INDEX idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_city_state ON organizations(city, state);

-- Índices para medicines
CREATE INDEX idx_medicines_organization ON medicines(organization_id);
CREATE INDEX idx_medicines_status ON medicines(status);
CREATE INDEX idx_medicines_expiration ON medicines(expiration_date);
CREATE INDEX idx_medicines_name ON medicines(name);

-- Índices para rations
CREATE INDEX idx_rations_organization ON rations(organization_id);
CREATE INDEX idx_rations_status ON rations(status);
CREATE INDEX idx_rations_expiration ON rations(expiration_date);
CREATE INDEX idx_rations_brand ON rations(brand);

-- Índices para articles
CREATE INDEX idx_articles_organization ON articles(organization_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_name ON articles(name);

-- Índices para resource_requests
CREATE INDEX idx_resource_requests_donating ON resource_requests(donating_organization_id);
CREATE INDEX idx_resource_requests_requesting ON resource_requests(requesting_organization_id);
CREATE INDEX idx_resource_requests_status ON resource_requests(status);
CREATE INDEX idx_resource_requests_resource ON resource_requests(resource_type, resource_id);

-- Índices para messages
CREATE INDEX idx_messages_sender ON messages(sender_organization_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_organization_id);
CREATE INDEX idx_messages_request ON messages(resource_request_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Índices para notifications
CREATE INDEX idx_notifications_organization ON notifications(organization_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Índices para activity_logs
CREATE INDEX idx_activity_logs_organization ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rations_updated_at BEFORE UPDATE ON rations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_requests_updated_at BEFORE UPDATE ON resource_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para buscar recursos por tipo e ID
CREATE OR REPLACE FUNCTION get_resource_by_type_and_id(
    p_resource_type resource_type,
    p_resource_id UUID
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    status resource_status,
    created_at TIMESTAMP WITH TIME ZONE,
    photo_base64 TEXT
) AS $$
BEGIN
    CASE p_resource_type
        WHEN 'medicines' THEN
            RETURN QUERY SELECT m.id, m.organization_id, m.status, m.created_at, m.photo_base64 FROM medicines m WHERE m.id = p_resource_id;
        WHEN 'rations' THEN
            RETURN QUERY SELECT r.id, r.organization_id, r.status, r.created_at, r.photo_base64 FROM rations r WHERE r.id = p_resource_id;
        WHEN 'articles' THEN
            RETURN QUERY SELECT a.id, a.organization_id, a.status, a.created_at, a.photo_base64 FROM articles a WHERE a.id = p_resource_id;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status do recurso quando solicitação é aprovada
CREATE OR REPLACE FUNCTION update_resource_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a solicitação foi aprovada, atualizar o status do recurso para "Doado"
    IF NEW.status = 'Aprovado' AND OLD.status != 'Aprovado' THEN
        CASE NEW.resource_type
            WHEN 'medicines' THEN
                UPDATE medicines SET status = 'Doado' WHERE id = NEW.resource_id;
            WHEN 'rations' THEN
                UPDATE rations SET status = 'Doado' WHERE id = NEW.resource_id;
            WHEN 'articles' THEN
                UPDATE articles SET status = 'Doado' WHERE id = NEW.resource_id;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para atualizar status do recurso
CREATE TRIGGER update_resource_status_trigger
    AFTER UPDATE ON resource_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_status_on_approval();

-- =============================================
-- DADOS INICIAIS (SEED DATA)
-- =============================================

-- Inserir algumas organizações de exemplo
INSERT INTO organizations (
    name, cnpj, city, state, contact_email, contact_phone, 
    password_hash, status, owner_user_id, description
) VALUES 
(
    'Cão Sem Fome',
    '11.111.111/0001-11',
    'São Paulo',
    'SP',
    'caosemfome@test.com',
    '11999999999',
    crypt('password123', gen_salt('bf')),
    'Verificado',
    uuid_generate_v4(),
    'ONG dedicada ao cuidado e adoção de cães abandonados'
),
(
    'Patas Unidas',
    '22.222.222/0001-22',
    'Rio de Janeiro',
    'RJ',
    'patasunidas@test.com',
    '21999999999',
    crypt('password123', gen_salt('bf')),
    'Verificado',
    uuid_generate_v4(),
    'Organização que trabalha com resgate e reabilitação de animais'
),
(
    'Focinhos Carentes',
    '33.333.333/0001-33',
    'Belo Horizonte',
    'MG',
    'focinhos@test.com',
    '31999999999',
    crypt('password123', gen_salt('bf')),
    'Pendente',
    uuid_generate_v4(),
    'Abrigo temporário para gatos e cães em situação de risco'
);

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE organizations IS 'Tabela principal das organizações (ONGs) que utilizam o sistema';
COMMENT ON TABLE medicines IS 'Medicamentos disponíveis para doação';
COMMENT ON TABLE rations IS 'Rações disponíveis para doação';
COMMENT ON TABLE articles IS 'Artigos diversos (coleiras, brinquedos, etc.) disponíveis para doação';
COMMENT ON TABLE resource_requests IS 'Solicitações de recursos entre organizações';
COMMENT ON TABLE messages IS 'Sistema de mensagens entre organizações';
COMMENT ON TABLE notifications IS 'Notificações do sistema para as organizações';
COMMENT ON TABLE activity_logs IS 'Log de atividades do sistema para auditoria';

COMMENT ON COLUMN organizations.password_hash IS 'Hash da senha usando bcrypt';
COMMENT ON COLUMN organizations.verified_at IS 'Data e hora da verificação da organização';
COMMENT ON COLUMN organizations.verified_by IS 'ID do usuário que verificou a organização';

COMMENT ON COLUMN resource_requests.requested_quantity IS 'Quantidade solicitada (pode ser menor que a disponível)';
COMMENT ON COLUMN resource_requests.approved_quantity IS 'Quantidade aprovada pelo doador';
