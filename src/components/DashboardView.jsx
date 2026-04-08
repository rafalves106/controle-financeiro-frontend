import { useState } from "react";
import { API_URL } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import { formatDate } from "../util/formatDate";

import {
  Plus,
  Trash2,
  Pencil, // <-- IMPORTADO AQUI
  Wallet,
  DollarSign,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
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
  finalBalance,
  incomes,
  expenses,
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
  const [fixedPeriod, setFixedPeriod] = useState("");

  // <-- NOVO ESTADO PARA CONTROLAR A EDIÇÃO
  const [editingId, setEditingId] = useState(null);

  const sortTransactions = (transactions) => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.data);
      const dateB = new Date(b.date || b.data);
      return dateA - dateB;
    });
  };

  const groupedIncomes = sortTransactions(incomes).reduce((acc, item) => {
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
  }, {});

  const groupedExpenses = sortTransactions(expenses).reduce((acc, item) => {
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

  // <-- NOVA FUNÇÃO PARA PREENCHER O FORMULÁRIO AO CLICAR NO LÁPIS
  const handleEditClick = (item, type) => {
    setEditingId(item.id);
    setNewItemName(item.name || item.titulo);
    setNewItemDescription(item.description || item.descricao);
    setNewItemValue(item.value || item.valor);
    setInputType(type);

    // Formata a data para o input do tipo date (YYYY-MM-DD)
    if (item.date || item.data) {
      const dateObj = new Date(item.date || item.data);
      setNewItemDate(dateObj.toISOString().split("T")[0]);
    }

    setIsFixed(item.fixa || false);
    setFixedDay(item.diaFixo || "");
    setFixedPeriod(item.periodo || "");

    // Opcional: Rola a página para cima suavemente para o usuário ver o form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // <-- NOVA FUNÇÃO PARA CANCELAR A EDIÇÃO E LIMPAR O FORM
  const clearForm = () => {
    setEditingId(null);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemValue("");
    setNewItemDate("");
    setIsFixed(false);
    setFixedDay("");
    setFixedPeriod("");
    setInputType("Saida");
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!newItemName || !newItemValue || !inputType) return;
    if (!isFixed && !newItemDate) return;
    if (isFixed && (!fixedDay || !fixedPeriod)) return;

    const payload = {
      titulo: newItemName,
      descricao: newItemDescription,
      valor: parseFloat(newItemValue),
      tipo: inputType,
      data: !isFixed ? formatDate(newItemDate) : new Date().toISOString(),
      fixa: isFixed,
      diaFixo: isFixed ? parseInt(fixedDay) : null,
      periodo: isFixed ? parseInt(fixedPeriod) : 0,
    };

    try {
      if (editingId) {
        // <-- FLUXO DE EDIÇÃO (PUT)
        const response = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          fetchData(); // Atualiza a tela com os dados do banco
          clearForm(); // Limpa o formulário
        }
      } else {
        // <-- FLUXO DE CRIAÇÃO (POST)
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          fetchData();
          clearForm();
        }
      }
    } catch (err) {
      alert("Erro ao salvar (API Offline?)", err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Erro ao deletar (API Offline?)", err);
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

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={240}>
            {/* Gráfico mantido igual... */}
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
            {/* Cards mantidos iguais... */}
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
                  {" "}
                  <PiggyBank size={20} /> Investimentos{" "}
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                  {" "}
                  Meta: Definir{" "}
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-3">
                {" "}
                A implementar{" "}
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
        </div>

        <form
          onSubmit={handleAddItem}
          className={`bg-white p-6 rounded-xl shadow-sm border gap-4 flex flex-col justify-between h-full transition-all ${editingId ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"}`}
        >
          {editingId && (
            <div className="text-sm font-bold text-amber-600 bg-amber-50 p-2 rounded-lg mb-2 flex justify-between items-center">
              <span>Modo de Edição Ativo</span>
            </div>
          )}

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
              className="w-4 h-4 text-emerald-500 rounded border-slate-300 disabled:opacity-50"
              checked={isFixed}
              onChange={(e) => setIsFixed(e.target.checked)}
              disabled={editingId !== null} // <-- Bloqueia mudança de recorrência na edição
              title={
                editingId
                  ? "Não é possível alterar a recorrência durante a edição"
                  : ""
              }
            />
            <label
              htmlFor="isFixed"
              className={`text-sm font-medium ${editingId ? "text-slate-400" : "text-slate-600"}`}
            >
              É uma movimentação recorrente?{" "}
              {editingId && "(Bloqueado na edição)"}
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
              <>
                <input
                  type="number"
                  placeholder="Dia de Venc. (1-31)"
                  min="1"
                  max="31"
                  className="flex-1 p-2 border rounded-lg placeholder-slate-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={fixedDay}
                  onChange={(e) => setFixedDay(e.target.value)}
                  disabled={editingId !== null} // <-- Bloqueado na edição
                />
                <input
                  type="number"
                  placeholder="Duração (meses)"
                  min="1"
                  className="flex-1 p-2 border rounded-lg placeholder-slate-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={fixedPeriod}
                  onChange={(e) => setFixedPeriod(e.target.value)}
                  title="Por quantos meses essa conta vai se repetir?"
                  disabled={editingId !== null} // <-- Bloqueado na edição
                />
              </>
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
          </div>

          <div className="flex gap-2 mt-2">
            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="flex-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors p-2"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className={`flex-2 text-white rounded-lg font-medium transition-colors p-2 ${editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
              style={{ flexGrow: 2 }}
            >
              {editingId ? "Atualizar" : "Salvar"}
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
                              {i.name || i.titulo}
                            </span>
                            <p className="text-xs font-light text-slate-500">
                              {i.description || i.descricao}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-emerald-600 text-sm">
                              {formatCurrency(i.value || i.valor)}
                            </span>

                            {/* <-- BOTÃO DE EDITAR (LÁPIS) ADICIONADO AQUI */}
                            <button
                              onClick={() => handleEditClick(i, "Entrada")}
                              className="p-1 hover:bg-amber-50 rounded-full transition-colors"
                              title="Editar"
                            >
                              <Pencil
                                size={14}
                                className="text-slate-300 hover:text-amber-500"
                              />
                            </button>

                            <button
                              onClick={() => handleRemove(i.id, "Entrada")}
                              className="p-1 hover:bg-red-50 rounded-full transition-colors"
                              title="Excluir"
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
                              {i.name || i.titulo}
                            </span>
                            <p className="text-xs font-light text-slate-500">
                              {i.description || i.descricao}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-rose-600 text-sm">
                              {formatCurrency(i.value || i.valor)}
                            </span>

                            {/* <-- BOTÃO DE EDITAR (LÁPIS) ADICIONADO AQUI */}
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
                              onClick={() => handleRemove(i.id, "Saída")}
                              className="p-1 hover:bg-red-50 rounded-full transition-colors"
                              title="Excluir"
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
