import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, FileQuestion } from "lucide-react";
import { EnterpriseLayout } from "@/components/EnterpriseLayout";

export default function NotFound() {
  const location = useLocation();
  const isApprovedPath = location.pathname.includes("approved") || location.pathname.includes("approval");

  return (
    <EnterpriseLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {isApprovedPath ? (
          <>
            <div className="rounded-full bg-red-100 p-6 mb-6 dark:bg-red-900/30">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
              Approval Not Found
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              We searched the entire database, the archives, and the backup tapes from 1998. 
              There is no record of any "approval" ever occurring in this organization.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="default" className="bg-blue-700 hover:bg-blue-800">
                <Link to="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Safety
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-full bg-slate-100 p-6 mb-6 dark:bg-slate-800">
              <FileQuestion className="h-12 w-12 text-slate-500 dark:text-slate-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
              404: Resource Deprecated
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              The page you are looking for has been sunsetted, or perhaps it never had the budget to exist in the first place.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </>
        )}
      </div>
    </EnterpriseLayout>
  );
}
