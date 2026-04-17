import { Outlet } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import Sidebar from '../components/Sidebar'


export default function MainLayout() {
    return <AppProvider>
        <div className='flex h-screen overflow-x-hidden'>
            <Sidebar />

            <main className='flex-1 py-2 overflow-y-scroll bg-black/95 overflow-x-hidden'>
                <div className='p-8 bg-white rounded-l-2xl overflow-x-hidden'>
                    <Outlet />
                </div>
            </main>
        </div>
    </AppProvider>



}