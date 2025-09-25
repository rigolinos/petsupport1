import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Resource, ResourceType, Organization } from '../types';
import Spinner from '../components/Spinner';
import { Pill, Bone, Shirt, Edit, Trash2, Send, ChevronLeft } from 'lucide-react';

const ResourceDetailPage: React.FC = () => {
    const { type, id } = useParams<{ type: ResourceType; id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getResourceByIdAndType, getOrganizationById, createResourceRequest, organizations } = useData();

    const [resource, setResource] = useState<Resource | null>(null);
    const [donatingOrg, setDonatingOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id || !type) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const resourceData = await getResourceByIdAndType(id, type);
                if (resourceData) {
                    setResource(resourceData);
                    const orgData = await getOrganizationById(resourceData.organization_id);
                    if (orgData) {
                        setDonatingOrg(orgData);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch resource details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, type, getResourceByIdAndType, getOrganizationById]);
    
    const handleRequestResource = async () => {
        if (!user || !resource || !type) return;
        
        if (window.confirm(`Você confirma a solicitação de ${'name' in resource ? resource.name : resource.brand} da ONG ${donatingOrg?.name}?`)) {
            await createResourceRequest({
                resource_id: resource.id,
                resource_type: type,
                donating_organization_id: resource.organization_id,
                requesting_organization_id: user.id,
            });
            alert('Pedido de doação enviado com sucesso!');
            navigate('/doacoes');
        }
    }
    
    const isOwner = user?.id === resource?.organization_id;

    if (loading) return <Spinner />;
    if (!resource) return <div className="text-center text-gray-500">Recurso não encontrado.</div>;
    
    const getStatusChip = (status: string) => {
        const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'Available': return `${baseClasses} bg-green-100 text-green-800`;
            case 'Requested': return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'Donated': return `${baseClasses} bg-gray-200 text-gray-700`;
            default: return `${baseClasses} bg-gray-100 text-gray-600`;
        }
    };
    
    const renderPlaceholderIcon = () => {
        const iconProps = { size: 96, className: 'text-gray-400' };
        switch(type) {
            case 'medicines': return <Pill {...iconProps} />;
            case 'rations': return <Bone {...iconProps} />;
            case 'articles': return <Shirt {...iconProps} />;
            default: return null;
        }
    }
    
    const renderDetails = () => {
        const commonDetails = (
             <>
                <dt>Status</dt><dd><span className={getStatusChip(resource.status)}>{resource.status}</span></dd>
                <dt>ONG Doadora</dt><dd>{donatingOrg?.name || 'Desconhecida'} ({donatingOrg?.city}, {donatingOrg?.state})</dd>
                {'quantity' in resource && <><dt>Quantidade</dt><dd>{'quantity_kg' in resource ? `${resource.quantity_kg} kg` : resource.quantity}</dd></>}
             </>
        );

        switch(type) {
            case 'medicines':
                const med = resource as import('../types').Medicine;
                return (<>
                    {commonDetails}
                    <dt>Princípio Ativo</dt><dd>{med.active_ingredient}</dd>
                    <dt>Validade</dt><dd>{new Date(med.expiration_date).toLocaleDateString()}</dd>
                    {med.observations && <><dt>Observações</dt><dd>{med.observations}</dd></>}
                </>);
            case 'rations':
                 const ration = resource as import('../types').Ration;
                return (<>
                    {commonDetails}
                    <dt>Validade</dt><dd>{new Date(ration.expiration_date).toLocaleDateString()}</dd>
                    {ration.observations && <><dt>Observações</dt><dd>{ration.observations}</dd></>}
                </>);
            case 'articles':
                 const article = resource as import('../types').Article;
                return (<>
                    {commonDetails}
                    <dt>Categoria</dt><dd>{article.category}</dd>
                    <dt>Condição</dt><dd>{article.condition}</dd>
                    {article.size_specification && <><dt>Tamanho/Espec.</dt><dd>{article.size_specification}</dd></>}
                    {article.observations && <><dt>Observações</dt><dd>{article.observations}</dd></>}
                </>);
            default: return null;
        }
    }

    return (
        <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-6">
                <ChevronLeft size={16} /> Voltar
            </button>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        {resource.photo_base64 ? (
                            <img src={resource.photo_base64} alt={'name' in resource ? resource.name : resource.brand} className="w-full h-auto object-cover rounded-lg shadow-md" />
                        ) : (
                            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                {renderPlaceholderIcon()}
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-bold text-gray-800">{'name' in resource ? resource.name : resource.brand}</h1>
                        <dl className="mt-4 grid grid-cols-[max-content,1fr] gap-x-4 gap-y-2 text-sm text-gray-700">
                           {renderDetails()}
                        </dl>
                        <div className="mt-8 pt-6 border-t flex flex-wrap gap-4">
                            {isOwner ? (
                                <>
                                    <Link to={`/painel-ong/recursos/editar/${type}/${id}`} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-semibold">
                                        <Edit size={16} /> Editar
                                    </Link>
                                    <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 font-semibold">
                                        <Trash2 size={16} /> Excluir
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleRequestResource} className="flex items-center gap-2 bg-secondary text-white px-6 py-2 rounded-md hover:bg-green-600 font-semibold text-lg">
                                    <Send size={18} /> Solicitar Doação
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailPage;
