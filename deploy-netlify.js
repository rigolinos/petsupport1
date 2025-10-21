// Script para facilitar o deploy no Netlify
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Preparando deploy no Netlify...\n');

// 1. Verificar se o build existe
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log('❌ Pasta dist não encontrada. Execute: npm run build');
  process.exit(1);
}

console.log('✅ Pasta dist encontrada');

// 2. Verificar arquivos importantes
const files = [
  'dist/index.html',
  'dist/assets/index-DNJ57N6Y.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} encontrado`);
  } else {
    console.log(`⚠️  ${file} não encontrado`);
  }
});

// 3. Verificar configuração do Netlify
const netlifyConfig = path.join(__dirname, 'netlify.toml');
if (fs.existsSync(netlifyConfig)) {
  console.log('✅ netlify.toml encontrado');
} else {
  console.log('❌ netlify.toml não encontrado');
}

console.log('\n' + '='.repeat(50));
console.log('🎉 PROJETO PRONTO PARA DEPLOY!');
console.log('\n📝 Próximos passos:');
console.log('1. Acesse: https://app.netlify.com');
console.log('2. Clique em "New site from Git"');
console.log('3. Conecte seu repositório GitHub');
console.log('4. Configure as variáveis de ambiente:');
console.log('   VITE_SUPABASE_URL = https://mdavprbhfhcunvulwphf.supabase.co');
console.log('   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYXZwcmJoZmhjdW52dWx3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjgsImV4cCI6MjA3NjY0ODgyOH0.Zchj5TxKsdNTyPyYg1QBk_624AfKpEDutOzk_Pivxn0');
console.log('5. Deploy automático será ativado!');
console.log('\n🔑 Credenciais de teste:');
console.log('   • caosemfome@test.com / password123');
console.log('   • patasunidas@test.com / password123');
console.log('   • focinhos@test.com / password123');
console.log('\n' + '='.repeat(50));
