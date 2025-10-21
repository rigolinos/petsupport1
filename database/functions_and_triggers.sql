-- =============================================
-- FUNÇÕES E TRIGGERS ADICIONAIS
-- Funções de negócio e triggers para automação
-- =============================================

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

-- Função para enviar mensagem automática
CREATE OR REPLACE FUNCTION send_message(
    p_sender_organization_id UUID,
    p_recipient_organization_id UUID,
    p_subject VARCHAR(255),
    p_content TEXT,
    p_resource_request_id UUID DEFAULT NULL,
    p_message_type VARCHAR(50) DEFAULT 'general'
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO messages (
        sender_organization_id,
        recipient_organization_id,
        subject,
        content,
        resource_request_id,
        message_type
    ) VALUES (
        p_sender_organization_id,
        p_recipient_organization_id,
        p_subject,
        p_content,
        p_resource_request_id,
        p_message_type
    ) RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se uma organização pode solicitar um recurso
CREATE OR REPLACE FUNCTION can_request_resource(
    p_requesting_organization_id UUID,
    p_resource_type resource_type,
    p_resource_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    resource_org_id UUID;
    requesting_org_status organization_status;
BEGIN
    -- Verificar se a organização solicitante está verificada
    SELECT status INTO requesting_org_status
    FROM organizations
    WHERE id = p_requesting_organization_id;
    
    IF requesting_org_status != 'Verificado' THEN
        RETURN FALSE;
    END IF;
    
    -- Obter a organização dona do recurso
    CASE p_resource_type
        WHEN 'medicines' THEN
            SELECT organization_id INTO resource_org_id FROM medicines WHERE id = p_resource_id;
        WHEN 'rations' THEN
            SELECT organization_id INTO resource_org_id FROM rations WHERE id = p_resource_id;
        WHEN 'articles' THEN
            SELECT organization_id INTO resource_org_id FROM articles WHERE id = p_resource_id;
    END CASE;
    
    -- Verificar se o recurso existe e se não é da mesma organização
    IF resource_org_id IS NULL OR resource_org_id = p_requesting_organization_id THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se já existe uma solicitação pendente para este recurso
    IF EXISTS (
        SELECT 1 
        FROM resource_requests 
        WHERE resource_id = p_resource_id 
        AND resource_type = p_resource_type 
        AND requesting_organization_id = p_requesting_organization_id
        AND status = 'Pendente'
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
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

-- Trigger para notificar quando uma organização é verificada
CREATE OR REPLACE FUNCTION notify_organization_verified()
RETURNS TRIGGER AS $$
BEGIN
    -- Só processar se o status mudou para 'Verificado'
    IF OLD.status != 'Verificado' AND NEW.status = 'Verificado' THEN
        -- Criar notificação para a organização
        PERFORM create_notification(
            NEW.id,
            'Organização Verificada!',
            'Parabéns! Sua organização "' || NEW.name || '" foi verificada e agora você pode usar todas as funcionalidades da plataforma.',
            'verification',
            '/dashboard',
            jsonb_build_object(
                'organization_id', NEW.id,
                'organization_name', NEW.name,
                'verified_at', NEW.verified_at
            )
        );
        
        -- Log da atividade
        PERFORM log_activity(
            NEW.id,
            'organization_verified',
            NULL,
            NULL,
            jsonb_build_object(
                'organization_id', NEW.id,
                'organization_name', NEW.name,
                'verified_by', NEW.verified_by
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_organization_verified_trigger
    AFTER UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION notify_organization_verified();

-- Trigger para log automático de criação de recursos
CREATE OR REPLACE FUNCTION log_resource_creation()
RETURNS TRIGGER AS $$
DECLARE
    resource_name VARCHAR(255);
    resource_type_name VARCHAR(50);
BEGIN
    -- Obter nome do recurso
    CASE TG_TABLE_NAME
        WHEN 'medicines' THEN
            resource_name := NEW.name;
            resource_type_name := 'medicamento';
        WHEN 'rations' THEN
            resource_name := NEW.brand;
            resource_type_name := 'ração';
        WHEN 'articles' THEN
            resource_name := NEW.name;
            resource_type_name := 'artigo';
    END CASE;
    
    -- Log da atividade
    PERFORM log_activity(
        NEW.organization_id,
        'resource_created',
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object(
            'resource_name', resource_name,
            'resource_type', resource_type_name,
            'quantity', CASE 
                WHEN 'quantity_kg' IN (SELECT column_name FROM information_schema.columns WHERE table_name = TG_TABLE_NAME) 
                THEN NEW.quantity_kg::TEXT
                ELSE NEW.quantity::TEXT
            END
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas de recursos
CREATE TRIGGER log_medicine_creation_trigger
    AFTER INSERT ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION log_resource_creation();

CREATE TRIGGER log_ration_creation_trigger
    AFTER INSERT ON rations
    FOR EACH ROW
    EXECUTE FUNCTION log_resource_creation();

CREATE TRIGGER log_article_creation_trigger
    AFTER INSERT ON articles
    FOR EACH ROW
    EXECUTE FUNCTION log_resource_creation();

-- =============================================
-- FUNÇÕES DE UTILIDADE
-- =============================================

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
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON FUNCTION create_notification IS 'Cria uma notificação para uma organização';
COMMENT ON FUNCTION log_activity IS 'Registra uma atividade no log do sistema';
COMMENT ON FUNCTION send_message IS 'Envia uma mensagem entre organizações';
COMMENT ON FUNCTION can_request_resource IS 'Verifica se uma organização pode solicitar um recurso';
COMMENT ON FUNCTION get_organization_stats IS 'Retorna estatísticas de uma organização';
COMMENT ON FUNCTION search_resources IS 'Busca recursos com filtros avançados';

COMMENT ON FUNCTION notify_new_resource_request IS 'Notifica quando uma nova solicitação é criada';
COMMENT ON FUNCTION notify_resource_request_status_change IS 'Notifica quando status de solicitação muda';
COMMENT ON FUNCTION notify_organization_verified IS 'Notifica quando uma organização é verificada';
COMMENT ON FUNCTION log_resource_creation IS 'Registra criação de recursos no log';
