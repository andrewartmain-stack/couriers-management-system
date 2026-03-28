import { Outlet } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import Sidebar from '../components/Sidebar'


export default function MainLayout() {
    return <AppProvider>
        <div className='flex h-screen'>
            <Sidebar />

            <main className='flex-1 p-8 overflow-y-scroll'>
                <Outlet />
            </main>
        </div>
    </AppProvider>



}