// Script para configurar automaticamente o arquivo .env
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://mdavprbhfhcunvulwphf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYXZwcmJoZmhjdW52dWx3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjgsImV4cCI6MjA3NjY0ODgyOH0.Zchj5TxKsdNTyPyYg1QBk_624AfKpEDutOzk_Pivxn0
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log('📁 Localização:', envPath);
  console.log('🔑 Chave anon configurada');
  console.log('\n🚀 Agora você pode executar:');
  console.log('   npm run dev');
  console.log('\n🧪 Para testar a conexão:');
  console.log('   node test-database.js');
} catch (error) {
  console.error('❌ Erro ao criar arquivo .env:', error.message);
  console.log('\n📝 Crie manualmente o arquivo .env com o seguinte conteúdo:');
  console.log(envContent);
}
