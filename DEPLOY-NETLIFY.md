# 🚀 Deploy no Netlify - Pet Support

## 📋 Passos para Deploy

### 1. Preparar o Projeto

```bash
# Instalar dependências
npm install

# Fazer build de produção
npm run build
```

### 2. Configurar Variáveis de Ambiente no Netlify

No painel do Netlify, vá em **Site settings > Environment variables** e adicione:

```
VITE_SUPABASE_URL = https://mdavprbhfhcunvulwphf.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYXZwcmJoZmhjdW52dWx3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjgsImV4cCI6MjA3NjY0ODgyOH0.Zchj5TxKsdNTyPyYg1QBk_624AfKpEDutOzk_Pivxn0
```

### 3. Configurações de Build

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `18`

### 4. Deploy Automático via Git

1. Conecte o repositório GitHub ao Netlify
2. Configure as variáveis de ambiente
3. Faça push para a branch main
4. O deploy será automático

### 5. Deploy Manual

1. Execute `npm run build`
2. Faça upload da pasta `dist` para o Netlify
3. Configure as variáveis de ambiente

## 🔧 Configurações Importantes

### Redirects para SPA
O arquivo `netlify.toml` já está configurado para redirecionar todas as rotas para `index.html`

### Variáveis de Ambiente
As variáveis estão configuradas no `netlify.toml` para produção

### Build Settings
- Framework: Vite
- Node version: 18
- Build command: `npm run build`
- Publish directory: `dist`

## ✅ Checklist de Deploy

- [ ] Repositório conectado ao Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Build funcionando localmente
- [ ] Deploy automático ativado
- [ ] Site funcionando em produção

## 🐛 Solução de Problemas

### Erro de Build
- Verifique se todas as dependências estão instaladas
- Confirme se as variáveis de ambiente estão corretas

### Erro de Variáveis
- Verifique se as variáveis estão configuradas no Netlify
- Confirme se os nomes estão corretos (VITE_)

### Erro de Roteamento
- O arquivo `netlify.toml` já configura os redirects
- Verifique se o build está gerando a pasta `dist`

## 🎯 Após o Deploy

1. Teste o login com as credenciais:
   - `caosemfome@test.com` / `password123`
   - `patasunidas@test.com` / `password123`

2. Verifique todas as funcionalidades:
   - Mural de doações
   - Adicionar recursos
   - Sistema de solicitações

3. Configure domínio personalizado (opcional)

---

**🚀 Sua ferramenta Pet Support estará online!**


