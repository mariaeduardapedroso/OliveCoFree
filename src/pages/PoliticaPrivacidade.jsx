/**
 * PAGE: PoliticaPrivacidade
 *
 * Página de Política de Privacidade da aplicação OliveCoFree.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PoliticaPrivacidade = () => {
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
            <Shield className="text-primary-600" size={24} />
            <h1 className="text-xl font-bold text-gray-800">Política de Privacidade</h1>
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
                1. Introdução
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A OliveCoFree, desenvolvida no âmbito de um projeto académico do Instituto
                Politécnico de Bragança (IPB), compromete-se a proteger a privacidade dos
                seus utilizadores. Esta Política de Privacidade descreve como recolhemos,
                utilizamos e protegemos os seus dados pessoais.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                2. Dados Recolhidos
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Ao utilizar a plataforma, podemos recolher os seguintes dados:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li><strong>Dados de registo:</strong> nome, email, tipo de utilizador, localização e nome da propriedade</li>
                <li><strong>Dados de autenticação:</strong> senha (armazenada de forma encriptada)</li>
                <li><strong>Dados de utilização:</strong> previsões realizadas, datas e parâmetros climáticos inseridos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                3. Finalidade do Tratamento
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Os dados recolhidos são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li>Autenticação e gestão da conta do utilizador</li>
                <li>Geração de previsões personalizadas de doenças em oliveiras</li>
                <li>Manutenção do histórico de previsões do utilizador</li>
                <li>Investigação académica no âmbito do projeto de tese do IPB</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                4. Base Legal
              </h2>
              <p className="text-gray-600 leading-relaxed">
                O tratamento de dados pessoais é realizado com base no consentimento do
                utilizador, obtido no momento do registo, em conformidade com o Regulamento
                Geral sobre a Proteção de Dados (RGPD) — Regulamento (UE) 2016/679.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                5. Armazenamento e Segurança
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Os dados são armazenados em servidores seguros com as seguintes medidas de proteção:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li>Senhas encriptadas com algoritmo bcrypt</li>
                <li>Comunicação protegida por HTTPS</li>
                <li>Autenticação via tokens JWT com expiração configurada</li>
                <li>Acesso restrito à base de dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                6. Partilha de Dados
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Os dados pessoais <strong>não são partilhados com terceiros</strong> para
                fins comerciais. Dados anonimizados e agregados poderão ser utilizados para
                fins de investigação académica no contexto do projeto de tese.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                7. Direitos do Utilizador
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Nos termos do RGPD, o utilizador tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li><strong>Acesso:</strong> consultar os seus dados pessoais a qualquer momento</li>
                <li><strong>Retificação:</strong> corrigir dados incorretos ou desatualizados</li>
                <li><strong>Eliminação:</strong> solicitar a eliminação dos seus dados pessoais</li>
                <li><strong>Portabilidade:</strong> solicitar os seus dados num formato estruturado</li>
                <li><strong>Oposição:</strong> opor-se ao tratamento dos seus dados</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-2">
                Para exercer estes direitos, contacte-nos através do Instituto Politécnico
                de Bragança.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                8. Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A plataforma utiliza armazenamento local (localStorage) do navegador
                para manter a sessão do utilizador. Não são utilizados cookies de
                rastreamento ou de terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                9. Retenção de Dados
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Os dados pessoais são mantidos enquanto a conta do utilizador estiver ativa
                ou pelo período necessário para cumprir as finalidades académicas do projeto.
                Após o encerramento da conta, os dados serão eliminados ou anonimizados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                10. Alterações a esta Política
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Esta Política de Privacidade pode ser atualizada periodicamente. Quaisquer
                alterações significativas serão comunicadas ao utilizador. Recomendamos a
                consulta regular desta página.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                11. Contacto
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Para questões relacionadas com a proteção de dados ou para exercer os seus
                direitos, contacte-nos através do Instituto Politécnico de Bragança — Escola
                Superior Agrária.
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

export default PoliticaPrivacidade;
