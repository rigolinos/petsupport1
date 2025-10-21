
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { Medicine, Ration, Article, ResourceStatus, Resource, ResourceType, Organization, ArticleCategory } from '../types';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import { Pill, Bone, Shirt, MapPin, Calendar, Box, AlertTriangle, Search } from 'lucide-react';


type ResourceItem = (Medicine | Ration | Article) & { type: ResourceType };
type DonationItem = {
    resource: ResourceItem;
    organization: Organization;
};

// --- Helper Functions ---

const isUrgent = (expirationDate?: string): boolean => {
    if (!expirationDate) return false;
    const now = new Date();
    const expDate = new Date(expirationDate);
    // Set hours to 0 to compare dates only
    now.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 90; // Is not expired and expires within 90 days
};

const renderPlaceholderIcon = (type: ResourceType) => {
    const iconProps = { size: 48, className: 'text-gray-400' };
    switch(type) {
        case 'medicines': return <Pill {...iconProps} />;
        case 'rations': return <Bone {...iconProps} />;
        case 'articles': return <Shirt {...iconProps} />;
        default: return null;
    }
}

// --- Resource Card Component ---

const ResourceCard: React.FC<{ item: DonationItem }> = ({ item }) => {
    const { resource, organization } = item;
    const urgent = 'expiration_date' in resource && isUrgent(resource.expiration_date);
    const itemName = 'name' in resource ? resource.name : resource.brand;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <div className="relative">
                 {resource.photo_base64 ? (
                    <img src={resource.photo_base64} alt={itemName} className="w-full h-48 object-cover" />
                ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        {renderPlaceholderIcon(resource.type)}
                    </div>
                )}
                {urgent && (
                    <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1">
                        <AlertTriangle size={14} /> VALIDADE PRÓXIMA
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 truncate">{itemName}</h3>
                <p className="text-sm text-gray-500 mb-3">Doador: {organization.name}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                        <Box size={14} className="text-primary"/> 
                        <span>
                            {'quantity_kg' in resource ? `${resource.quantity_kg} kg` : `Qtd: ${resource.quantity}`}
                        </span>
                    </div>
                     {'expiration_date' in resource && resource.expiration_date && (
                        <div className={`flex items-center gap-2 ${urgent ? 'text-accent font-semibold' : ''}`}>
                           <Calendar size={14} className="text-primary"/> <span>Val: {new Date(resource.expiration_date).toLocaleDateString()}</span>
                        </div>
                     )}
                     <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary"/> <span>{organization.city}, {organization.state}</span>
                     </div>
                </div>
                
                <div className="mt-auto">
                    <Link to={`/recurso/${resource.type}/${resource.id}`} className="w-full block text-center bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
};


// --- Main Donations Page Component ---

const DonationsPage: React.FC = () => {
  const { user } = useAuth();
  const { organizations, medicines, rations, articles, loading: dataLoading, error, clearError } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [urgentFilter, setUrgentFilter] = useState(false);

  const loading = dataLoading || !user;

  const { filteredDonations, uniqueStates } = useMemo(() => {
    if (!user || !organizations.length) return { filteredDonations: [], uniqueStates: [] };
    
    const donations: ResourceItem[] = [
        ...medicines.filter(m => m.organization_id !== user.id && m.status === ResourceStatus.Available).map(m => ({...m, type: 'medicines' as ResourceType})),
        ...rations.filter(r => r.organization_id !== user.id && r.status === ResourceStatus.Available).map(r => ({...r, type: 'rations' as ResourceType})),
        ...articles.filter(a => a.organization_id !== user.id && a.status === ResourceStatus.Available).map(a => ({...a, type: 'articles' as ResourceType})),
    ];
    
    const orgMap = new Map(organizations.map(org => [org.id, org]));
    const uniqueStatesSet = new Set<string>();

    // FIX: Use flatMap to create a correctly typed array of donations with their organization info.
    // This avoids items with undefined organizations and resolves type errors when accessing organization properties.
    const donationsWithOrg = donations.flatMap((resource): DonationItem[] => {
        const organization = orgMap.get(resource.organization_id);
        if (organization) {
            uniqueStatesSet.add(organization.state);
            return [{ resource, organization }];
        }
        return [];
    });

    const filtered = donationsWithOrg.filter(item => {
        const { resource, organization } = item;
        const itemName = 'name' in resource ? resource.name : resource.brand;
        
        // Search filter
        const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Category filter
        const matchesCategory = !categoryFilter ||
            (resource.type === categoryFilter) ||
            (resource.type === 'articles' && (resource as Article).category === categoryFilter);
            
        // State filter
        const matchesState = !stateFilter || organization.state === stateFilter;
        
        // Urgency filter
        // FIX: Check for the existence of `expiration_date` before calling `isUrgent` because `Article` resources do not have this property.
        const matchesUrgent = !urgentFilter || ('expiration_date' in resource && isUrgent(resource.expiration_date));

        return matchesSearch && matchesCategory && matchesState && matchesUrgent;
    });

    return { 
        filteredDonations: filtered, 
        uniqueStates: Array.from(uniqueStatesSet).sort() 
    };

  }, [user, medicines, rations, articles, organizations, searchQuery, categoryFilter, stateFilter, urgentFilter]);


  if (loading) return <Spinner />;

  return (
    <div>
      <div className="bg-primary/10 rounded-lg p-8 mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Mural de Doações</h1>
        <p className="text-lg text-gray-600 mt-2">
          Encontre itens essenciais doados por outras ONGs e solicite o que você precisa.
        </p>
      </div>

      <ErrorAlert 
        error={error} 
        onClose={clearError} 
      />

      {/* --- Filter Bar --- */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar por nome</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
                type="text" 
                id="search" 
                placeholder="Ex: Ração Golden, Vermífugo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
            <select id="category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">Todas</option>
                <option value="medicines">Medicamentos</option>
                <option value="rations">Ração</option>
                {Object.values(ArticleCategory).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
            </select>
        </div>
         <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
            <select id="state" value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">Todos</option>
                {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
        </div>
        <div className="flex items-center justify-start md:col-span-2 lg:col-span-4">
            <input 
                type="checkbox" 
                id="urgent" 
                checked={urgentFilter} 
                onChange={e => setUrgentFilter(e.target.checked)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="urgent" className="ml-2 block text-sm font-medium text-gray-700">Apenas com validade próxima (90 dias)</label>
        </div>
      </div>

      {/* --- Donations Grid --- */}
      {filteredDonations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map(item => (
                <ResourceCard key={`${item.resource.type}-${item.resource.id}`} item={item} />
            ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700">Nenhum item encontrado</h3>
            <p className="text-gray-500 mt-2">Tente ajustar os filtros ou verifique novamente mais tarde.</p>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;