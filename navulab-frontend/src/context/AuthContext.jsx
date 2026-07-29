import { createContext, useState, useCallback } from "react";
import api from "../api/client";
import { decodeJWT } from "../api/jwt";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/token/", { username, password });
      const claims = decodeJWT(data.access);

      const userInfo = {
        id: claims.user_id,
        username: claims.username,
        email: claims.email,
        role: claims.role,
        department_id: claims.department_id,
        custom_role_name: claims.custom_role_name ?? null,
        can_see_all_departments: claims.can_see_all_departments,
        can_manage_employees: claims.can_manage_employees,
        can_manage_payroll: claims.can_manage_payroll,
        can_review_leaves_reports: claims.can_review_leaves_reports,
        can_manage_tasks_all: claims.can_manage_tasks_all,
      };

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Couldn't sign in — check the username and password.";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // `can_see_all_departments` etc. come from the JWT (server-computed, factors in
  // any custom role too); fall back to the old fixed-role check for tokens issued
  // before these claims existed, so a user isn't logged out just for this change.
  const canSeeAllDepartments = user?.can_see_all_departments ?? ["ADMIN", "CEO", "CTO", "HR"].includes(user?.role);
  const isTeamLead = user?.role === "TEAM_LEAD";
  const isFinance = user?.role === "FINANCE";
  const isHR = user?.role === "HR";
  const isCEO = user?.role === "CEO";
  const isCTO = user?.role === "CTO";
  const isAdmin = user?.role === "ADMIN";
  const canManageEmployees = user?.can_manage_employees ?? (canSeeAllDepartments || isTeamLead);
  const canManagePayroll = user?.can_manage_payroll ?? (isFinance || isHR || isAdmin);
  const canReviewLeavesReports = user?.can_review_leaves_reports ?? (canSeeAllDepartments || isTeamLead);
  const canManageTasksAll = user?.can_manage_tasks_all ?? (canSeeAllDepartments || isTeamLead);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        error,
        loading,
        canSeeAllDepartments,
        isTeamLead,
        isFinance,
        isHR,
        isCEO,
        isCTO,
        isAdmin,
        canManageEmployees,
        canManagePayroll,
        canReviewLeavesReports,
        canManageTasksAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
