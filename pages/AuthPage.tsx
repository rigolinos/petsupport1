import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Organization, OrganizationStatus } from '../types';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'registerNgo'
  const navigate = useNavigate();
  const { login, registerNgo } = useAuth();
  const [error, setError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [ngoForm, setNgoForm] = useState({ 
      name: '', 
      cnpj: '', 
      city: '', 
      state: '', 
      contactPhone: '', 
      ownerEmail: '',
      password: '',
      confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(loginEmail, loginPassword);
      if (user?.type === 'organization') {
        if(user.status === OrganizationStatus.Pending) {
          navigate('/pending-approval');
        } else {
          navigate('/doacoes');
        }
      } else {
         setError('E-mail ou senha inválidos.');
      }
    } catch (err) {
      setError('Falha no login. Verifique seu e-mail e senha.');
    }
  };
  
  const handleRegisterNgo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (ngoForm.password !== ngoForm.confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }
    try {
        const ngoData: Omit<Organization, 'id' | 'created_at' | 'type' | 'status' | 'password' | 'owner_user_id'> = {
            name: ngoForm.name,
            cnpj: ngoForm.cnpj,
            city: ngoForm.city,
            state: ngoForm.state,
            contact_phone: ngoForm.contactPhone,
            contact_email: ngoForm.ownerEmail
        };
        await registerNgo(ngoData, ngoForm.password);
        navigate('/pending-approval'); 
    } catch (err) {
        setError('Falha no cadastro da ONG. Tente novamente.');
    }
  };

  const renderForm = () => {
    switch(activeTab) {
      case 'login':
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <h3 className="text-xl font-semibold">Entrar (ONG)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white text-gray-900" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white text-gray-900" />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600">Entrar</button>
          </form>
        );
      case 'registerNgo':
        return (
          <form onSubmit={handleRegisterNgo} className="space-y-4">
            <h3 className="text-xl font-semibold">Cadastrar ONG</h3>
            <input placeholder="Nome da ONG" value={ngoForm.name} onChange={e => setNgoForm({...ngoForm, name: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="CNPJ" value={ngoForm.cnpj} onChange={e => setNgoForm({...ngoForm, cnpj: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="Cidade" value={ngoForm.city} onChange={e => setNgoForm({...ngoForm, city: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="Estado" value={ngoForm.state} onChange={e => setNgoForm({...ngoForm, state: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="Telefone de Contato" value={ngoForm.contactPhone} onChange={e => setNgoForm({...ngoForm, contactPhone: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="Email de Contato da ONG" type="email" value={ngoForm.ownerEmail} onChange={e => setNgoForm({...ngoForm, ownerEmail: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="Senha" type="password" value={ngoForm.password} onChange={e => setNgoForm({...ngoForm, password: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <input placeholder="Confirmar Senha" type="password" value={ngoForm.confirmPassword} onChange={e => setNgoForm({...ngoForm, confirmPassword: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" />
            <button type="submit" className="w-full bg-secondary text-white py-2 px-4 rounded-md hover:bg-green-600">Cadastrar ONG</button>
          </form>
        );
      default: return null;
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('login')} className={`flex-1 py-3 text-center font-medium ${activeTab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50'}`}>Entrar</button>
          <button onClick={() => setActiveTab('registerNgo')} className={`flex-1 py-3 text-center font-medium ${activeTab === 'registerNgo' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:bg-gray-50'}`}>Cadastrar ONG</button>
        </div>
        <div className="p-6">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;