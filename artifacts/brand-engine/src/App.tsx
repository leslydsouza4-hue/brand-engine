import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import BrandEngine from "@/pages/BrandEngine";
import AuthPage from "@/pages/AuthPage";
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
        <AuthPage>
          <SignIn routing="path" path={signInPath} signUpUrl={signUpPath} />
        </AuthPage>
      </Route>
      <Route path="/sign-up/*?">
        <AuthPage>
          <SignUp routing="path" path={signUpPath} signInUrl={signInPath} />
        </AuthPage>
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
          cardBox: { backgroundColor: "#111115", width: "100%", maxWidth: "100%", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)" },
          card: { backgroundColor: "#111115", color: "#f4f4f5", boxShadow: "none" },
          headerTitle: { color: "#ffffff", fontWeight: 600, fontSize: "1.5rem" },
          headerSubtitle: { color: "#a1a1aa" },
          socialButtonsBlockButton: { backgroundColor: "rgba(255, 255, 255, 0.03)", borderColor: "rgba(255, 255, 255, 0.08)", color: "#ffffff", padding: "12px" },
          socialButtonsBlockButtonText: { color: "#ffffff", fontWeight: 500 },
          socialButtonsProviderIcon: { filter: "brightness(1) invert(0)" },
          dividerLine: { backgroundColor: "rgba(255, 255, 255, 0.08)" },
          dividerText: { color: "#71717a" },
          formFieldLabel: { color: "#d4d4d8" },
          formFieldInput: { backgroundColor: "#09090b", borderColor: "rgba(255, 255, 255, 0.08)", color: "#ffffff" },
          footerActionText: { color: "#a1a1aa" },
          footerActionLink: { color: "#00B2A9" },
          identityPreviewText: { color: "#ffffff" },
          identityPreviewEditButtonIcon: { color: "#00B2A9" },
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
