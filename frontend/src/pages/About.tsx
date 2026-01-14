import { EnterpriseLayout } from "@/components/EnterpriseLayout";
import { Button } from "@/components/ui/button";

export default function About() {
    return (
        <EnterpriseLayout>
            <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
                <div className="h-24 w-24 bg-blue-700 rounded-xl mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    PJ
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Pending Justification
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pending Justification is a decision-support platform for requests that are not ready to be decided.
                </p>

                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-left space-y-4">
                    <p>
                        Founded in 1994 as a spreadsheet called "Things To Ignore", we have grown into the world's leading provider of delay-as-a-service solutions.
                    </p>
                    <p>
                        Our mission is to ensure that every request undergoes rigorous, infinite scrutiny until it is no longer relevant.
                    </p>
                </div>

                <div className="pt-8 text-sm text-muted-foreground">
                    <p>San Francisco • London • The Void</p>
                    <p className="mt-2">© 2024 Pending Justification Inc.</p>
                </div>
            </div>
        </EnterpriseLayout>
    );
}
