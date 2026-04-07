import { useState } from "react";

import { TrendingUp, BarChart3 } from "lucide-react";

import { formatCurrency } from "../util/formatCurrency";

const InvestmentsView = ({ investmentAmount }) => {
  const [initialVal, setInitialVal] = useState(0);
  const [monthlyVal, setMonthlyVal] = useState(investmentAmount);
  const [rate, setRate] = useState(0.85);
  const [years, setYears] = useState(5);

  const months = years * 12;
  const rateDecimal = rate / 100;
  const futureValue =
    initialVal * Math.pow(1 + rateDecimal, months) +
    (monthlyVal * (Math.pow(1 + rateDecimal, months) - 1)) / rateDecimal;
  const totalInvested = Number(initialVal) + Number(monthlyVal) * months;
  const totalInterest = futureValue - totalInvested;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <BarChart3 className="text-blue-600" /> Simulador de Juros Compostos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Veja o poder do tempo e dos aportes mensais.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Aporte Inicial
            </label>
            <input
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(Number(e.target.value))}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Aporte Mensal
            </label>
            <input
              type="number"
              value={monthlyVal}
              onChange={(e) => setMonthlyVal(Number(e.target.value))}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Taxa de Juros (% ao mês)
            </label>
            <input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Período (Anos)
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600"
            />
            <div className="text-right font-bold text-slate-700">
              {years} Anos
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 text-white p-8 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div>
              <p className="text-slate-400 text-sm mb-1">
                Total Investido (Do seu bolso)
              </p>
              <p className="text-2xl font-semibold text-slate-300">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-emerald-400 text-sm mb-1 flex items-center gap-1">
                <TrendingUp size={14} /> Total em Juros (Lucro)
              </p>
              <p className="text-2xl font-semibold text-emerald-400">
                +{formatCurrency(totalInterest)}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 relative z-10">
            <p className="text-slate-400 text-sm uppercase tracking-wide">
              Patrimônio Final Estimado
            </p>
            <p className="text-5xl font-bold mt-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {formatCurrency(futureValue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsView;
