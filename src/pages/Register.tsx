import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdError, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAppData } from '../context/AppContext';
import { BASE_URL } from "../utils/index";

const Register = () => {
    const navigate = useNavigate();
    const { managers, couriers } = useAppData();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"ADMIN" | "MANAGER" | "COURIER">("COURIER");
    const [managerId, setManagerId] = useState<string>("");
    const [courierId, setCourierId] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{
        isActive: boolean;
        type: "error" | "success";
        message: string;
    }>({ isActive: false, type: "error", message: "" });

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, isActive: false }));
        }, 4000);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors(null);

        // Client-side validation
        const errors: Record<string, string> = {};

        if (!username.trim()) {
            errors.username = "Username is required";
        } else if (username.length < 3 || username.length > 20) {
            errors.username = "Username must be between 3 and 20 characters";
        }

        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Email should be valid";
        }

        if (!password.trim()) {
            errors.password = "Password is required";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("jwt_token");

            if (!token) {
                showAlert("error", "You must be logged in to register users");
                navigate("/login");
                return;
            }

            const payload: Record<string, unknown> = { username, email, password, role };
            if (role === "MANAGER" && managerId) payload.managerId = Number(managerId);
            if (role === "COURIER" && courierId) payload.courierId = Number(courierId);

            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            console.log(JSON.stringify(payload));

            if (response.ok) {
                showAlert("success", "User registered successfully!");

                // Clear form
                setUsername("");
                setEmail("");
                setPassword("");
                setRole("COURIER");
                setManagerId("");
                setCourierId("");

                // Redirect after delay
                setTimeout(() => {
                    navigate("/settings");
                }, 2000);
            } else {
                const text = await response.text();
                console.error("Register error response:", text);
                let error: any;
                try { error = JSON.parse(text); } catch { error = text; }

                if (response.status === 403) {
                    showAlert("error", "Access denied. Only ADMIN users can register new users.");
                } else if (typeof error === "object" && error?.validationErrors) {
                    setValidationErrors(error.validationErrors);
                    showAlert("error", error.message || "Validation failed");
                } else {
                    showAlert("error", typeof error === "string" ? error : error?.message || "Registration failed");
                }
            }
        } catch (error) {
            console.error("Registration error:", error);
            showAlert("error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-8">
            {alert.isActive && (
                <div
                    className={`fixed top-6 right-6 z-50 w-full max-w-sm rounded-xl p-4 shadow-2xl ${alert.type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <MdError className="text-xl" />
                        <p className="text-sm font-semibold">{alert.message}</p>
                    </div>
                </div>
            )}

            <div className="w-full px-4">
                <div className="bg-white rounded-2xl p-8">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Register New User
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Create a new account (ADMIN only)
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Username *
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="3-20 characters"
                                className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none"
                                required
                            />
                            {validationErrors?.username && (
                                <p className="text-red-500 text-xs mt-1">
                                    {validationErrors.username}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none"
                                required
                            />
                            {validationErrors?.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 pr-12 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff size={20} />
                                    ) : (
                                        <MdVisibility size={20} />
                                    )}
                                </button>
                            </div>
                            {validationErrors?.password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label
                                htmlFor="role"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Role *
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value as "ADMIN" | "MANAGER" | "COURIER");
                                    setManagerId("");
                                    setCourierId("");
                                    setEmail("");
                                }}
                                className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none"
                                required
                            >
                                <option value="COURIER">Courier</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Select user role and permissions
                            </p>
                        </div>

                        {/* Manager (only for MANAGER role) */}
                        {role === "MANAGER" && (
                            <div>
                                <label
                                    htmlFor="managerId"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Manager
                                </label>
                                <select
                                    id="managerId"
                                    name="managerId"
                                    value={managerId}
                                    onChange={(e) => {
                                        setManagerId(e.target.value);
                                        const m = managers.find(m => m.id === Number(e.target.value));
                                        setEmail(m?.email ?? "");
                                    }}
                                    className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none"
                                >
                                    <option value="">Select a manager</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.firstname} {m.lastname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Courier (only for COURIER role) */}
                        {role === "COURIER" && (
                            <div>
                                <label
                                    htmlFor="courierId"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Courier
                                </label>
                                <select
                                    id="courierId"
                                    name="courierId"
                                    value={courierId}
                                    onChange={(e) => setCourierId(e.target.value)}
                                    className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none"
                                >
                                    <option value="">Select a courier</option>
                                    {couriers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.firstname} {c.lastname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-3 px-4 rounded-full font-medium text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating Account...
                                </div>
                            ) : (
                                "Create User"
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default Register;