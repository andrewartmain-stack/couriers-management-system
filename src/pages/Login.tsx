import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdError, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { BASE_URL } from "../utils/index";
import logoIcon from "/logo-icon.png";
import deliveryImage from "../../public/login-image.png";

interface LoginResponse {
    token: string;
    id: number;
    username: string;
    email: string;
    role: string;
    courierId: number | null;
    managerId: number | null;
}

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors(null);

        if (!username.trim() || !password.trim()) {
            setValidationErrors({
                username: !username.trim() ? "Username is required" : "",
                password: !password.trim() ? "Password is required" : "",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data: LoginResponse = await response.json();

                localStorage.setItem("jwt_token", data.token);
                localStorage.setItem("user_id", data.id.toString());
                localStorage.setItem("username", data.username);
                localStorage.setItem("user_email", data.email);
                localStorage.setItem("user_role", data.role);
                if (data.managerId != null) {
                    localStorage.setItem("manager_id", data.managerId.toString());
                } else {
                    localStorage.removeItem("manager_id");
                }
                if (data.courierId != null) {
                    localStorage.setItem("courier_id", data.courierId.toString());
                } else {
                    localStorage.removeItem("courier_id");
                }

                showAlert("success", "Login successful! Redirecting...");

                setTimeout(() => {
                    navigate(data.role === 'ROLE_ADMIN' ? '/' : '/couriers');
                }, 1000);
            } else {
                const text = await response.text();
                let error: any;
                try { error = JSON.parse(text); } catch { error = text; }

                if (typeof error === "object" && error?.validationErrors) {
                    setValidationErrors(error.validationErrors);
                    showAlert("error", error.message || "Validation failed");
                } else if (response.status === 401) {
                    showAlert("error", "Invalid username or password");
                } else {
                    showAlert("error", typeof error === "string" ? error : error?.message || "Login failed");
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            showAlert("error", "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
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

            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 items-center justify-center">
                <img
                    src={deliveryImage}
                    alt="Delivery Service"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-md">
                    {/* Logo and Branding */}
                    <div className="flex items-center justify-center mb-8">
                        <img
                            src={logoIcon}
                            alt="Logo"
                            className="w-12 h-12 object-contain"
                        />
                        <h1 className="text-2xl font-bold text-gray-900 ml-3">
                            titanic<span className="text-blue-600">.</span>
                        </h1>
                    </div>

                    {/* Welcome Section */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-gray-600 text-sm">
                            Sign in to your account to continue managing your deliveries
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                required
                            />
                            {validationErrors?.username && (
                                <p className="text-red-500 text-xs mt-1">
                                    {validationErrors.username}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 px-4 pr-12 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium text-sm hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;