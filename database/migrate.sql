-- =============================================
-- SCRIPT DE MIGRAÇÃO COMPLETO
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Este script combina todos os scripts necessários para configurar o banco
-- Execute-o em uma única operação no Supabase SQL Editor

-- =============================================
-- 1. SCHEMA PRINCIPAL
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
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE rations ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =============================================

-- Função para obter o ID da organização do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM organizations 
        WHERE owner_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é dono da organização
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS(
            SELECT 1 
            FROM organizations 
            WHERE id = org_id 
            AND owner_user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se a organização está verificada
CREATE OR REPLACE FUNCTION is_organization_verified(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT status = 'Verificado' 
        FROM organizations 
        WHERE id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 
            FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- Políticas para organizations
CREATE POLICY "Users can view verified organizations" ON organizations
    FOR SELECT USING (status = 'Verificado');

CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can update own organization" ON organizations
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert new organizations" ON organizations
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Admins can view all organizations" ON organizations
    FOR ALL USING (is_admin());

-- Políticas para medicines
CREATE POLICY "Users can view medicines from verified orgs" ON medicines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE id = organization_id 
            AND status = 'Verificado'
        )
    );

CREATE POLICY "Users can view own medicines" ON medicines
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage own medicines" ON medicines
    FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para rations
CREATE POLICY "Users can view rations from verified orgs" ON rations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE id = organization_id 
            AND status = 'Verificado'
        )
    );

CREATE POLICY "Users can view own rations" ON rations
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage own rations" ON rations
    FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para articles
CREATE POLICY "Users can view articles from verified orgs" ON articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE id = organization_id 
            AND status = 'Verificado'
        )
    );

CREATE POLICY "Users can view own articles" ON articles
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage own articles" ON articles
    FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para resource_requests
CREATE POLICY "Users can view related resource requests" ON resource_requests
    FOR SELECT USING (
        donating_organization_id = get_user_organization_id() OR
        requesting_organization_id = get_user_organization_id()
    );

CREATE POLICY "Users can create resource requests" ON resource_requests
    FOR INSERT WITH CHECK (
        requesting_organization_id = get_user_organization_id() AND
        donating_organization_id != requesting_organization_id
    );

CREATE POLICY "Users can update requests as donors" ON resource_requests
    FOR UPDATE USING (
        donating_organization_id = get_user_organization_id()
    );

CREATE POLICY "Users can cancel own requests" ON resource_requests
    FOR UPDATE USING (
        requesting_organization_id = get_user_organization_id() AND
        status = 'Pendente'
    );

-- Políticas para messages
CREATE POLICY "Users can view related messages" ON messages
    FOR SELECT USING (
        sender_organization_id = get_user_organization_id() OR
        recipient_organization_id = get_user_organization_id()
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_organization_id = get_user_organization_id() AND
        sender_organization_id != recipient_organization_id
    );

CREATE POLICY "Users can mark messages as read" ON messages
    FOR UPDATE USING (
        recipient_organization_id = get_user_organization_id()
    );

-- Políticas para notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can mark notifications as read" ON notifications
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Políticas para activity_logs
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "System can create activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity logs" ON activity_logs
    FOR SELECT USING (is_admin());

-- =============================================
-- FUNÇÕES DE NEGÓCIO
-- =============================================

