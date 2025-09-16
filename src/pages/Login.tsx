import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { GamaLogo } from '@/components/GamaLogo'; // Updated import

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4">
      <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded-lg shadow-2xl border border-border">
        <h1 className="text-4xl font-extrabold text-center text-primary mb-8 drop-shadow-md">
          Gama Creative OS
        </h1>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers for now
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--input))',
                  inputBorder: 'hsl(var(--border))',
                  inputLabel: 'hsl(var(--muted-foreground))',
                  inputText: 'hsl(var(--foreground))',
                },
              },
            },
          }}
          theme="dark" // Usar o tema escuro para combinar com o app
          redirectTo={window.location.origin} // Redirect to home after login
        />
      </div>
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
};

export default Login;