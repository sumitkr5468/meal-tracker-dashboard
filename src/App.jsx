import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const SUPABASE_URL = "https://uzrhrobflpbyyyhjqmwy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6cmhyb2JmbHBieXl5aGpxbXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzAwODUsImV4cCI6MjA5MzY0NjA4NX0.Moa4lLbap_WMo5ssgZ8YAO7UB5hjeirPcmldYCmW-ys";
const DAILY_CALORIE_TARGET = 2000;

const COLORS = {
  protein: "#6EE7B7",
  carbs: "#FCD34D",
  fat: "#F87171",
  fiber: "#93C5FD",
  bg: "#0F1117",
  card: "#1A1D27",
  border: "#2A2D3E",
  text: "#E2E8F0",
  muted: "#64748B",
  accent: "#6EE7B7",
};

const MICRO_COLORS = ["#6EE7B7", "#FCD34D", "#F87171", "#93C5FD", "#C4B5FD", "#FB923C"];

const DAILY_TARGETS = {
  iron_mg: 18,
  calcium_mg: 1000,
  potassium_mg: 3500,
  magnesium_mg: 400,
  sodium_mg: 2300,
  fiber_g: 30,
};

function fetchMeals(from, to) {
  const url = `${SUPABASE_URL}/rest/v1/meals?created_at=gte.${from}&created_at=lte.${to}&order=created_at.desc`;
  return fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  }).then((r) => r.json());
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function getDateRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: formatDate(from) + "T00:00:00",
    to: formatDate(to) + "T23:59:59",
  };
}

function CalorieRing({ consumed, target }) {
  const pct = Math.min(consumed / target, 1);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct > 1 ? "#F87171" : pct > 0.8 ? "#FCD34D" : "#6EE7B7";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={90} cy={90} r={r} fill="none" stroke={COLORS.border} strokeWidth={14} />
        <circle
          cx={90} cy={90} r={r} fill="none"
          stroke={color} strokeWidth={14}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x={90} y={82} textAnchor="middle" fill={color} fontSize={28} fontWeight={700} fontFamily="monospace">
          {consumed}
        </text>
        <text x={90} y={104} textAnchor="middle" fill={COLORS.muted} fontSize={12} fontFamily="sans-serif">
          of {target} kcal
        </text>
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: COLORS.muted }}>
        <span style={{ color }}>{Math.round(pct * 100)}% of daily goal</span>
        <span>{target - consumed > 0 ? `${target - consumed} remaining` : `${consumed - target} over`}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 110
    }}>
      <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ color: color || COLORS.text, fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, color: COLORS.muted, marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

function MicroBar({ label, value, target, color }) {
  const pct = Math.min((value || 0) / target * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: COLORS.text }}>{label}</span>
        <span style={{ color: COLORS.muted }}>{(value || 0).toFixed(1)} / {target}</span>
      </div>
      <div style={{ background: COLORS.border, borderRadius: 4, height: 6 }}>
        <div style={{
          width: `${pct}%`, height: 6, borderRadius: 4,
          background: color, transition: "width 0.6s ease"
        }} />
      </div>
    </div>
  );
}

function MealRow({ meal }) {
  const r = meal.raw_response || {};
  const grade = r.nutritionGrade || "—";
  const gradeColor = { A: "#6EE7B7", B: "#FCD34D", C: "#FB923C", D: "#F87171" }[grade] || COLORS.muted;
  const inputIcon = { image: "📷", text: "💬", voice: "🎙️" }[meal.input_type] || "•";
  const time = new Date(meal.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      borderBottom: `1px solid ${COLORS.border}`, fontSize: 13
    }}>
      <span style={{ fontSize: 16 }}>{inputIcon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: COLORS.text, fontWeight: 500 }}>{meal.meal_name}</div>
        <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{time}</div>
      </div>
      <div style={{ color: COLORS.text, fontFamily: "monospace", fontSize: 13 }}>{meal.calories} kcal</div>
      <div style={{
        background: gradeColor + "22", color: gradeColor,
        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700
      }}>{grade}</div>
    </div>
  );
}

