const Settings = () => {
    const username = localStorage.getItem('username') ?? '';
    const email = localStorage.getItem('user_email') ?? '';
    const role = localStorage.getItem('user_role') ?? '';
    const userId = localStorage.getItem('user_id') ?? '';
    const fields = [
        { label: 'Username', value: username },
        { label: 'Email address', value: email },
        { label: 'User ID', value: `#${userId}` },
    ];

    return (
        <div className="max-w-2xl flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account information.</p>
            </div>

            {/* Profile section */}
            <div className="flex flex-col gap-5">
                <div>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Profile</h2>
                    <div className="h-px bg-[var(--border-default)] mt-2" />
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">{username}</span>
                            {role && (
                                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[var(--accent-dark)] text-white">
                                    {role}
                                </span>
                            )}
                        </div>
                        <span className="text-sm text-[var(--text-secondary)]">{email}</span>
                    </div>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-3">
                    {fields.map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
                            <div className="px-3 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-[var(--text-primary)] select-all">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Settings;
