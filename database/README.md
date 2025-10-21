# Configuração do Banco de Dados - Pet Support

## Visão Geral

Este diretório contém todos os scripts SQL necessários para configurar o banco de dados Supabase para a aplicação Pet Support.

## Arquivos

- `schema.sql` - Schema principal do banco de dados com todas as tabelas
- `rls_policies.sql` - Políticas de Row Level Security (RLS) para segurança
- `functions_and_triggers.sql` - Funções e triggers para automação

## Configuração

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://mdavprbhfhcunvulwphf.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. Executar Scripts no Supabase

1. Acesse o painel do Supabase (https://supabase.com/dashboard)
2. Vá para o projeto: `mdavprbhfhcunvulwphf`
3. Acesse a seção "SQL Editor"
4. Execute os scripts na seguinte ordem:

#### a) Schema Principal
```sql
-- Cole o conteúdo do arquivo schema.sql
```

#### b) Políticas RLS
```sql
-- Cole o conteúdo do arquivo rls_policies.sql
```

#### c) Funções e Triggers
```sql
-- Cole o conteúdo do arquivo functions_and_triggers.sql
```

### 3. Configurar Autenticação

1. No painel do Supabase, vá para "Authentication" > "Settings"
2. Configure as seguintes opções:
   - **Site URL**: `http://localhost:5173` (para desenvolvimento)
   - **Redirect URLs**: Adicione `http://localhost:5173/**`
   - **Email Auth**: Habilitado
   - **Phone Auth**: Desabilitado (opcional)

### 4. Configurar Storage (Opcional)

Se você quiser armazenar fotos dos recursos:

1. Vá para "Storage" no painel do Supabase
2. Crie um bucket chamado `resource-photos`
3. Configure as políticas de acesso conforme necessário

## Estrutura do Banco

### Tabelas Principais

- **organizations** - Organizações (ONGs) cadastradas
- **medicines** - Medicamentos disponíveis para doação
- **rations** - Rações disponíveis para doação
- **articles** - Artigos diversos (coleiras, brinquedos, etc.)
- **resource_requests** - Solicitações de recursos entre organizações
- **messages** - Sistema de mensagens
- **notifications** - Notificações do sistema
- **activity_logs** - Log de atividades para auditoria

### Segurança

- Todas as tabelas têm Row Level Security (RLS) habilitado
- Políticas controlam acesso baseado no usuário autenticado
- Usuários só podem ver/editar dados de sua própria organização
- Administradores têm acesso total

### Funcionalidades Automáticas

- Notificações automáticas para novas solicitações
- Atualização de status de recursos quando aprovados
- Log de atividades para auditoria
- Triggers para manter consistência dos dados

## Testando a Configuração

Após executar todos os scripts, você pode testar a configuração:

1. Inicie a aplicação: `npm run dev`
2. Tente fazer login com uma das organizações de exemplo
3. Verifique se os dados são carregados corretamente
4. Teste as funcionalidades de CRUD

## Dados de Exemplo

O script `schema.sql` inclui algumas organizações de exemplo:

- **Cão Sem Fome** (São Paulo, SP) - Verificada
- **Patas Unidas** (Rio de Janeiro, RJ) - Verificada  
- **Focinhos Carentes** (Belo Horizonte, MG) - Pendente

Todas têm a senha: `password123`

## Troubleshooting

### Erro de Chave de API
- Verifique se a variável `VITE_SUPABASE_ANON_KEY` está configurada corretamente
- Certifique-se de que está usando a chave "anon" (pública), não a service role

### Erro de Políticas RLS
- Verifique se todas as políticas foram criadas corretamente
- Teste as funções auxiliares como `get_user_organization_id()`

### Erro de Autenticação
- Verifique se o usuário foi criado corretamente no Supabase Auth
- Verifique se a organização foi associada ao usuário

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase no painel
2. Verifique os logs do navegador (F12)
3. Consulte a documentação do Supabase: https://supabase.com/docs
