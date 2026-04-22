import { useMemo, useState } from "react";
import { API_URL } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import TransactionModal from "./TransactionModal";

import {
  Trash2,
  Pencil,
  Wallet,
  DollarSign,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Plus,
  PieChart,
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

const sortTransactions = (transactions) => {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || a.data);
    const dateB = new Date(b.date || b.data);
    return dateA - dateB;
  });
};

const DashboardView = ({
  totalIncome,
  totalExpenses,
  finalBalance,
  totalInvestmentsBalance,
  fetchData,
  loading,
  selectedMes,
  selectedAno,
  onChangeMonth,
  categorias,
  incomes = [],
  expenses = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const isCurrentSelectedMonth =
    selectedMes === new Date().getMonth() + 1 &&
    selectedAno === new Date().getFullYear();

  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    if (isCurrentSelectedMonth) return;

    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const groupedIncomes = useMemo(
    () =>
      sortTransactions(incomes).reduce((acc, item) => {
        const date = new Date(item.date || item.data);
        const month = date.toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        });
        const day = date.toLocaleDateString("pt-BR");

        if (!acc[month]) acc[month] = {};
        if (!acc[month][day]) acc[month][day] = [];
        acc[month][day].push(item);
        return acc;
      }, {}),
    [incomes],
  );

  const groupedExpenses = useMemo(
    () =>
      sortTransactions(expenses).reduce((acc, item) => {
        const date = new Date(item.date || item.data);
        const month = date.toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        });
        const day = date.toLocaleDateString("pt-BR");

        if (!acc[month]) acc[month] = {};
        if (!acc[month][day]) acc[month][day] = [];
        acc[month][day].push(item);
        return acc;
      }, {}),
    [expenses],
  );

  const expensesByCategory = useMemo(() => {
    const grouped = expenses
      .filter((item) => !item.investimentoId)
      .reduce((acc, item) => {
        const categoria = item.categoria || {};
        const id = item.categoriaId || null;
        const key = id || "sem-categoria";
        const totalValue = Number(item.value || item.valor || 0);

        if (!acc[key]) {
          acc[key] = {
            id,
            nome: categoria.nome || "Sem categoria",
            icone: categoria.icone || "",
            cor: categoria.cor || "#94a3b8",
            total: 0,
          };
        }

        acc[key].total += totalValue;
        return acc;
      }, {});

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses]);

  const totalCategoryExpenses = useMemo(
    () =>
      expenses
        .filter((item) => !item.investimentoId)
        .reduce((acc, item) => acc + Number(item.value || item.valor || 0), 0),
    [expenses],
  );

  const chartData = useMemo(() => {
    const grouped = [...incomes, ...expenses].reduce((acc, item) => {
      const rawDate = item.date || item.data;

      // 👇 Pega só a parte da data sem converter timezone
      const dateKey = rawDate.split("T")[0]; // "2026-04-05" sempre correto

      const isIncome = (item.type || item.tipo)?.toLowerCase() === "entrada";
      const value = Number(item.value || item.valor);

      if (!acc[dateKey]) {
        acc[dateKey] = { entrada: 0, saida: 0 };
      }
      if (isIncome) {
        acc[dateKey].entrada += value;
      } else {
        acc[dateKey].saida += value;
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .reduce((acc, [isoDate, dayTotals], index) => {
        const previousBalance = index > 0 ? acc[index - 1].saldo : 0;

        // 👇 Monta o label manualmente — sem conversão de timezone
        const [year, month, day] = isoDate.split("-");
        const displayLabel = `${day}/${month}/${year.slice(2)}`;

        acc.push({
          data: displayLabel,
          entrada: dayTotals.entrada,
          saida: dayTotals.saida,
          saldo: previousBalance + dayTotals.entrada - dayTotals.saida,
        });
        return acc;
      }, []);
  }, [incomes, expenses]);

  const handleEditClick = (item, type) => {
    setEditingItem({ ...item, tipo: type });
    setIsModalOpen(true);
  };

  const handleRemove = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      alert("Erro ao deletar. Verifique o console.");
    }
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

        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-slate-700 capitalize">
            {currentMonthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isCurrentSelectedMonth}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>

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
                name="entrada"
              />
              <Line
                type="monotone"
                dataKey="saida"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="saida"
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
                name="saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 items-start">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 mb-2 font-medium">
                {" "}
                <ArrowUpCircle size={20} /> Entrada{" "}
              </div>
              <div className="text-2xl font-bold">
                {" "}
                {formatCurrency(totalIncome)}{" "}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 mb-2 font-medium">
                {" "}
                <ArrowDownCircle size={20} /> Saídas{" "}
              </div>
              <div className="text-2xl font-bold">
                {" "}
                {formatCurrency(totalExpenses)}{" "}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <PiggyBank size={20} /> Investimentos
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                  Meta: Definir
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-3">
                {formatCurrency(totalInvestmentsBalance || 0)}
              </div>
            </div>
            <div
              className={`p-4 rounded-xl shadow-sm border ${finalBalance >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
            >
              <div className="flex items-center gap-2 mb-2 font-medium">
                {" "}
                <DollarSign size={20} /> Saldo Livre{" "}
              </div>
              <div className="text-2xl font-bold">
                {" "}
                {formatCurrency(finalBalance)}{" "}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <PieChart size={18} className="text-slate-500" /> Gastos por
              Categoria
            </h3>

            {expensesByCategory.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-6">
                Nenhum gasto registrado neste mês
              </div>
            ) : (
              <div className="space-y-4">
                {expensesByCategory.map((item) => {
                  const percentage =
                    totalCategoryExpenses > 0
                      ? (item.total / totalCategoryExpenses) * 100
                      : 0;

                  return (
                    <div key={item.id || item.nome}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700 font-medium">
                          {item.icone} {item.nome}
                        </span>
                        <span className="text-slate-600 font-semibold">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: item.cor || "#94a3b8",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-bold text-emerald-700 mb-3 shrink-0">Entradas</h3>
          {Object.keys(groupedIncomes).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <ArrowUpCircle size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">
                Nenhuma entrada em {currentMonthLabel}
              </p>
            </div>
          ) : (
            Object.entries(groupedIncomes).map(([month, days]) => (
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
                                {i.name || i.titulo}
                              </span>
                              {i.categoria && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mt-1"
                                  style={{
                                    backgroundColor:
                                      (i.categoria.cor || "#94a3b8") + "20",
                                    color: i.categoria.cor || "#94a3b8",
                                  }}
                                >
                                  {i.categoria.icone} {i.categoria.nome}
                                </span>
                              )}
                              <p className="text-xs font-light text-slate-500">
                                {i.description || i.descricao}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-emerald-600 text-sm">
                                {formatCurrency(i.value || i.valor)}
                              </span>

                              {/* <-- TRAVA DE EDIÇÃO/EXCLUSÃO AQUI --> */}
                              {i.investimentoId ? (
                                <div
                                  className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded-md cursor-help"
                                  title="Gerenciado na aba de Investimentos"
                                >
                                  <Briefcase size={14} />
                                  <span className="text-[10px] font-bold uppercase hidden sm:inline">
                                    Investimento
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() =>
                                      handleEditClick(i, "Entrada")
                                    }
                                    className="p-1 hover:bg-amber-50 rounded-full transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil
                                      size={14}
                                      className="text-slate-300 hover:text-amber-500"
                                    />
                                  </button>

                                  <button
                                    onClick={() => handleRemove(i.id)}
                                    className="p-1 hover:bg-red-50 rounded-full transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2
                                      size={14}
                                      className="text-slate-300 hover:text-red-500"
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-bold text-rose-700 mb-3 shrink-0">Saídas</h3>
          {Object.keys(groupedExpenses).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <ArrowDownCircle size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">
                Nenhuma saída em {currentMonthLabel}
              </p>
            </div>
          ) : (
            Object.entries(groupedExpenses).map(([month, days]) => (
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
                                {i.name || i.titulo}
                              </span>
                              {i.categoria && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mt-1"
                                  style={{
                                    backgroundColor:
                                      (i.categoria.cor || "#94a3b8") + "20",
                                    color: i.categoria.cor || "#94a3b8",
                                  }}
                                >
                                  {i.categoria.icone} {i.categoria.nome}
                                </span>
                              )}
                              <p className="text-xs font-light text-slate-500">
                                {i.description || i.descricao}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-rose-600 text-sm">
                                {formatCurrency(i.value || i.valor)}
                              </span>

                              {/* <-- TRAVA DE EDIÇÃO/EXCLUSÃO AQUI --> */}
                              {i.investimentoId ? (
                                <div
                                  className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded-md cursor-help"
                                  title="Gerenciado na aba de Investimentos"
                                >
                                  <Briefcase size={14} />
                                  <span className="text-[10px] font-bold uppercase hidden sm:inline">
                                    Investimento
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditClick(i, "Saida")}
                                    className="p-1 hover:bg-amber-50 rounded-full transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil
                                      size={14}
                                      className="text-slate-300 hover:text-amber-500"
                                    />
                                  </button>

                                  <button
                                    onClick={() => handleRemove(i.id)}
                                    className="p-1 hover:bg-red-50 rounded-full transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2
                                      size={14}
                                      className="text-slate-300 hover:text-red-500"
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      <button
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-colors"
        onClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
      >
        <Plus size={24} />
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        categorias={categorias}
        editingItem={editingItem}
      />
    </div>
  );
};

export default DashboardView;
