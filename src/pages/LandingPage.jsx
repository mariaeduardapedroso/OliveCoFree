/**
 * PAGE: Landing Page
 *
 * Página inicial do projeto OliveCoFree com apresentação do projeto,
 * logos institucionais e botão de acesso ao sistema.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Shield, BarChart3, Cloud, ArrowRight, ChevronDown } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToAbout = () => {
    document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary-200 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Logo OliveCoFree */}
          <div className="mb-8">
            <img
              src="/olivecofree.svg"
              alt="OliveCoFree"
              className="h-40 md:h-52 mx-auto drop-shadow-lg"
            />
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Sistema inteligente de previsão de doenças em oliveiras
          </p>
          <p className="text-base md:text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Proteja o seu olival com modelos preditivos baseados em dados climáticos e epidemiológicos
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-300 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Aceder ao Sistema
            <ArrowRight size={22} />
          </button>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToAbout}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 hover:text-primary-600 transition-colors animate-bounce"
        >
          <ChevronDown size={32} />
        </button>
      </section>

      {/* ===== SOBRE O PROJETO ===== */}
      <section id="sobre" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Sobre o Projeto
            </h2>
            <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full mb-6" />
            <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
              O <strong>OliveCoFree</strong> é um projeto de investigação desenvolvido no âmbito
              de uma dissertação de mestrado no <strong>Instituto Politécnico de Bragança (IPB)</strong>,
              com o apoio do <strong>CeDRI</strong> e financiamento da <strong>Fundação "la Caixa"</strong> e <strong>BPI</strong>.
              O objetivo é desenvolver ferramentas preditivas para auxiliar os olivicultores
              na deteção precoce de doenças fúngicas que afetam os olivais.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Shield size={28} />}
              title="Deteção Precoce"
              description="Identifique riscos de infeção antes dos sintomas visíveis, permitindo ação preventiva."
            />
            <FeatureCard
              icon={<Cloud size={28} />}
              title="Dados Climáticos"
              description="Integração com dados meteorológicos em tempo real para previsões precisas."
            />
            <FeatureCard
              icon={<BarChart3 size={28} />}
              title="Modelos Preditivos"
              description="Algoritmos de Machine Learning treinados com dados reais de campo."
            />
            <FeatureCard
              icon={<Leaf size={28} />}
              title="Duas Doenças"
              description="Previsão para Olho de Pavão (Spilocaea oleagina) e Antracnose (Colletotrichum spp.)."
            />
          </div>
        </div>
      </section>

      {/* ===== DOENÇAS ===== */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Doenças Monitorizadas
            </h2>
            <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Olho de Pavão */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-5">
                <Leaf className="text-pink-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Olho de Pavão</h3>
              <p className="text-sm text-gray-500 italic mb-3">Spilocaea oleagina</p>
              <p className="text-gray-600 leading-relaxed">
                Doença foliar que provoca manchas circulares nas folhas das oliveiras,
                levando à desfoliação e redução da produção. Favorecida por temperaturas
                entre 15-20°C e humidade relativa superior a 80%.
              </p>
            </div>

            {/* Antracnose */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
                <Leaf className="text-purple-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Antracnose</h3>
              <p className="text-sm text-gray-500 italic mb-3">Colletotrichum spp.</p>
              <p className="text-gray-600 leading-relaxed">
                Doença que afeta os frutos das oliveiras causando podridão e mumificação
                das azeitonas. A disseminação ocorre por salpico de chuva, sendo favorecida
                por temperaturas entre 20-25°C e elevada humidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Como Funciona
            </h2>
            <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step="01"
              title="Recolha de Dados"
              description="Dados climáticos são recolhidos automaticamente da estação meteorológica de Mirandela."
            />
            <StepCard
              step="02"
              title="Análise Preditiva"
              description="Os modelos de Machine Learning analisam padrões climáticos e calculam o risco de infeção."
            />
            <StepCard
              step="03"
              title="Alerta ao Produtor"
              description="O sistema gera alertas e recomendações para que o produtor possa agir preventivamente."
            />
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para proteger o seu olival?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Aceda ao sistema e consulte as previsões para a sua região.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-3 bg-white text-primary-700 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Aceder ao Sistema
            <ArrowRight size={22} />
          </button>
        </div>
      </section>

      {/* ===== FOOTER COM LOGOS ===== */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* Logos institucionais */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-8">
            <img
              src="/olivecofree.svg"
              alt="OliveCoFree"
              className="h-16 brightness-0 invert opacity-80"
            />
            <div className="hidden md:block w-px h-12 bg-gray-700" />
            <img
              src="/logo_cedri.png"
              alt="CeDRI - Research Centre in Digitalization and Intelligent Robotics"
              className="h-14 brightness-0 invert opacity-80"
            />
            <div className="hidden md:block w-px h-12 bg-gray-700" />
            <img
              src="/logo_bpi_lacaixa.jpg"
              alt="BPI | Fundação la Caixa"
              className="h-12 rounded opacity-90"
            />
          </div>

          {/* Separator */}
          <div className="border-t border-gray-800 pt-6">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} OliveCoFree &mdash; Instituto Politécnico de Bragança (IPB)
            </p>
            <p className="text-center text-gray-600 text-xs mt-2">
              Projeto financiado pela Fundação "la Caixa" e BPI, desenvolvido no CeDRI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ===== SUB-COMPONENTS ===== */

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-primary-50 hover:shadow-md transition-all duration-300 border border-transparent hover:border-primary-100">
    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary-600">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ step, title, description }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
      <span className="text-primary-700 font-bold text-xl">{step}</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
