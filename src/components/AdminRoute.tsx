// components/AdminRoute.tsx
import { Navigate } from "react-router-dom";

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
    const token = localStorage.getItem("jwt_token");
    const role = localStorage.getItem("user_role");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "ROLE_ADMIN") {
        return <Navigate to="/couriers" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;