import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PawPrint, LogOut, Building, Gift } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isHomePage]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const headerClasses = isHomePage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`
    : 'bg-white shadow-md sticky top-0 z-50';
    
  const navTextClass = isHomePage && !isScrolled ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary';
  const logoTextClass = isHomePage && !isScrolled ? 'text-white' : 'text-primary';

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className={`flex items-center gap-2 text-2xl font-bold ${logoTextClass} transition-colors`}>
          <PawPrint size={28} />
          PetConnect
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {user.type === 'organization' && (
                <>
                  <Link to="/doacoes" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${navTextClass} transition-colors`}>
                    <Gift size={16} /> Mural de Doações
                  </Link>
                  <Link to="/painel-ong" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${navTextClass} transition-colors`}>
                    <Building size={16} /> Meu Painel
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                Sair
              </button>
            </>
          ) : (
             <Link 
              to="/login" 
              className={
                isHomePage && !isScrolled
                ? 'bg-transparent border border-white text-white px-4 py-2 rounded-md hover:bg-white hover:text-text transition-colors text-sm font-medium'
                : 'bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium'
              }
            >
              Entrar / Cadastrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;