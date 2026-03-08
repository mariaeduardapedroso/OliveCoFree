/**
 * VIEW: CardClima
 *
 * Card que mostra informações climáticas.
 */

import React from 'react';
import { Thermometer, Droplets, CloudRain, Wind } from 'lucide-react';

const CardClima = ({ clima }) => {
  const items = [
    {
      icone: <Thermometer size={24} />,
      label: 'Temperatura',
      valor: `${clima.temperatura}°C`,
      cor: 'text-orange-500'
    },
    {
      icone: <Droplets size={24} />,
      label: 'Humidade',
      valor: `${clima.humidade}%`,
      cor: 'text-blue-500'
    },
    {
      icone: <CloudRain size={24} />,
      label: 'Precipitação',
      valor: `${clima.precipitacao} mm`,
      cor: 'text-cyan-500'
    },
    {
      icone: <Wind size={24} />,
      label: 'Vento',
      valor: `${clima.vento} km/h`,
      cor: 'text-gray-500'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Condições Climáticas
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <span className={item.cor}>{item.icone}</span>
            <div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold text-gray-800">{item.valor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardClima;
