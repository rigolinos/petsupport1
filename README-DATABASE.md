# 🐾 Pet Support - Configuração do Banco de Dados

## ✅ Status: Banco de Dados Implementado!

O banco de dados Supabase foi completamente configurado e integrado à aplicação. Todas as funcionalidades agora usam dados reais em vez de dados mock.

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://mdavprbhfhcunvulwphf.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Para obter sua chave anon:**
1. Acesse: https://supabase.com/dashboard/project/mdavprbhfhcunvulwphf/settings/api
2. Copie a "anon public" key
3. Cole no arquivo .env

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar a Aplicação

```bash
npm run dev
```

### 4. Testar o Banco de Dados (Opcional)

```bash
node test-database.js
```

## 🔐 Dados de Teste

Use estas credenciais para testar:

### Organizações Verificadas
- **Email:** `caosemfome@test.com`
- **Senha:** `password123`
- **Status:** Verificado

- **Email:** `patasunidas@test.com`  
- **Senha:** `password123`
- **Status:** Verificado

### Organização Pendente
- **Email:** `focinhos@test.com`
- **Senha:** `password123`
- **Status:** Pendente (vai para página de aprovação)

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `organizations` - ONGs cadastradas
- `medicines` - Medicamentos para doação
- `rations` - Rações para doação
- `articles` - Artigos diversos (coleiras, brinquedos, etc.)
- `resource_requests` - Solicitações entre organizações
- `messages` - Sistema de mensagens
- `notifications` - Notificações automáticas
- `activity_logs` - Log de atividades

### Funcionalidades Implementadas
- ✅ Autenticação com Supabase Auth
- ✅ Row Level Security (RLS) para segurança
- ✅ CRUD completo para todos os recursos
- ✅ Sistema de notificações automáticas
- ✅ Log de atividades
- ✅ Busca avançada de recursos
- ✅ Tratamento de erros
- ✅ Triggers automáticos

## 🔧 Funcionalidades Automáticas

### Notificações
- Nova solicitação de recurso
- Aprovação/rejeição de solicitações
- Verificação de organizações

### Triggers
- Atualização automática de `updated_at`
- Mudança de status de recursos quando aprovados
- Criação de logs de atividade

### Segurança
- Usuários só veem dados de sua organização
- Organizações verificadas têm acesso completo
- Políticas RLS granulares

## 🐛 Solução de Problemas

### Erro: "Missing Supabase key"
- Verifique se o arquivo `.env` existe
- Confirme se `VITE_SUPABASE_ANON_KEY` está configurado
- Reinicie o servidor de desenvolvimento

### Erro: "Failed to fetch"
- Verifique sua conexão com a internet
- Confirme se a URL do Supabase está correta
- Verifique se o projeto Supabase está ativo

### Erro de Login
- Use as credenciais de teste fornecidas
- Verifique se a organização está verificada
- Confirme se o email está correto

## 📊 Monitoramento

### Logs de Atividade
Todas as ações são registradas na tabela `activity_logs`:
- Criação de recursos
- Solicitações de recursos
- Aprovações/rejeições
- Login/logout

### Notificações
As notificações são criadas automaticamente e podem ser visualizadas na interface.

## 🎯 Próximos Passos

1. **Adicionar Recursos:** Use a interface para adicionar medicamentos, rações e artigos
2. **Solicitar Recursos:** Navegue pelo mural de doações e solicite itens
3. **Gerenciar Solicitações:** Aprove ou rejeite solicitações recebidas
4. **Monitorar Atividades:** Acompanhe logs e notificações

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Execute o script de teste: `node test-database.js`
3. Verifique as configurações do Supabase no dashboard

---

**🎉 Parabéns! Sua ferramenta Pet Support está pronta para uso com banco de dados real!**


