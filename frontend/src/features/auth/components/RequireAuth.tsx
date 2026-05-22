
  import { Navigate } from "react-router-dom";
  import { useUser } from "../hooks/useUser";

  type Props = {
    children: React.ReactNode;
  };

  const RequireAuth = ({ children }: Props) => {
    const user = useUser((s) => s.user);
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  export default RequireAuth;