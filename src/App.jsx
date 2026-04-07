import { useState, useEffect } from "react";
import {
  TrendingUp,
  Wallet,
  LayoutDashboard,
  Target,
  Bike,
} from "lucide-react";

import DashboardView from "./components/DashboardView";
import InvestmentsView from "./components/InvestmentsView";
import WishlistView from "./components/WishListView";
import MotoView from "./components/BikeView";

import { API_URL } from "./services/api";

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState(120);
  const [loading, setLoading] = useState(false);
  const [investmentGoalPercent, setInvestmentGoalPercent] = useState(10);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.value, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.value, 0);
  const investmentAmount = totalIncome * (investmentGoalPercent / 100);
  const finalBalance = totalIncome - totalExpenses; //investmentAmount;
  const hourlyRate = totalIncome > 0 ? totalIncome / workHoursPerMonth : 0;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setIncomes(
        data.filter((item) => item.tipo === "Entrada").map(mapApiToFrontend),
      );
      setExpenses(
        data.filter((item) => item.tipo === "Saida").map(mapApiToFrontend),
      );
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const mapApiToFrontend = (item) => ({
    id: item.id,
    name: item.titulo,
    description: item.descricao,
    value: item.valor,
    date: item.data,
    type: item.tipo,
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className="w-20 md:w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3 text-white mb-6">
          <Wallet className="w-8 h-8 text-emerald-400" />
          <span className="text-xl font-bold hidden md:block">Finanças</span>
        </div>

        <nav className="flex-1 space-y-2 px-3 text-sm">
          {[
            {
              id: "dashboard",
              label: "Dashboard",
              icon: <LayoutDashboard size={20} />,
              color: "bg-emerald-600",
            },
            {
              id: "investments",
              label: "Investimentos",
              icon: <TrendingUp size={20} />,
              color: "bg-blue-600",
            },
            {
              id: "wishlist",
              label: "Metas & Sonhos",
              icon: <Target size={20} />,
              color: "bg-indigo-600",
            },
            {
              id: "moto",
              label: "Manutenção Moto",
              icon: <Bike size={20} />,
              color: "bg-orange-600",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 
                ${activeTab === item.id ? `${item.color} text-white shadow-lg` : "hover:bg-slate-800 hover:text-white"}`}
            >
              {item.icon}
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 hidden md:block">
          <p className="text-xs text-slate-500">Logado como Admin</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 p-6 mb-6 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold capitalize text-slate-800">
            {activeTab === "dashboard" && "Visão Geral"}
            {activeTab === "investments" && "Planejador de Futuro"}
            {activeTab === "wishlist" && "Custo de Oportunidade"}
            {activeTab === "moto" && "Gestão da Motocicleta"}
          </h1>
        </header>

        <div className="px-6 pb-6">
          {activeTab === "dashboard" && (
            <DashboardView
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              investmentAmount={investmentAmount}
              investmentGoalPercent={investmentGoalPercent}
              setInvestmentGoalPercent={setInvestmentGoalPercent}
              finalBalance={finalBalance}
              incomes={incomes}
              expenses={expenses}
              setIncomes={setIncomes}
              setExpenses={setExpenses}
              fetchData={fetchData}
              loading={loading}
            />
          )}
          {activeTab === "investments" && (
            <InvestmentsView investmentAmount={investmentAmount} />
          )}
          {activeTab === "wishlist" && (
            <WishlistView
              totalIncome={totalIncome}
              hourlyRate={hourlyRate}
              workHoursPerMonth={workHoursPerMonth}
              setWorkHoursPerMonth={setWorkHoursPerMonth}
            />
          )}
          {activeTab === "moto" && <MotoView />}
        </div>
      </main>
    </div>
  );
};

export default App;
