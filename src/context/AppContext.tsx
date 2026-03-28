import { createContext, useContext, useEffect, useState } from 'react';
import type { Courier, City, Account, Manager, Tag } from '../types/index';
import { getAuthHeaders } from '../utils/index';

const BASE = 'https://99c3-109-166-138-69.ngrok-free.app/api';
const getHeaders = () => {
    const headers = getAuthHeaders();
    delete headers['Content-Type'];
    return headers;
};
const get = (path: string) => fetch(`${BASE}${path}`, { headers: getHeaders() }).then(r => r.json());

type AppData = {
    couriers: Courier[];
    cities: City[];
    accounts: Account[];
    managers: Manager[];
    tags: Tag[];
    loading: boolean;
    refresh: () => void;
};

const AppContext = createContext<AppData>({
    couriers: [], cities: [], accounts: [], managers: [], tags: [],
    loading: true, refresh: () => { },
});

export const useAppData = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState({
        couriers: [] as Courier[],
        cities: [] as City[],
        accounts: [] as Account[],
        managers: [] as Manager[],
        tags: [] as Tag[],
    });
    const [loading, setLoading] = useState(true);

    const fetchAll = () => {
        setLoading(true);
        Promise.all([
            get('/couriers'),
            get('/cities'),
            get('/accounts'),
            get('/managers'),
            get('/tags'),
        ])
            .then(([couriers, cities, accounts, managers, tags]) =>
                setData({ couriers, cities, accounts, managers, tags })
            )
            .catch(err => console.error('Fetch error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(fetchAll, []);

    return (
        <AppContext.Provider value={{ ...data, loading, refresh: fetchAll }}>
            {children}
        </AppContext.Provider>
    );
}