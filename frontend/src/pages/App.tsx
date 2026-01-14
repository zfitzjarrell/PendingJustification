import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-blue-700 rounded-xl mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-md">
            PJ
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pending Justification</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Enterprise Resource Rejection Portal</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
           <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg border border-blue-100 dark:border-blue-900 flex gap-3">
              <Lock className="h-5 w-5 shrink-0" />
              <p>Authorized personnel only. All actions are logged and will be used against you in performance reviews.</p>
           </div>
           
           <Button 
            className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base"
            onClick={() => navigate("/dashboard")}
           >
             Sign In via SSO
             <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
           
           <p className="text-xs text-center text-slate-400">
             v4.2.0-rc1 • System Operational
           </p>
        </div>
      </div>
    </div>
  );
}
