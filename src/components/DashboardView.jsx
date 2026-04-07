import { useState } from "react";

import { API_URL } from "../services/api";

import { formatCurrency } from "../util/formatCurrency";
import { formatDate } from "../util/formatDate";

import {
  Plus,
  Trash2,
  Wallet,
  DollarSign,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBankIcon,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
} from "recharts";

const DashboardView = ({
  totalIncome,
  totalExpenses,
  // investmentAmount,
  // investmentGoalPercent,
  // setInvestmentGoalPercent,
  finalBalance,
  incomes,
  expenses,
  setIncomes,
  setExpenses,
  fetchData,
  loading,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [inputType, setInputType] = useState("Saida");
  const [isFixed, setIsFixed] = useState(false);
  const [fixedDay, setFixedDay] = useState("");

  const groupedIncomes = incomes.reduce((acc, item) => {
    const date = new Date(item.date);
    const month = date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const day = date.toLocaleDateString("pt-BR");

    if (!acc[month]) acc[month] = {};
    if (!acc[month][day]) acc[month][day] = [];

    acc[month][day].push(item);
    return acc;
  }, {});

  const groupedExpenses = expenses.reduce((acc, item) => {
    const date = new Date(item.date);
    const month = date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const day = date.toLocaleDateString("pt-BR");

    if (!acc[month]) acc[month] = {};
    if (!acc[month][day]) acc[month][day] = [];

    acc[month][day].push(item);
    return acc;
  }, {});

  const chartData = Object.entries(
    [...incomes, ...expenses].reduce((acc, item) => {
      const dateKey = new Date(item.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      const isIncome = item.type?.toLowerCase() === "entrada";
      const value = Number(item.value);

      if (!acc[dateKey]) {
        acc[dateKey] = { entrada: 0, saida: 0 };
      }

      if (isIncome) {
        acc[dateKey].entrada += value;
      } else {
        acc[dateKey].saida += value;
      }

      return acc;
    }, {}),
  )
    .sort((a, b) => {
      const [dayA, monthA] = a[0].split("/").map(Number);
      const [dayB, monthB] = b[0].split("/").map(Number);
      return monthA - monthB || dayA - dayB;
    })
    .reduce((acc, [date, dayTotals], index) => {
      const previousBalance = index > 0 ? acc[index - 1].saldo : 0;
      acc.push({
        data: date,
        entrada: dayTotals.entrada,
        saida: dayTotals.saida,
        saldo: previousBalance + dayTotals.entrada - dayTotals.saida,
      });
      return acc;
    }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemValue || !newItemDate || !inputType) return;

    if (!newItemName || !newItemValue || !inputType) return;
    if (!isFixed && !newItemDate) return;
    if (isFixed && !fixedDay) return;

    const newItem = {
      titulo: newItemName,
      descricao: newItemDescription,
      valor: parseFloat(newItemValue),
      tipo: inputType,
      data: !isFixed ? formatDate(newItemDate) : null,
      fixa: isFixed,
      diaFixo: isFixed ? parseInt(fixedDay) : null,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (response.ok) fetchData();
    } catch (err) {
      alert("Erro ao salvar (API Offline?)", err);
    }

    const localItem = {
      ...newItem,
      id: Date.now(),
      name: newItem.titulo,
      description: newItem.descricao,
      value: newItem.valor,
      date: newItem.data,
      type: newItem.tipo,
    };
    if (inputType === "Entrada") setIncomes([...incomes, localItem]);
    else setExpenses([...expenses, localItem]);

    setNewItemName("");
    setNewItemDescription("");
    setNewItemValue("");
    setNewItemDate("");
    setIsFixed(false);
    setFixedDay("");
  };

  const handleRemove = async (id, type) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (err) {
      alert("Erro ao deletar (API Offline?)", err);
    }
    if (type === "Entrada") setIncomes(incomes.filter((i) => i.id !== id));
    else setExpenses(expenses.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
        <Wallet className="w-12 h-12 mb-4 opacity-50" />
        <p>Carregando informações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-slate-700 font-bold mb-6 flex items-center gap-2">
          <DollarSign size={18} className="text-blue-500" /> Evolução Financeira
        </h3>

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="data"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                hide={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#cbd5e1" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, name) => {
                  const formattedValue = formatCurrency(value);
                  if (name === "entrada") return [formattedValue, "Receita"];
                  if (name === "saida") return [formattedValue, "Despesa"];
                  return [formattedValue, "Saldo"];
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />

              <Line
                type="monotone"
                dataKey="entrada"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="Entradas"
              />

              <Line
                type="monotone"
                dataKey="saida"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="Saídas"
              />

              <Area
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeOpacity={0.5}
                fillOpacity={1}
                fill="url(#colorSaldo)"
                animationDuration={1000}
                dot={{ r: 2, strokeWidth: 1, fill: "#3b82f6" }}
                name="Saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 mb-2 font-medium">
                <ArrowUpCircle size={20} /> Entrada
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 mb-2 font-medium">
                <ArrowDownCircle size={20} /> Saídas
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalExpenses)}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <PiggyBank size={20} /> Investimentos
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                  {/* TODO: Implementar meta de investimento */}
                  Meta: Definir
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-3">
                {/* TODO: Implementar cálculo do valor total de investimento com base nas movimentações do tipo "Investimento" {formatCurrency(investmentAmount)} */}
                A implementar
              </div>
            </div>

            <div
              className={`p-4 rounded-xl shadow-sm border ${finalBalance >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
            >
              <div className="flex items-center gap-2 mb-2 font-medium">
                <DollarSign size={20} /> Saldo Livre
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(finalBalance)}
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleAddItem}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4 flex flex-col h-full justify-between"
        >
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <input
              type="text"
              placeholder="Título"
              className="flex-2 p-2 border rounded-lg placeholder-slate-500"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Descrição"
              className="flex-1 p-2 border rounded-lg placeholder-slate-500"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="isFixed"
              className="w-4 h-4 text-emerald-500 rounded border-slate-300"
              checked={isFixed}
              onChange={(e) => setIsFixed(e.target.checked)}
            />
            <label
              htmlFor="isFixed"
              className="text-sm text-slate-600 font-medium"
            >
              É uma movimentação fixa mensal?
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {!isFixed ? (
              <input
                type="date"
                placeholder="Data"
                className="flex-1 p-2 border rounded-lg placeholder-slate-500"
                value={newItemDate}
                onChange={(e) => setNewItemDate(e.target.value)}
              />
            ) : (
              <input
                type="number"
                placeholder="Dia Fixo (1-31)"
                min="1"
                max="31"
                className="flex-1 p-2 border rounded-lg placeholder-slate-500"
                value={fixedDay}
                onChange={(e) => setFixedDay(e.target.value)}
              />
            )}

            <input
              type="number"
              placeholder="Valor"
              className="flex-1 p-2 border rounded-lg placeholder-slate-500"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
            />
            <select
              className="flex-1 p-2 border rounded-lg placeholder-slate-500"
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
            >
              <option value="Saida">Saída</option>
              <option value="Entrada">Entrada</option>
            </select>
            <button
              type="submit"
              className="flex-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-bold text-emerald-700 mb-3 shrink-0">Entradas</h3>
          {Object.entries(groupedIncomes).map(([month, days]) => (
            <details
              key={month}
              className="group mb-4 bg-white rounded-lg border border-slate-200 shadow-sm"
              close="true"
            >
              <summary className="flex justify-between items-center p-4 cursor-pointer list-none font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <span className="capitalize">{month}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>

              <div className="p-4 pt-0 border-t border-slate-100">
                {Object.entries(days).map(([day, transactions]) => (
                  <div key={day} className="mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {day}
                    </h4>

                    <div className="space-y-1">
                      {transactions.map((i) => (
                        <div
                          key={i.id}
                          className="flex justify-between py-3 border-b last:border-0 border-slate-50 hover:bg-slate-50 px-2 rounded-md transition-colors"
                        >
                          <div>
                            <span className="block text-sm font-medium text-slate-700">
                              {i.name}
                            </span>
                            <p className="text-xs font-light text-slate-500">
                              {i.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-emerald-600 text-sm">
                              {formatCurrency(i.value)}
                            </span>
                            <button
                              onClick={() => handleRemove(i.id, "Entrada")}
                              className="p-1 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2
                                size={14}
                                className="text-slate-300 hover:text-red-500"
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-bold text-rose-700 mb-3 shrink-0">Saídas</h3>
          {Object.entries(groupedExpenses).map(([month, days]) => (
            <details
              key={month}
              className="group mb-4 bg-white rounded-lg border border-slate-200 shadow-sm"
              close="true"
            >
              <summary className="flex justify-between items-center p-4 cursor-pointer list-none font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <span className="capitalize">{month}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>

              <div className="p-4 pt-0 border-t border-slate-100">
                {Object.entries(days).map(([day, transactions]) => (
                  <div key={day} className="mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {day}
                    </h4>

                    <div className="space-y-1">
                      {transactions.map((i) => (
                        <div
                          key={i.id}
                          className="flex justify-between py-3 border-b last:border-0 border-slate-50 hover:bg-slate-50 px-2 rounded-md transition-colors"
                        >
                          <div>
                            <span className="block text-sm font-medium text-slate-700">
                              {i.name}
                            </span>
                            <p className="text-xs font-light text-slate-500">
                              {i.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-rose-600 text-sm">
                              {formatCurrency(i.value)}
                            </span>
                            <button
                              onClick={() => handleRemove(i.id, "Saída")}
                              className="p-1 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2
                                size={14}
                                className="text-slate-300 hover:text-red-500"
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
