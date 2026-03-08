/**
 * PAGE: TermosUso
 *
 * Página de Termos de Uso da aplicação OliveCoFree.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermosUso = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/cadastro"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="text-primary-600" size={24} />
            <h1 className="text-xl font-bold text-gray-800">Termos de Uso</h1>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-10">
          <p className="text-sm text-gray-500 mb-6">
            Última atualização: março de 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                1. Aceitação dos Termos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Ao aceder e utilizar a plataforma OliveCoFree, o utilizador declara que leu,
                compreendeu e aceita os presentes Termos de Uso na sua totalidade. A utilização
                da plataforma está condicionada à aceitação destes termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                2. Descrição do Serviço
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A OliveCoFree é uma plataforma académica desenvolvida no âmbito de um projeto
                de tese do Instituto Politécnico de Bragança (IPB), destinada à previsão de
                doenças fúngicas em oliveiras, nomeadamente Olho de Pavão
                (<em>Spilocaea oleagina</em>) e Antracnose (<em>Colletotrichum</em> spp.).
                A plataforma utiliza dados climáticos e modelos preditivos para estimar
                o risco de infeção.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                3. Natureza Académica e Limitações
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A OliveCoFree é um protótipo académico (MVP) e <strong>não substitui o
                aconselhamento técnico profissional</strong>. As previsões geradas pela
                plataforma são estimativas baseadas em modelos computacionais e dados
                climáticos, podendo não refletir com exatidão as condições reais do terreno.
                O utilizador reconhece que as decisões tomadas com base nas informações
                da plataforma são da sua inteira responsabilidade.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                4. Registo e Conta do Utilizador
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Para utilizar a plataforma, o utilizador deve criar uma conta fornecendo
                informações verídicas e atualizadas. O utilizador é responsável por manter
                a confidencialidade da sua senha e por todas as atividades realizadas
                na sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                5. Uso Aceitável
              </h2>
              <p className="text-gray-600 leading-relaxed">O utilizador compromete-se a:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li>Utilizar a plataforma apenas para fins legítimos relacionados com a gestão agrícola</li>
                <li>Não tentar comprometer a segurança ou o funcionamento da plataforma</li>
                <li>Não utilizar a plataforma para fins comerciais sem autorização prévia</li>
                <li>Fornecer dados verdadeiros no momento do registo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                6. Propriedade Intelectual
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Todo o conteúdo da plataforma, incluindo código-fonte, design, textos e
                modelos preditivos, é propriedade do projeto OliveCoFree e do Instituto
                Politécnico de Bragança. A reprodução ou distribuição não autorizada é proibida.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                7. Isenção de Responsabilidade
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A plataforma é disponibilizada &quot;tal como está&quot;, sem garantias de qualquer
                tipo, expressas ou implícitas. Os autores e o IPB não se responsabilizam
                por eventuais danos ou perdas decorrentes da utilização das previsões
                geradas pela plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                8. Alterações aos Termos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Estes Termos de Uso podem ser atualizados a qualquer momento. O utilizador
                será notificado sobre alterações significativas. A continuação do uso da
                plataforma após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                9. Contacto
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Para questões relacionadas com estes Termos de Uso, contacte-nos através
                do Instituto Politécnico de Bragança — Escola Superior Agrária.
              </p>
            </section>
          </div>

          {/* Botão Voltar */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft size={18} />
              Voltar ao registo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosUso;
