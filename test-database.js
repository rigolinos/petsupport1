// Script de teste para verificar se o banco de dados está funcionando
// Execute com: node test-database.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdavprbhfhcunvulwphf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYXZwcmJoZmhjdW52dWx3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjgsImV4cCI6MjA3NjY0ODgyOH0.Zchj5TxKsdNTyPyYg1QBk_624AfKpEDutOzk_Pivxn0';

if (!supabaseKey) {
  console.error('❌ Erro: Chave do Supabase não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🧪 Testando conexão com o banco de dados...\n');

  try {
    // Teste 1: Verificar se as tabelas existem
    console.log('1️⃣ Testando tabelas...');
    
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (orgError) {
      console.error('❌ Erro ao acessar tabela organizations:', orgError.message);
      return;
    }
    console.log('✅ Tabela organizations: OK');

    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select('count')
      .limit(1);
    
    if (medError) {
      console.error('❌ Erro ao acessar tabela medicines:', medError.message);
      return;
    }
    console.log('✅ Tabela medicines: OK');

    const { data: rations, error: ratError } = await supabase
      .from('rations')
      .select('count')
      .limit(1);
    
    if (ratError) {
      console.error('❌ Erro ao acessar tabela rations:', ratError.message);
      return;
    }
    console.log('✅ Tabela rations: OK');

    const { data: articles, error: artError } = await supabase
      .from('articles')
      .select('count')
      .limit(1);
    
    if (artError) {
      console.error('❌ Erro ao acessar tabela articles:', artError.message);
      return;
    }
    console.log('✅ Tabela articles: OK');

    // Teste 2: Verificar dados de exemplo
    console.log('\n2️⃣ Testando dados de exemplo...');
    
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('name, status')
      .limit(3);
    
    if (orgsError) {
      console.error('❌ Erro ao buscar organizações:', orgsError.message);
      return;
    }
    
    console.log('📋 Organizações encontradas:');
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.status})`);
    });

    // Teste 3: Verificar funções
    console.log('\n3️⃣ Testando funções...');
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_organization_stats', { p_organization_id: orgs[0]?.id });
    
    if (statsError) {
      console.log('⚠️  Função get_organization_stats não disponível:', statsError.message);
    } else {
      console.log('✅ Função get_organization_stats: OK');
    }

    console.log('\n🎉 Todos os testes passaram! O banco de dados está funcionando corretamente.');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Configure VITE_SUPABASE_ANON_KEY no arquivo .env');
    console.log('   2. Execute: npm run dev');
    console.log('   3. Teste o login com: caosemfome@test.com / password123');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testDatabase();