-- Função para criar notificação automática
CREATE OR REPLACE FUNCTION create_notification(
    p_organization_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'general',
    p_action_url VARCHAR(500) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        organization_id,
        title,
        message,
        type,
        action_url,
        metadata
    ) VALUES (
        p_organization_id,
        p_title,
        p_message,
        p_type,
        p_action_url,
        p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar log de atividade
CREATE OR REPLACE FUNCTION log_activity(
    p_organization_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        p_organization_id,
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de uma organização
CREATE OR REPLACE FUNCTION get_organization_stats(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
    medicines_count INTEGER;
    rations_count INTEGER;
    articles_count INTEGER;
    requests_sent INTEGER;
    requests_received INTEGER;
    messages_sent INTEGER;
    messages_received INTEGER;
    notifications_unread INTEGER;
BEGIN
    -- Contar recursos
    SELECT COUNT(*) INTO medicines_count FROM medicines WHERE organization_id = p_organization_id;
    SELECT COUNT(*) INTO rations_count FROM rations WHERE organization_id = p_organization_id;
    SELECT COUNT(*) INTO articles_count FROM articles WHERE organization_id = p_organization_id;
    
    -- Contar solicitações
    SELECT COUNT(*) INTO requests_sent FROM resource_requests WHERE requesting_organization_id = p_organization_id;
    SELECT COUNT(*) INTO requests_received FROM resource_requests WHERE donating_organization_id = p_organization_id;
    
    -- Contar mensagens
    SELECT COUNT(*) INTO messages_sent FROM messages WHERE sender_organization_id = p_organization_id;
    SELECT COUNT(*) INTO messages_received FROM messages WHERE recipient_organization_id = p_organization_id;
    
    -- Contar notificações não lidas
    SELECT COUNT(*) INTO notifications_unread FROM notifications WHERE organization_id = p_organization_id AND is_read = FALSE;
    
    -- Montar JSON com estatísticas
    stats := jsonb_build_object(
        'resources', jsonb_build_object(
            'medicines', medicines_count,
            'rations', rations_count,
            'articles', articles_count,
            'total', medicines_count + rations_count + articles_count
        ),
        'requests', jsonb_build_object(
            'sent', requests_sent,
            'received', requests_received
        ),
        'messages', jsonb_build_object(
            'sent', messages_sent,
            'received', messages_received
        ),
        'notifications', jsonb_build_object(
            'unread', notifications_unread
        )
    );
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar recursos com filtros avançados
CREATE OR REPLACE FUNCTION search_resources(
    p_search_query TEXT DEFAULT NULL,
    p_resource_type resource_type DEFAULT NULL,
    p_category article_category DEFAULT NULL,
    p_state VARCHAR(2) DEFAULT NULL,
    p_urgent_only BOOLEAN DEFAULT FALSE,
    p_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    organization_name VARCHAR(255),
    organization_city VARCHAR(100),
    organization_state VARCHAR(2),
    resource_type resource_type,
    name VARCHAR(255),
    status resource_status,
    created_at TIMESTAMP WITH TIME ZONE,
    photo_base64 TEXT,
    expiration_date DATE,
    is_urgent BOOLEAN,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH resource_data AS (
        -- Medicamentos
        SELECT 
            m.id,
            m.organization_id,
            o.name as organization_name,
            o.city as organization_city,
            o.state as organization_state,
            'medicines'::resource_type as resource_type,
            m.name,
            m.status,
            m.created_at,
            m.photo_base64,
            m.expiration_date,
            (m.expiration_date <= CURRENT_DATE + INTERVAL '90 days') as is_urgent,
            jsonb_build_object(
                'active_ingredient', m.active_ingredient,
                'quantity', m.quantity,
                'observations', m.observations
            ) as metadata
        FROM medicines m
        JOIN organizations o ON m.organization_id = o.id
        WHERE o.status = 'Verificado'
        AND (p_resource_type IS NULL OR p_resource_type = 'medicines')
        AND (p_organization_id IS NULL OR m.organization_id = p_organization_id)
        
        UNION ALL
        
        -- Rações
        SELECT 
            r.id,
            r.organization_id,
            o.name as organization_name,
            o.city as organization_city,
            o.state as organization_state,
            'rations'::resource_type as resource_type,
            r.brand as name,
            r.status,
            r.created_at,
            r.photo_base64,
            r.expiration_date,
            (r.expiration_date <= CURRENT_DATE + INTERVAL '90 days') as is_urgent,
            jsonb_build_object(
                'quantity_kg', r.quantity_kg,
                'observations', r.observations,
                'animal_type', r.animal_type,
                'age_group', r.age_group
            ) as metadata
        FROM rations r
        JOIN organizations o ON r.organization_id = o.id
        WHERE o.status = 'Verificado'
        AND (p_resource_type IS NULL OR p_resource_type = 'rations')
        AND (p_organization_id IS NULL OR r.organization_id = p_organization_id)
        
        UNION ALL
        
        -- Artigos
        SELECT 
            a.id,
            a.organization_id,
            o.name as organization_name,
            o.city as organization_city,
            o.state as organization_state,
            'articles'::resource_type as resource_type,
            a.name,
            a.status,
            a.created_at,
            a.photo_base64,
            NULL::DATE as expiration_date,
            FALSE as is_urgent,
            jsonb_build_object(
                'category', a.category,
                'quantity', a.quantity,
                'condition', a.condition,
                'size_specification', a.size_specification,
                'observations', a.observations
            ) as metadata
        FROM articles a
        JOIN organizations o ON a.organization_id = o.id
        WHERE o.status = 'Verificado'
        AND (p_resource_type IS NULL OR p_resource_type = 'articles')
        AND (p_category IS NULL OR a.category = p_category)
        AND (p_organization_id IS NULL OR a.organization_id = p_organization_id)
    )
    SELECT * FROM resource_data
    WHERE 
        (p_search_query IS NULL OR name ILIKE '%' || p_search_query || '%')
        AND (p_state IS NULL OR organization_state = p_state)
        AND (NOT p_urgent_only OR is_urgent)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS AUTOMÁTICOS
-- =============================================

-- Trigger para notificar quando uma nova solicitação é criada
CREATE OR REPLACE FUNCTION notify_new_resource_request()
RETURNS TRIGGER AS $$
DECLARE
    donor_org_name VARCHAR(255);
    requester_org_name VARCHAR(255);
    resource_name VARCHAR(255);
    resource_type_name VARCHAR(50);
BEGIN
    -- Obter nomes das organizações
    SELECT name INTO donor_org_name FROM organizations WHERE id = NEW.donating_organization_id;
    SELECT name INTO requester_org_name FROM organizations WHERE id = NEW.requesting_organization_id;
    
    -- Obter nome do recurso
    CASE NEW.resource_type
        WHEN 'medicines' THEN
            SELECT name INTO resource_name FROM medicines WHERE id = NEW.resource_id;
            resource_type_name := 'medicamento';
        WHEN 'rations' THEN
            SELECT brand INTO resource_name FROM rations WHERE id = NEW.resource_id;
            resource_type_name := 'ração';
        WHEN 'articles' THEN
            SELECT name INTO resource_name FROM articles WHERE id = NEW.resource_id;
            resource_type_name := 'artigo';
    END CASE;
    
    -- Criar notificação para a organização doadora
    PERFORM create_notification(
        NEW.donating_organization_id,
        'Nova Solicitação de Recurso',
        'A organização ' || requester_org_name || ' solicitou o ' || resource_type_name || ' "' || resource_name || '".',
        'request',
        '/solicitacoes/' || NEW.id,
        jsonb_build_object(
            'request_id', NEW.id,
            'requester_org', requester_org_name,
            'resource_name', resource_name,
            'resource_type', NEW.resource_type
        )
    );
    
    -- Log da atividade
    PERFORM log_activity(
        NEW.requesting_organization_id,
        'resource_request_created',
        NEW.resource_type,
        NEW.resource_id,
        jsonb_build_object(
            'request_id', NEW.id,
            'donor_org_id', NEW.donating_organization_id,
            'donor_org_name', donor_org_name
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_resource_request_trigger
    AFTER INSERT ON resource_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_resource_request();

-- Trigger para notificar quando status de solicitação muda
CREATE OR REPLACE FUNCTION notify_resource_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
    donor_org_name VARCHAR(255);
    requester_org_name VARCHAR(255);
    resource_name VARCHAR(255);
    resource_type_name VARCHAR(50);
    status_text VARCHAR(50);
BEGIN
    -- Só processar se o status mudou
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Obter nomes das organizações
    SELECT name INTO donor_org_name FROM organizations WHERE id = NEW.donating_organization_id;
    SELECT name INTO requester_org_name FROM organizations WHERE id = NEW.requesting_organization_id;
    
    -- Obter nome do recurso
    CASE NEW.resource_type
        WHEN 'medicines' THEN
            SELECT name INTO resource_name FROM medicines WHERE id = NEW.resource_id;
            resource_type_name := 'medicamento';
        WHEN 'rations' THEN
            SELECT brand INTO resource_name FROM rations WHERE id = NEW.resource_id;
            resource_type_name := 'ração';
        WHEN 'articles' THEN
            SELECT name INTO resource_name FROM articles WHERE id = NEW.resource_id;
            resource_type_name := 'artigo';
    END CASE;
    
    -- Definir texto do status
    CASE NEW.status
        WHEN 'Aprovado' THEN status_text := 'aprovada';
        WHEN 'Rejeitado' THEN status_text := 'rejeitada';
        ELSE status_text := 'atualizada';
    END CASE;
    
    -- Criar notificação para a organização solicitante
    PERFORM create_notification(
        NEW.requesting_organization_id,
        'Solicitação ' || status_text,
        'Sua solicitação do ' || resource_type_name || ' "' || resource_name || '" foi ' || status_text || ' por ' || donor_org_name || '.',
        CASE NEW.status
            WHEN 'Aprovado' THEN 'approval'
            WHEN 'Rejeitado' THEN 'rejection'
            ELSE 'general'
        END,
        '/minhas-solicitacoes/' || NEW.id,
        jsonb_build_object(
            'request_id', NEW.id,
            'donor_org', donor_org_name,
            'resource_name', resource_name,
            'resource_type', NEW.resource_type,
            'status', NEW.status
        )
    );
    
    -- Log da atividade
    PERFORM log_activity(
        NEW.donating_organization_id,
        'resource_request_' || NEW.status::TEXT,
        NEW.resource_type,
        NEW.resource_id,
        jsonb_build_object(
            'request_id', NEW.id,
            'requester_org_id', NEW.requesting_organization_id,
            'requester_org_name', requester_org_name,
            'old_status', OLD.status,
            'new_status', NEW.status
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_resource_request_status_change_trigger
    AFTER UPDATE ON resource_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_resource_request_status_change();

-- =============================================
-- COMENTÁRIOS FINAIS
-- =============================================

-- Script de migração completo executado com sucesso!
-- O banco de dados está pronto para uso com a aplicação Pet Support.
