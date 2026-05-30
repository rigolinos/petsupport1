// Script para configurar o banco de dados (CommonJS)
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Configurando Pet Support com banco de dados...\n');

// Configurações
const supabaseUrl = 'https://mdavprbhfhcunvulwphf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYXZwcmJoZmhjdW52dWx3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjgsImV4cCI6MjA3NjY0ODgyOH0.Zchj5TxKsdNTyPyYg1QBk_624AfKpEDutOzk_Pivxn0';

// 1. Criar arquivo .env
console.log('1️⃣ Criando arquivo .env...');
const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://mdavprbhfhcunvulwphf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYXZwcmJoZmhjdW52dWx3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjgsImV4cCI6MjA3NjY0ODgyOH0.Zchj5TxKsdNTyPyYg1QBk_624AfKpEDutOzk_Pivxn0
`;

const envPath = path.join(__dirname, '.env');
try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
} catch (error) {
  console.log('⚠️  Não foi possível criar .env automaticamente. Crie manualmente:');
  console.log(envContent);
}

// 2. Testar conexão com banco
console.log('\n2️⃣ Testando conexão com o banco de dados...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com banco estabelecida!');
    
    // Verificar dados de exemplo
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('name, status, contact_email')
      .limit(3);
    
    if (orgsError) {
      console.log('⚠️  Erro ao buscar organizações:', orgsError.message);
    } else {
      console.log('📋 Organizações disponíveis:');
      orgs.forEach(org => {
        console.log(`   - ${org.name} (${org.status}) - ${org.contact_email}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    return false;
  }
}

// 3. Executar testes
testConnection().then(success => {
  console.log('\n' + '='.repeat(50));
  
  if (success) {
    console.log('🎉 CONFIGURAÇÃO COMPLETA!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Acesse: http://localhost:3000');
    console.log('   3. Teste o login com:');
    console.log('      Email: caosemfome@test.com');
    console.log('      Senha: password123');
    console.log('\n🔑 Credenciais de teste:');
    console.log('   • caosemfome@test.com / password123 (Verificado)');
    console.log('   • patasunidas@test.com / password123 (Verificado)');
    console.log('   • focinhos@test.com / password123 (Pendente)');
  } else {
    console.log('❌ CONFIGURAÇÃO FALHOU');
    console.log('\n🔧 Soluções:');
    console.log('   1. Verifique sua conexão com a internet');
    console.log('   2. Confirme se o banco foi criado corretamente');
    console.log('   3. Execute o script de migração no Supabase');
  }
  
  console.log('\n' + '='.repeat(50));
});


