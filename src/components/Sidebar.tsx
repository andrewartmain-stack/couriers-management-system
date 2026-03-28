import { NavLink } from 'react-router-dom';
import { CityIcon, CrownSimpleIcon, FileIcon, HouseSimpleIcon, PersonSimpleBikeIcon, TagIcon, UserIcon, GearIcon, LogIcon, UserPlusIcon } from '@phosphor-icons/react';
import { useAppData } from '../context/AppContext';

const Sidebar = () => {
    const { couriers, accounts, managers, tags, cities } = useAppData();

    const username = localStorage.getItem('username') ?? '';
    const email = localStorage.getItem('user_email') ?? '';
    const role = localStorage.getItem('user_role') ?? '';
    const storedManagerId = localStorage.getItem('manager_id');
    const myManagerId = storedManagerId ? Number(storedManagerId) : null;

    const isAdmin = role === 'ROLE_ADMIN';

    const myCourierIds = !isAdmin && myManagerId
        ? new Set(couriers.filter(c => c.managerId === myManagerId).map(c => c.id))
        : null;

    const visibleCouriersCount = isAdmin ? couriers.length : (myCourierIds?.size ?? 0);
    const visibleAccountsCount = isAdmin ? accounts.length : accounts.filter(a => myCourierIds?.has(a.courierId)).length;

    const navItems = isAdmin ? [
        { to: "/", label: "Dashboard", icon: HouseSimpleIcon },
        { to: "/couriers", label: "Couriers", icon: PersonSimpleBikeIcon, total: couriers.length },
        { to: "/accounts", label: "Accounts", icon: UserIcon, total: accounts.length },
        { to: "/managers", label: "Managers", icon: CrownSimpleIcon, total: managers.length },
        { to: "/tags", label: "Tags", icon: TagIcon, total: tags.length },
        { to: "/cities", label: "Cities", icon: CityIcon, total: cities.length },
        { to: "/reports", label: "Reports", icon: FileIcon },
        { to: "/register", label: "Create Account", icon: UserPlusIcon },
    ] : [
        { to: "/couriers", label: "Couriers", icon: PersonSimpleBikeIcon, total: visibleCouriersCount },
        { to: "/accounts", label: "Accounts", icon: UserIcon, total: visibleAccountsCount },
        { to: "/my-reports", label: "My Reports", icon: FileIcon },
    ];

    const linkStyle = ({ isActive }: { isActive: boolean }) => ({
        background: isActive ? 'var(--accent-dark)' : '',
        color: isActive ? 'white' : 'var(--text-primary)',
    });

    const linkCls = "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-(--bg-hover)";

    return (
        <aside className="h-screen w-62 border-r border-[var(--border-default)] flex flex-col justify-between px-3 py-5 bg-[var(--bg-app)]">

            <div className="flex flex-col gap-6">
                {/* Brand */}
                <div className="px-1 pt-1">
                    <span className="font-bold text-xl tracking-tight">Titanic S.R.L.</span>
                </div>

                {/* User card */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-100">
                    <div className="flex flex-col min-w-0 gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate leading-tight">{username}</span>
                            {role && (
                                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[var(--accent-dark)] text-white shrink-0">
                                    {role}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)] truncate">{email}</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] px-3 mb-1.5">
                        Navigation
                    </span>
                    {navItems.map(({ to, label, icon: Icon, total }) => (
                        <NavLink key={label} to={to} className={linkCls} style={linkStyle} end={to === "/"}>
                            <div className="flex gap-3 items-center">
                                <Icon size={17} />
                                {label}
                            </div>
                            {total ? (
                                <div className="bg-green-200 px-1 py-px text-xs rounded-md text-green-700">
                                    {total}
                                </div>
                            ) : null}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom */}
            <div className="flex flex-col gap-0.5">
                <div className="h-px bg-[var(--border-default)] mb-2" />
                <NavLink to="/settings" className={linkCls} style={linkStyle}>
                    <div className="flex gap-3 items-center">
                        <GearIcon size={17} /> Settings
                    </div>
                </NavLink>
                <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-[var(--error-text)] hover:bg-[var(--error-bg)] cursor-pointer"
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                >
                    <LogIcon size={17} /> Logout
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;
