import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  DollarSign,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  WifiOff,
  LayoutDashboard,
  Target,
  Clock,
  BarChart3,
  Briefcase,
} from "lucide-react";

const App = () => {
  // --- ESTADO GERAL E NAVEGAÇÃO ---
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, investments, wishlist

  // URLs da API Java
  const API_URL = "https://controle-financeiro-ukwu.onrender.com/movimentacoes";
  const API_METAS_URL = "https://controle-financeiro-ukwu.onrender.com/metas";

  // Dados Globais (Compartilhados entre telas)
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState(120); // Padrão estágio (6h/dia * 20 dias)

  // --- LÓGICA DO DASHBOARD ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [investmentGoalPercent, setInvestmentGoalPercent] = useState(10);

  // Cálculos Globais
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.value, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.value, 0);
  const investmentAmount = totalIncome * (investmentGoalPercent / 100);
  const finalBalance = totalIncome - totalExpenses - investmentAmount;
  const hourlyRate = totalIncome > 0 ? totalIncome / workHoursPerMonth : 0;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Falha na API");
      const data = await response.json();
      setIncomes(
        data.filter((item) => item.tipo === "RECEITA").map(mapApiToFrontend),
      );
      setExpenses(
        data.filter((item) => item.tipo === "DESPESA").map(mapApiToFrontend),
      );
      setError(null);
    } catch (err) {
      console.log(err + "Modo offline ou erro de API Movimentações");
    } finally {
      setLoading(false);
    }
  };

  const mapApiToFrontend = (item) => ({
    id: item.id,
    name: item.descricao,
    value: item.valor,
    type: item.tipo,
  });

  // Funções de formatação
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m > 0 ? m + "min" : ""}`;
  };

  // --- SUB-COMPONENTES DAS TELAS ---

  // 1. TELA: DASHBOARD
  const DashboardView = () => {
    const [newItemName, setNewItemName] = useState("");
    const [newItemValue, setNewItemValue] = useState("");
    const [inputType, setInputType] = useState("DESPESA");

    const handleAddItem = async (e) => {
      e.preventDefault();
      if (!newItemName || !newItemValue) return;

      const newItem = {
        descricao: newItemName,
        valor: parseFloat(newItemValue),
        tipo: inputType,
      };

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
        if (response.ok) fetchData();
      } catch (err) {
        alert(err + "Erro ao salvar (API Offline?)");
      }

      const localItem = {
        ...newItem,
        id: Date.now(),
        name: newItem.descricao,
        value: newItem.valor,
        type: newItem.tipo,
      };
      if (inputType === "RECEITA") setIncomes([...incomes, localItem]);
      else setExpenses([...expenses, localItem]);

      setNewItemName("");
      setNewItemValue("");
    };

    const handleRemove = async (id, type) => {
      try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      } catch (e) {
        alert(e + "Erro ao deletar (API Offline?)");
      }
      if (type === "RECEITA") setIncomes(incomes.filter((i) => i.id !== id));
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
        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-600 mb-2 font-medium">
              <ArrowUpCircle size={20} /> Receita
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-rose-600 mb-2 font-medium">
              <ArrowDownCircle size={20} /> Despesas
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 relative">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <PiggyBank size={20} /> Meta
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                {investmentGoalPercent}%
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-3">
              {formatCurrency(investmentAmount)}
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={investmentGoalPercent}
              onChange={(e) => setInvestmentGoalPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
            />
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

        {/* Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-emerald-700 mb-3">Receitas</h3>
            {incomes.map((i) => (
              <div
                key={i.id}
                className="flex justify-between py-2 border-b last:border-0 border-slate-100"
              >
                <span>{i.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(i.value)}
                  </span>
                  <button onClick={() => handleRemove(i.id, "RECEITA")}>
                    <Trash2
                      size={14}
                      className="text-slate-300 hover:text-red-500"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-rose-700 mb-3">Despesas</h3>
            {expenses.map((i) => (
              <div
                key={i.id}
                className="flex justify-between py-2 border-b last:border-0 border-slate-100"
              >
                <span>{i.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-rose-600">
                    {formatCurrency(i.value)}
                  </span>
                  <button onClick={() => handleRemove(i.id, "DESPESA")}>
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

        {/* Add Form Simples */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4 flex gap-2 items-center">
            <Plus size={18} /> Adicionar Rápido
          </h3>
          <form
            onSubmit={handleAddItem}
            className="flex flex-col md:flex-row gap-4"
          >
            <input
              type="text"
              placeholder="Descrição"
              className="flex-1 p-2 border rounded-lg"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Valor"
              className="w-32 p-2 border rounded-lg"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
            />
            <select
              className="p-2 border rounded-lg"
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
            >
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
            <button
              type="submit"
              className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800"
            >
              Salvar
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 2. TELA: INVESTIMENTOS (SIMULADOR)
  const InvestmentsView = () => {
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

  // 3. TELA: LISTA DE DESEJOS (AGORA COM API)
  const WishlistView = () => {
    const [wishes, setWishes] = useState([]);
    const [wishName, setWishName] = useState("");
    const [wishPrice, setWishPrice] = useState("");

    // Busca metas do backend ao carregar
    useEffect(() => {
      fetchMetas();
    }, []);

    const fetchMetas = async () => {
      try {
        const res = await fetch(API_METAS_URL);
        if (res.ok) {
          const data = await res.json();
          // Mapeia os campos do Java (descricao, valor) para o Frontend (name, price)
          setWishes(
            data.map((m) => ({ id: m.id, name: m.descricao, price: m.valor })),
          );
        }
      } catch (e) {
        console.error(e + "Erro ao buscar metas");
      }
    };

    const addWish = async (e) => {
      e.preventDefault();
      if (!wishName || !wishPrice) return;

      // Payload no formato que o Java espera
      const novaMeta = {
        descricao: wishName,
        valor: parseFloat(wishPrice),
      };

      try {
        const res = await fetch(API_METAS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novaMeta),
        });

        if (res.ok) {
          fetchMetas(); // Recarrega a lista do servidor
          setWishName("");
          setWishPrice("");
        } else {
          alert("Erro ao salvar meta no servidor.");
        }
      } catch (e) {
        alert(e + "Erro de conexão com o servidor.");
      }
    };

    const deleteWish = async (id) => {
      try {
        await fetch(`${API_METAS_URL}/${id}`, { method: "DELETE" });
        // Atualização otimista
        setWishes(wishes.filter((w) => w.id !== id));
      } catch (e) {
        alert(e + "Erro ao deletar");
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="text-indigo-200" /> Calculadora de Esforço
          </h2>
          <div className="mt-4 flex flex-col md:flex-row gap-8">
            <div>
              <p className="text-indigo-200 text-sm">Sua Renda Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-indigo-200 text-sm">Horas trabalhadas/mês</p>
                <input
                  type="number"
                  className="w-16 text-black text-sm p-1 rounded"
                  value={workHoursPerMonth}
                  onChange={(e) => setWorkHoursPerMonth(Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-indigo-300 mt-1">
                (Padrão estágio: 120h)
              </p>
            </div>
            <div className="bg-indigo-800 p-3 rounded-lg border border-indigo-500">
              <p className="text-indigo-200 text-xs uppercase font-bold">
                Seu valor hora
              </p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(hourlyRate)}
                <span className="text-sm font-normal">/h</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold mb-4">Adicionar Meta</h3>
            <form onSubmit={addWish} className="space-y-4">
              <input
                type="text"
                placeholder="Ex: Viagem"
                className="w-full p-2 border rounded-lg"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Preço (R$)"
                className="w-full p-2 border rounded-lg"
                value={wishPrice}
                onChange={(e) => setWishPrice(e.target.value)}
              />
              <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                Adicionar à Lista
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            {wishes.map((wish) => {
              const hoursNeeded = hourlyRate > 0 ? wish.price / hourlyRate : 0;
              const daysNeeded = hoursNeeded / 6; // Considerando 6h/dia de estágio

              return (
                <div
                  key={wish.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{wish.name}</h4>
                    <p className="text-slate-500 font-medium">
                      {formatCurrency(wish.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold">
                        Custo em Tempo
                      </p>
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xl">
                        <Clock size={20} />
                        {formatHours(hoursNeeded)}
                      </div>
                      <p className="text-xs text-slate-400">
                        ~{daysNeeded.toFixed(1)} dias de trabalho
                      </p>
                    </div>
                    <button
                      onClick={() => deleteWish(wish.id)}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3 text-white mb-6">
          <Wallet className="w-8 h-8 text-emerald-400" />
          <span className="text-xl font-bold hidden md:block">Finanças</span>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === "dashboard" ? "bg-emerald-600 text-white" : "hover:bg-slate-800"}`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden md:block font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("investments")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === "investments" ? "bg-blue-600 text-white" : "hover:bg-slate-800"}`}
          >
            <TrendingUp size={20} />
            <span className="hidden md:block font-medium">Investimentos</span>
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === "wishlist" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"}`}
          >
            <Target size={20} />
            <span className="hidden md:block font-medium">Metas & Sonhos</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800 hidden md:block">
          <p className="text-xs text-slate-500">Logado como Admin</p>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 p-6 mb-6 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold capitalize text-slate-800">
            {activeTab === "dashboard" && "Visão Geral"}
            {activeTab === "investments" && "Planejador de Futuro"}
            {activeTab === "wishlist" && "Custo de Oportunidade"}
          </h1>
          {error && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded flex gap-1 items-center">
              <WifiOff size={12} /> API Offline
            </span>
          )}
        </header>

        <div className="px-6 pb-6">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "investments" && <InvestmentsView />}
          {activeTab === "wishlist" && <WishlistView />}
        </div>
      </main>
    </div>
  );
};

export default App;
