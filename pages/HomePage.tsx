import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Recycle, Handshake, ShieldCheck, HeartHandshake } from 'lucide-react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: string }> = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
    <div className="bg-primary/10 rounded-full p-4 mb-4">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{children}</p>
  </div>
);

const HomePage: React.FC = () => {
  const heroImageURL = 'https://images.pexels.com/photos/3361739/pexels-photo-3361739.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-screen flex items-center justify-center text-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImageURL})` }}
      >
        <div className="bg-black/50 absolute top-0 left-0 w-full h-full"></div>
        <div className="z-10 text-center p-4 max-w-4xl mt-16 md:mt-20">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-md">
            Juntos, garantimos que a ajuda nunca falte.
          </h1>
          <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto drop-shadow-sm">
            A plataforma exclusiva para ONGs de cães compartilharem medicamentos, rações e suprimentos. Reduza o desperdício e fortaleça nossa comunidade.
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link 
              to="/login" 
              className="bg-cta text-gray-800 font-bold py-3 px-8 rounded-lg text-lg hover:bg-cta-hover transition-colors shadow-lg transform hover:scale-105"
            >
              Cadastre sua ONG
            </Link>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Nossa plataforma em 3 passos simples</h2>
          <p className="max-w-2xl mx-auto text-gray-600 mb-12">Simples, rápido e focado no que realmente importa: salvar vidas.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<ShieldCheck size={40} className="text-primary"/>} title="Cadastre e Verifique">
              Crie o perfil da sua ONG em minutos. Nossa verificação garante um ambiente seguro e confiável para todos.
            </FeatureCard>
            <FeatureCard icon={<Recycle size={40} className="text-primary"/>} title="Doe ou Encontre">
              Publique itens que sua ONG tem em excesso ou utilize nossos filtros inteligentes para encontrar exatamente o que precisa.
            </FeatureCard>
            <FeatureCard icon={<Handshake size={40} className="text-primary"/>} title="Conecte-se e Colabore">
              Solicite doações com um clique e combine a logística diretamente com outras ONGs parceiras. A união faz a força.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Prova Social Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">ONGs que fazem parte da nossa comunidade</h2>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 text-gray-500">
            <div className="flex items-center gap-2 text-xl font-semibold"><PawPrint /> Cão Sem Fome</div>
            <div className="flex items-center gap-2 text-xl font-semibold"><HeartHandshake /> Patas Unidas</div>
            <div className="flex items-center gap-2 text-xl font-semibold"><PawPrint /> Anjos de 4 Patas</div>
            <div className="flex items-center gap-2 text-xl font-semibold"><HeartHandshake /> Projeto Vira-Lata</div>
            <div className="flex items-center gap-2 text-xl font-semibold"><PawPrint /> Focinhos Carentes</div>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="bg-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Pronto para se juntar à nossa comunidade e fazer a diferença?</h2>
          <div className="mt-8">
            <Link 
              to="/login" 
              className="bg-cta text-gray-800 font-bold py-3 px-8 rounded-lg text-lg hover:bg-cta-hover transition-colors shadow-lg transform hover:scale-105 inline-block"
            >
              Cadastre sua ONG Gratuitamente
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;