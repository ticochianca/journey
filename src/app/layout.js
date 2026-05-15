import './globals.css';

export const metadata = {
  title: 'Journey | Gestão de Experiências',
  description: 'Plataforma para gestão de pessoas em experiências enteogênicas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        {children}
      </body>
    </html>
  );
}