export default function App() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = customFrom && customTo
        ? { from: customFrom + "T00:00:00", to: customTo + "T23:59:59" }
        : getDateRange(dateRange);
      const data = await fetchMeals(from, to);
      setMeals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [dateRange, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  const today = formatDate(new Date());
  const todayMeals = meals.filter(m => m.created_at?.startsWith(today));
  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const todayCarbs = todayMeals.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const todayFat = todayMeals.reduce((s, m) => s + (m.fat_g || 0), 0);
  const todayFiber = todayMeals.reduce((s, m) => s + (m.fiber_g || 0), 0);

  const macroData = [
    { name: "Protein", value: Math.round(todayProtein * 4), color: COLORS.protein },
    { name: "Carbs", value: Math.round(todayCarbs * 4), color: COLORS.carbs },
    { name: "Fat", value: Math.round(todayFat * 9), color: COLORS.fat },
  ].filter(d => d.value > 0);

  const trendData = (() => {
    const byDay = {};
    meals.forEach(m => {
      const day = m.created_at?.split("T")[0];
      if (!day) return;
      if (!byDay[day]) byDay[day] = { day, calories: 0, protein: 0 };
      byDay[day].calories += m.calories || 0;
      byDay[day].protein += m.protein_g || 0;
    });
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).slice(-30).map(d => ({
      ...d,
      day: d.day.slice(5),
    }));
  })();

  const microTotals = {
    iron_mg: todayMeals.reduce((s, m) => s + (m.iron_mg || 0), 0),
    calcium_mg: todayMeals.reduce((s, m) => s + (m.calcium_mg || 0), 0),
    potassium_mg: todayMeals.reduce((s, m) => s + (m.potassium_mg || 0), 0),
    magnesium_mg: todayMeals.reduce((s, m) => s + (m.magnesium_mg || 0), 0),
    sodium_mg: todayMeals.reduce((s, m) => s + (m.sodium_mg || 0), 0),
    fiber_g: todayFiber,
  };

  const tab = (id, label) => (
    <button onClick={() => setActiveTab(id)} style={{
      background: activeTab === id ? COLORS.accent + "22" : "transparent",
      color: activeTab === id ? COLORS.accent : COLORS.muted,
      border: `1px solid ${activeTab === id ? COLORS.accent + "44" : "transparent"}`,
      borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500
    }}>{label}</button>
  );

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "system-ui, sans-serif", padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
            🥗 Meal Tracker
          </h1>
          <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 13 }}>
            {meals.length} meals • {customFrom && customTo ? `${customFrom} → ${customTo}` : `${dateRange}-day view`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => { setDateRange(d); setCustomFrom(""); setCustomTo(""); }} style={{
              background: dateRange === d && !customFrom ? COLORS.accent + "22" : COLORS.card,
              color: dateRange === d && !customFrom ? COLORS.accent : COLORS.muted,
              border: `1px solid ${dateRange === d && !customFrom ? COLORS.accent + "44" : COLORS.border}`,
              borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12
            }}>{d}d</button>
          ))}
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, padding: "6px 10px", fontSize: 12 }} />
          <span style={{ color: COLORS.muted, fontSize: 12 }}>→</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, padding: "6px 10px", fontSize: 12 }} />
          <button onClick={load} style={{
            background: COLORS.accent, color: "#000", border: "none",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600
          }}>Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {tab("overview", "Overview")}
        {tab("trends", "Trends")}
        {tab("log", "Meal Log")}
        {tab("micros", "Micronutrients")}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: COLORS.muted, padding: 60 }}>Loading meals...</div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 220 }}>
                  <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Today's Calories</div>
                  <CalorieRing consumed={todayCalories} target={DAILY_CALORIE_TARGET} />
                </div>
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, flex: 1, minWidth: 220 }}>
                  <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Macro Split (kcal)</div>
                  {macroData.length > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <PieChart width={140} height={140}>
                        <Pie data={macroData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                          {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {macroData.map((d, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                            <span style={{ color: COLORS.muted }}>{d.name}</span>
                            <span style={{ color: COLORS.text, fontFamily: "monospace" }}>{d.value} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div style={{ color: COLORS.muted, fontSize: 13 }}>No meals logged today</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <StatCard label="Protein" value={todayProtein.toFixed(1)} unit="g" color={COLORS.protein} />
                <StatCard label="Carbs" value={todayCarbs.toFixed(1)} unit="g" color={COLORS.carbs} />
                <StatCard label="Fat" value={todayFat.toFixed(1)} unit="g" color={COLORS.fat} />
                <StatCard label="Fiber" value={todayFiber.toFixed(1)} unit="g" color={COLORS.fiber} />
                <StatCard label="Meals today" value={todayMeals.length} unit="" />
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Today's Meals</div>
                {todayMeals.length > 0
                  ? todayMeals.map((m, i) => <MealRow key={i} meal={m} />)
                  : <div style={{ padding: 24, color: COLORS.muted, fontSize: 13 }}>No meals logged today. Send a photo, text, or voice message to your bot!</div>}
              </div>
            </div>
          )}

          {activeTab === "trends" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Daily Calorie Trend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="day" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Line type="monotone" dataKey="calories" stroke={COLORS.accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Daily Protein Trend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <XAxis dataKey="day" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Bar dataKey="protein" fill={COLORS.protein} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "log" && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                All Meals — {meals.length} records
              </div>
              {meals.length > 0
                ? meals.map((m, i) => <MealRow key={i} meal={m} />)
                : <div style={{ padding: 24, color: COLORS.muted, fontSize: 13 }}>No meals found in this date range.</div>}
            </div>
          )}

          {activeTab === "micros" && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Today's Micronutrients vs Daily Target</div>
              <MicroBar label="Iron" value={microTotals.iron_mg} target={DAILY_TARGETS.iron_mg} color={MICRO_COLORS[0]} />
              <MicroBar label="Calcium" value={microTotals.calcium_mg} target={DAILY_TARGETS.calcium_mg} color={MICRO_COLORS[1]} />
              <MicroBar label="Potassium" value={microTotals.potassium_mg} target={DAILY_TARGETS.potassium_mg} color={MICRO_COLORS[2]} />
              <MicroBar label="Magnesium" value={microTotals.magnesium_mg} target={DAILY_TARGETS.magnesium_mg} color={MICRO_COLORS[3]} />
              <MicroBar label="Sodium" value={microTotals.sodium_mg} target={DAILY_TARGETS.sodium_mg} color={MICRO_COLORS[4]} />
              <MicroBar label="Fiber" value={microTotals.fiber_g} target={DAILY_TARGETS.fiber_g} color={MICRO_COLORS[5]} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
