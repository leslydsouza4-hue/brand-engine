import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import BrandEngine from "@/pages/BrandEngine";
import { ClerkProvider, SignIn, SignUp, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ClerkQueryClientCacheInvalidator() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
  }, [userId, queryClient]);

  return null;
}

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Wouter's Route base works transparently, but Clerk needs exact paths
const signInPath = `${basePath}/sign-in`;
const signUpPath = `${basePath}/sign-up`;

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?">
        <div className="flex h-screen items-center justify-center brand-app-bg text-white" style={{ background: "var(--brand-bg-deep, #09090b)" }}>
          <SignIn routing="path" path={signInPath} signUpUrl={signUpPath} />
        </div>
      </Route>
      <Route path="/sign-up/*?">
        <div className="flex h-screen items-center justify-center brand-app-bg text-white" style={{ background: "var(--brand-bg-deep, #09090b)" }}>
          <SignUp routing="path" path={signUpPath} signInUrl={signInPath} />
        </div>
      </Route>
      <Route path="/" component={BrandEngine} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={signInPath}
      signUpUrl={signUpPath}
      signInFallbackRedirectUrl={basePath || "/"}
      signUpFallbackRedirectUrl={basePath || "/"}
      appearance={{
        options: {
          logoImageUrl: `${window.location.origin}${basePath}/assets/logos/Lockup=Full Horizontal, Color=Light.png`,
          logoPlacement: "inside"
        } as any,
        variables: {
          colorPrimary: "#00B2A9",
          colorBackground: "#09090b",
          colorForeground: "#f4f4f5",
          colorMutedForeground: "#a1a1aa",
          colorInput: "#18181b",
          colorInputForeground: "#f4f4f5",
          colorNeutral: "#d4d4d8",
          fontFamily: "Poppins, sans-serif",
          colorDanger: "#ef4444"
        },
        elements: {
          cardBox: { backgroundColor: "#111115", width: "440px", maxWidth: "100%", borderRadius: "16px" },
          card: { backgroundColor: "#111115", color: "#f4f4f5" },
          headerTitle: "text-white font-semibold",
          headerSubtitle: "text-zinc-400",
          socialButtonsBlockButton: "bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]",
          socialButtonsBlockButtonText: "text-white font-medium",
          dividerLine: "bg-white/[0.08]",
          dividerText: "text-zinc-500",
          formFieldLabel: "text-zinc-300",
          formFieldInput: "bg-black border-white/[0.08] text-white focus:border-[#00B2A9]",
          footerActionText: "text-zinc-400",
          footerActionLink: "text-[#00B2A9] hover:text-[#00B2A9]/80",
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
