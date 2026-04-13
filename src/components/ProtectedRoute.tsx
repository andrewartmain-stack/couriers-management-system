import { Navigate } from "react-router-dom";
import { clearAuthData, isTokenValid } from '../utils/index';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const token = localStorage.getItem("jwt_token");

    if (!token || !isTokenValid()) {
        clearAuthData();
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;