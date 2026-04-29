import './globals.css';

export const metadata = {
  title: 'Transaction Reconciliation Engine',
  description: 'Reconcile your crypto transactions seamlessly',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
