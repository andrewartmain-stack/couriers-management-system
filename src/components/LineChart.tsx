import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type CityData = {
    city: string;
    currentYearData: number[];
    previousYearData: number[];
    color: string;
};

type LineChartProps = {
    citiesData: CityData[];
    labels: string[];
    dataType?: 'revenue' | 'couriers';
    currencySymbol?: string;
    groupLabel?: string;
    showComparison?: boolean;
};

const WEEKS = [7, 14, 28, 52];

const css = `
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.25s ease both; }
`;

export const LineChart = ({
    citiesData,
    labels,
    dataType = 'revenue',
    currencySymbol = 'lei',
    groupLabel = 'All',
    showComparison = false,
}: LineChartProps) => {
    const [city, setCity] = useState(citiesData[1]?.city ?? citiesData[0]?.city ?? '');
    const [weeks, setWeeks] = useState(7);
    const [animKey, setAnimKey] = useState(0);

    const trigger = (fn: () => void) => { fn(); setAnimKey(k => k + 1); };

    const filtered = city === 'all' ? citiesData : citiesData.filter(c => c.city === city);
    const sliced = filtered.map(c => ({
        ...c,
        cur: c.currentYearData.slice(-weeks),
        prev: c.previousYearData.slice(-weeks),
    }));

    const total = sliced.reduce((s, c) => s + c.cur.reduce((a, b) => a + b, 0), 0);
    const prevTotal = sliced.reduce((s, c) => s + c.prev.reduce((a, b) => a + b, 0), 0);
    const yoy = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
    const fmt = (v: number) => dataType === 'revenue' ? `${currencySymbol}${v.toLocaleString()}` : v.toLocaleString();

    const curDatasets = sliced.map(c => ({
        label: c.city,
        data: c.cur,
        borderColor: c.color,
        backgroundColor: (ctx: any) => {
            if (!ctx.chart.chartArea) return `${c.color}12`;
            const { top, bottom } = ctx.chart.chartArea;
            const g = ctx.chart.ctx.createLinearGradient(0, top, 0, bottom);
            g.addColorStop(0, `${c.color}28`);
            g.addColorStop(1, `${c.color}00`);
            return g;
        },
        borderWidth: 1.5,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
    }));

    const prevDatasets = showComparison ? sliced.map(c => ({
        label: `${c.city} (prev)`,
        data: c.prev,
        borderColor: `${c.color}35`,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 3],
        tension: 0.4,
        pointRadius: 0,
        fill: false,
    })) : [];

    const data = {
        labels: labels.slice(-weeks),
        datasets: [...curDatasets, ...prevDatasets],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350, easing: 'easeInOutQuart' as const },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#999',
                bodyColor: '#111',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                usePointStyle: true,
                boxPadding: 4,
            },
        },
        interaction: { mode: 'index' as const, intersect: false },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#bbb', font: { size: 10 }, maxRotation: 0, autoSkip: true, autoSkipPadding: 20 },
            },
            y: { display: false },
        },
    };

    return (
        <>
            <style>{css}</style>
            <div style={{ fontFamily: 'system-ui, sans-serif' }}>
                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <select
                        value={city}
                        onChange={e => trigger(() => setCity(e.target.value))}
                        style={{
                            padding: '4px 28px 4px 10px',
                            borderRadius: 8,
                            border: '#e5e7eb',
                            background: '#fafafa',
                            color: '#555',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            transition: 'border-color 0.2s, background 0.2s, color 0.2s',
                            fontFamily: 'inherit',
                        }}
                    >
                        <option value="all">All {groupLabel}</option>
                        {citiesData.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                    </select>

                    <div style={{ display: 'flex', gap: 1 }}>
                        {WEEKS.map(w => (
                            <button key={w} onClick={() => trigger(() => setWeeks(w))} style={{
                                padding: '3px 8px',
                                border: 'none',
                                background: weeks === w ? '#f3f4f6' : 'transparent',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: weeks === w ? 600 : 400,
                                color: weeks === w ? '#111' : '#bbb',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}>
                                {w}W
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats — re-mounts on change to replay animation */}
                <div key={animKey} className="fade-up" style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: '#111' }}>
                        {fmt(total)}
                    </span>
                    {showComparison && (
                        <span style={{ fontSize: 11, fontWeight: 500, color: yoy >= 0 ? '#16a34a' : '#dc2626' }}>
                            {yoy >= 0 ? '+' : ''}{yoy}% YoY
                        </span>
                    )}
                </div>

                {/* Chart */}
                <div style={{ height: 140 }}>
                    <Line data={data} options={options} />
                </div>
            </div>
        </>
    );
};