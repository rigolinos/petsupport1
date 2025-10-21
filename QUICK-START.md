# 🚀 Pet Support - Início Rápido

## ✅ Configuração Automática

Tudo está pronto! Execute os comandos abaixo:

### 1. Configurar Ambiente
```bash
node setup.cjs
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Executar Aplicação
```bash
npm run dev
```

### 4. Acessar Aplicação
Abra: http://localhost:3000

## 🔑 Login de Teste

Use estas credenciais para testar:

| Email | Senha | Status |
|-------|-------|--------|
| `caosemfome@test.com` | `password123` | ✅ Verificado |
| `patasunidas@test.com` | `password123` | ✅ Verificado |
| `focinhos@test.com` | `password123` | ⏳ Pendente |

## 🎯 Funcionalidades Disponíveis

- ✅ **Login/Registro** de ONGs
- ✅ **Mural de Doações** com filtros
- ✅ **Gerenciamento de Recursos** (medicamentos, rações, artigos)
- ✅ **Sistema de Solicitações** entre ONGs
- ✅ **Notificações** automáticas
- ✅ **Dashboard** com estatísticas

## 🐛 Solução de Problemas

**Erro de conexão?**
```bash
node test-database.js
```

**Erro de chave?**
- Verifique se o arquivo `.env` foi criado
- Confirme se a chave anon está correta

**Aplicação não carrega?**
- Verifique se executou `npm install`
- Confirme se a porta 3000 está livre

## 📞 Suporte

Se algo não funcionar:
1. Verifique os logs no console (F12)
2. Execute `node configure-database.js` novamente
3. Confirme se o banco Supabase está ativo

---

**🎉 Pronto! Sua ferramenta Pet Support está funcionando!**
