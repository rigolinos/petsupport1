import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Link, useNavigate } from 'react-router-dom';
import { Medicine, Ration, Article, ResourceRequest, Organization, ApplicationStatus, Resource, ResourceType } from '../types';
import Spinner from '../components/Spinner';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

type ResourceItem = (Medicine | Ration | Article) & { type: ResourceType };

const NgoDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const { user } = useAuth();
  const {
    organizations,
    medicines,
    rations,
    articles,
    resourceRequests,
    loading: dataLoading,
    getResourceRequestsForNgo,
    updateResourceRequestStatus,
  } = useData();
  
  const [requests, setRequests] = useState<ResourceRequest[]>([]);

  const loading = dataLoading || !user;

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.type === 'organization') {
        const reqs = await getResourceRequestsForNgo(user.id);
        setRequests(reqs);
      }
    };
    fetchData();
  }, [user, getResourceRequestsForNgo, resourceRequests]);

  const { myInventory } = useMemo(() => {
    if (!user) return { myInventory: [] };

    const inventory: ResourceItem[] = [
      ...medicines.filter(m => m.organization_id === user.id).map(m => ({...m, type: 'medicines' as ResourceType})),
      ...rations.filter(r => r.organization_id === user.id).map(r => ({...r, type: 'rations' as ResourceType})),
      ...articles.filter(a => a.organization_id === user.id).map(a => ({...a, type: 'articles' as ResourceType})),
    ];
    
    return { myInventory: inventory };

  }, [user, medicines, rations, articles]);
  
  const handleRequestUpdate = async (reqId: string, status: ApplicationStatus) => {
     await updateResourceRequestStatus(reqId, status);
  }

  if (loading) return <Spinner />;
  if (!user) return null;

  const renderMyInventory = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Meu Inventário</h2>
        <Link to="/painel-ong/recursos/novo" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600">
          <PlusCircle size={18} /> Adicionar Item
        </Link>
      </div>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {myInventory.map(item => (
                    <tr key={`${item.type}-${item.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                           <Link to={`/recurso/${item.type}/${item.id}`} className="text-primary hover:underline">
                            {'name' in item ? item.name : item.brand}
                           </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type === 'medicines' ? 'Medicamento' : item.type === 'rations' ? 'Ração' : 'Artigo'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link to={`/painel-ong/recursos/editar/${item.type}/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18}/></Link>
                            <button className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
                {myInventory.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-gray-500">Seu inventário está vazio.</td></tr>}
            </tbody>
         </table>
      </div>
    </div>
  );
  
  const renderRequests = () => (
    <div>
        <h2 className="text-2xl font-bold">Solicitações Recebidas</h2>
        <p className="text-sm text-gray-500 mb-4">Aprove ou recuse os pedidos de doação para os itens do seu inventário.</p>
        <div className="space-y-4">
            {requests.length > 0 ? requests.map(req => {
                 const resource = myInventory.find(i => i.id === req.resource_id);
                 const org = organizations.find(o => o.id === req.requesting_organization_id);
                 return (
                     <div key={req.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <p><strong>{org?.name || 'ONG'}</strong> solicitou <strong>{resource ? ('name' in resource ? resource.name : resource.brand) : 'item'}</strong>.</p>
                            <p className="text-sm text-gray-500">Status: {req.status}</p>
                        </div>
                        {req.status === 'Pending' && (
                            <div className="flex gap-2">
                                <button onClick={() => handleRequestUpdate(req.id, ApplicationStatus.Approved)} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">Aprovar</button>
                                <button onClick={() => handleRequestUpdate(req.id, ApplicationStatus.Rejected)} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Recusar</button>
                            </div>
                        )}
                     </div>
                 );
            }) : <p className="text-center p-4 text-gray-500 bg-white rounded-lg shadow">Nenhuma solicitação recebida.</p>}
        </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Meu Painel - {user.name}</h1>
      <div className="flex border-b mb-6 flex-wrap">
        <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 font-semibold ${activeTab === 'inventory' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Meu Inventário</button>
        <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 font-semibold ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Solicitações Recebidas</button>
      </div>

      <div>
        {activeTab === 'inventory' && renderMyInventory()}
        {activeTab === 'requests' && renderRequests()}
      </div>
    </div>
  );
};

export default NgoDashboardPage;