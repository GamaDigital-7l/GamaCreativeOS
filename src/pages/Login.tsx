import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4">
      <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded-lg shadow-2xl border border-border">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Bem-vindo(a)!</h1>
          <p className="text-muted-foreground text-lg">Faça login para acessar sua conta.</p>
        </div>
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
                  // inputLabel: 'hsl(var(--muted-foreground))', // Removed non-standard property
                  inputText: 'hsl(var(--foreground))',
                },
              },
            },
          }}
          theme="dark" // Usar o tema escuro para combinar com o app
          redirectTo={window.location.origin} // Redirect to home after login
          view="sign_in" // Exibir apenas a tela de login
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Ou continue com',
                // no_account_text: '', // Removed non-standard property
                // sign_up_link_text: '', // Removed non-standard property
                link_text: '', // Esconde qualquer outro link que possa aparecer na tela de sign_in
              },
              forgotten_password: {
                email_label: 'Seu e-mail',
                password_label: 'Sua nova senha',
                email_input_placeholder: 'Digite seu e-mail para redefinir a senha',
                button_label: 'Enviar instruções de redefinição',
                link_text: 'Lembrou sua senha? Faça login', // Garante que este link leve de volta ao login
                confirmation_text: 'Verifique seu e-mail para o link de redefinição de senha.',
              },
              // Explicitamente definindo a view 'sign_up' como vazia para garantir que não seja renderizada
              sign_up: {
                email_label: '',
                password_label: '',
                email_input_placeholder: '',
                password_input_placeholder: '',
                button_label: '',
                social_provider_text: '',
                link_text: '',
                // no_account_text: '', // Removed non-standard property
                // sign_up_link_text: '', // Removed non-standard property
              },
              update_password: {
                password_label: 'Sua nova senha',
                password_input_placeholder: 'Digite sua nova senha',
                button_label: 'Atualizar senha',
                confirmation_text: 'Sua senha foi atualizada.',
              },
              magic_link: {
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar link mágico',
                link_text: 'Entrar com link mágico',
                confirmation_text: 'Verifique seu e-mail para o link mágico.',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;