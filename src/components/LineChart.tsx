import { useState, useRef, useEffect } from 'react';
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
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
                setCityDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    <div ref={cityDropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                border: '1px solid #e5e7eb',
                                background: '#fafafa',
                                color: '#555',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color 0.2s, background 0.2s, color 0.2s',
                                fontFamily: 'inherit',
                            }}
                        >
                            {city === 'all' ? `All ${groupLabel}` : city}
                        </button>
                        {cityDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 10,
                                padding: 6,
                                minWidth: 180,
                                maxHeight: 220,
                                overflowY: 'auto',
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: 12 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                    <input
                                        type="radio"
                                        checked={city === 'all'}
                                        onChange={() => { setCity('all'); setCityDropdownOpen(false); }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>All {groupLabel}</span>
                                </label>
                                {citiesData.map(c => (
                                    <label key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: 12 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                        <input
                                            type="radio"
                                            checked={city === c.city}
                                            onChange={() => { setCity(c.city); setCityDropdownOpen(false); }}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{c.city}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

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