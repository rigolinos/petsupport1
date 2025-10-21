-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Políticas de segurança para controle de acesso aos dados
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

-- =============================================
-- POLÍTICAS PARA ORGANIZATIONS
-- =============================================

-- Política: Usuários podem ver todas as organizações verificadas
CREATE POLICY "Users can view verified organizations" ON organizations
    FOR SELECT USING (status = 'Verificado');

-- Política: Usuários podem ver sua própria organização (mesmo se não verificada)
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (owner_user_id = auth.uid());

-- Política: Usuários podem atualizar apenas sua própria organização
CREATE POLICY "Users can update own organization" ON organizations
    FOR UPDATE USING (owner_user_id = auth.uid());

-- Política: Usuários podem inserir novas organizações (registro)
CREATE POLICY "Users can insert new organizations" ON organizations
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- Política: Apenas administradores podem ver organizações pendentes/rejeitadas
CREATE POLICY "Admins can view all organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA MEDICINES
-- =============================================

-- Política: Usuários podem ver medicamentos de organizações verificadas
CREATE POLICY "Users can view medicines from verified orgs" ON medicines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE id = organization_id 
            AND status = 'Verificado'
        )
    );

-- Política: Usuários podem ver medicamentos de sua própria organização
CREATE POLICY "Users can view own medicines" ON medicines
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Política: Usuários podem gerenciar medicamentos de sua própria organização
CREATE POLICY "Users can manage own medicines" ON medicines
    FOR ALL USING (organization_id = get_user_organization_id());

-- =============================================
-- POLÍTICAS PARA RATIONS
-- =============================================

-- Política: Usuários podem ver rações de organizações verificadas
CREATE POLICY "Users can view rations from verified orgs" ON rations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE id = organization_id 
            AND status = 'Verificado'
        )
    );

-- Política: Usuários podem ver rações de sua própria organização
CREATE POLICY "Users can view own rations" ON rations
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Política: Usuários podem gerenciar rações de sua própria organização
CREATE POLICY "Users can manage own rations" ON rations
    FOR ALL USING (organization_id = get_user_organization_id());

-- =============================================
-- POLÍTICAS PARA ARTICLES
-- =============================================

-- Política: Usuários podem ver artigos de organizações verificadas
CREATE POLICY "Users can view articles from verified orgs" ON articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE id = organization_id 
            AND status = 'Verificado'
        )
    );

-- Política: Usuários podem ver artigos de sua própria organização
CREATE POLICY "Users can view own articles" ON articles
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Política: Usuários podem gerenciar artigos de sua própria organização
CREATE POLICY "Users can manage own articles" ON articles
    FOR ALL USING (organization_id = get_user_organization_id());

-- =============================================
-- POLÍTICAS PARA RESOURCE_REQUESTS
-- =============================================

-- Política: Usuários podem ver solicitações onde são doadores ou solicitantes
CREATE POLICY "Users can view related resource requests" ON resource_requests
    FOR SELECT USING (
        donating_organization_id = get_user_organization_id() OR
        requesting_organization_id = get_user_organization_id()
    );

-- Política: Usuários podem criar solicitações como solicitantes
CREATE POLICY "Users can create resource requests" ON resource_requests
    FOR INSERT WITH CHECK (
        requesting_organization_id = get_user_organization_id() AND
        donating_organization_id != requesting_organization_id
    );

-- Política: Usuários podem atualizar solicitações onde são doadores (aprovar/rejeitar)
CREATE POLICY "Users can update requests as donors" ON resource_requests
    FOR UPDATE USING (
        donating_organization_id = get_user_organization_id()
    );

-- Política: Usuários podem cancelar suas próprias solicitações
CREATE POLICY "Users can cancel own requests" ON resource_requests
    FOR UPDATE USING (
        requesting_organization_id = get_user_organization_id() AND
        status = 'Pendente'
    );

-- =============================================
-- POLÍTICAS PARA MESSAGES
-- =============================================

-- Política: Usuários podem ver mensagens onde são remetentes ou destinatários
CREATE POLICY "Users can view related messages" ON messages
    FOR SELECT USING (
        sender_organization_id = get_user_organization_id() OR
        recipient_organization_id = get_user_organization_id()
    );

-- Política: Usuários podem enviar mensagens de sua organização
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_organization_id = get_user_organization_id() AND
        sender_organization_id != recipient_organization_id
    );

-- Política: Usuários podem marcar mensagens como lidas
CREATE POLICY "Users can mark messages as read" ON messages
    FOR UPDATE USING (
        recipient_organization_id = get_user_organization_id()
    );

-- =============================================
-- POLÍTICAS PARA NOTIFICATIONS
-- =============================================

-- Política: Usuários podem ver notificações de sua organização
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Política: Usuários podem marcar notificações como lidas
CREATE POLICY "Users can mark notifications as read" ON notifications
    FOR UPDATE USING (organization_id = get_user_organization_id());

-- Política: Sistema pode criar notificações (via service role)
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA ACTIVITY_LOGS
-- =============================================

-- Política: Usuários podem ver logs de sua organização
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Política: Sistema pode criar logs (via service role)
CREATE POLICY "System can create activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Política: Apenas administradores podem ver todos os logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS ESPECIAIS PARA ADMINISTRADORES
-- =============================================

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

-- Política: Administradores podem ver todas as organizações
CREATE POLICY "Admins can view all organizations" ON organizations
    FOR SELECT USING (is_admin());

-- Política: Administradores podem ver todos os recursos
CREATE POLICY "Admins can view all medicines" ON medicines
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all rations" ON rations
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all articles" ON articles
    FOR SELECT USING (is_admin());

-- Política: Administradores podem ver todas as solicitações
CREATE POLICY "Admins can view all resource requests" ON resource_requests
    FOR SELECT USING (is_admin());

-- Política: Administradores podem ver todas as mensagens
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (is_admin());

-- Política: Administradores podem ver todas as notificações
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT USING (is_admin());

-- =============================================
-- POLÍTICAS DE PERFORMANCE
-- =============================================

-- Criar índices para melhorar performance das políticas RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_owner_user_id ON organizations(owner_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_organization_id ON medicines(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rations_organization_id ON rations(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_organization_id ON articles(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_requests_donating_org ON resource_requests(donating_organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_requests_requesting_org ON resource_requests(requesting_organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_org ON messages(sender_organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient_org ON messages(recipient_organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Retorna o ID da organização do usuário autenticado';
COMMENT ON FUNCTION is_organization_owner(UUID) IS 'Verifica se o usuário é dono da organização especificada';
COMMENT ON FUNCTION is_organization_verified(UUID) IS 'Verifica se a organização está verificada';
COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário é administrador do sistema';

-- Documentação das políticas principais:
-- 1. Organizações: Usuários veem apenas organizações verificadas + sua própria
-- 2. Recursos: Usuários veem recursos de organizações verificadas + seus próprios
-- 3. Solicitações: Usuários veem apenas solicitações onde participam
-- 4. Mensagens: Usuários veem apenas mensagens onde participam
-- 5. Notificações: Usuários veem apenas suas notificações
-- 6. Logs: Usuários veem apenas logs de sua organização
-- 7. Administradores: Têm acesso total a todos os dados
