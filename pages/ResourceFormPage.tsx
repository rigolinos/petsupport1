import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
// FIX: Import specific resource types (Medicine, Ration, Article) for type casting.
import { Resource, ResourceType, ResourceStatus, ArticleCondition, ArticleCategory, Medicine, Ration, Article } from '../types';
import Spinner from '../components/Spinner';

const ResourceFormPage: React.FC = () => {
  const { type, id } = useParams<{ type?: ResourceType, id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getResourceByIdAndType, addResource, updateResource } = useData();
  const { user } = useAuth();
  
  const [resourceType, setResourceType] = useState<ResourceType | ''>(type || '');
  const [formData, setFormData] = useState<Partial<Resource>>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isEditing = !!id;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const typeFromQuery = searchParams.get('type') as ResourceType;
    if (typeFromQuery && !isEditing) {
        setResourceType(typeFromQuery);
    } else if (type) {
        setResourceType(type);
    }
  }, [location.search, isEditing, type]);

  useEffect(() => {
    if (id && resourceType) {
      setLoading(true);
      getResourceByIdAndType(id, resourceType).then(data => {
        if (data) {
          setFormData(data);
          if (data.photo_base64) {
            setImagePreview(data.photo_base64);
          }
        }
        setLoading(false);
      });
    }
  }, [id, resourceType, getResourceByIdAndType]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, photo_base64: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ResourceType;
    setResourceType(newType);
    setFormData({});
    setImagePreview(null);
    if(!isEditing) {
        navigate(`/painel-ong/recursos/novo?type=${newType}`);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resourceType) return;

    // Ensure numeric fields are numbers
    const finalData = { ...formData, organization_id: user.id };
    if ('quantity_kg' in finalData) finalData.quantity_kg = Number(finalData.quantity_kg);
    if ('quantity' in finalData && resourceType === 'articles') finalData.quantity = Number(finalData.quantity);


    if (isEditing) {
      await updateResource(finalData as Resource, resourceType);
    } else {
      await addResource({ ...finalData, status: ResourceStatus.Available } as Omit<Resource, 'id'|'created_at'>, resourceType);
    }
    navigate('/painel-ong');
  };

  if (loading) return <Spinner />;

  const renderFieldsForType = () => {
    const commonFields = (
        <div className="col-span-1 md:col-span-2">
             <label className="block text-sm font-medium text-gray-700">Foto do Item (Opcional)</label>
             <div className="mt-1 flex items-center">
                {imagePreview && <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md mr-4"/>}
                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"/>
             </div>
        </div>
    );
    
    switch (resourceType) {
        // FIX: Cast formData to a specific resource type within each case to ensure type safety when accessing fields.
        case 'medicines': {
            const medicineData = formData as Partial<Medicine>;
            return (
            <>
                <input name="name" placeholder="Nome do Medicamento" value={medicineData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <input name="active_ingredient" placeholder="Princípio Ativo" value={medicineData.active_ingredient || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <input name="quantity" placeholder="Quantidade (ex: 10 caixas)" value={medicineData.quantity || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <div><label className="text-sm text-gray-500">Data de Validade</label><input name="expiration_date" type="date" value={medicineData.expiration_date || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/></div>
                <textarea name="observations" placeholder="Observações (ex: manter refrigerado)" value={formData.observations || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                {commonFields}
            </>
        )};
        case 'rations': {
            const rationData = formData as Partial<Ration>;
            return (
            <>
                <input name="brand" placeholder="Marca da Ração" value={rationData.brand || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <input name="quantity_kg" type="number" placeholder="Quantidade (kg)" value={rationData.quantity_kg || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <div><label className="text-sm text-gray-500">Data de Validade</label><input name="expiration_date" type="date" value={rationData.expiration_date || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/></div>
                <textarea name="observations" placeholder="Observações (ex: para filhotes, raças pequenas)" value={formData.observations || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                {commonFields}
            </>
        )};
        case 'articles': {
            const articleData = formData as Partial<Article>;
            return (
            <>
                <input name="name" placeholder="Nome do Artigo (ex: Coleira)" value={articleData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <select name="category" value={articleData.category || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900">
                    <option value="">Selecione a Categoria</option>
                    {Object.values(ArticleCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input name="quantity" type="number" placeholder="Quantidade" value={articleData.quantity || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <select name="condition" value={articleData.condition || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900">
                    <option value="">Selecione a Condição</option>
                    {Object.values(ArticleCondition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input name="size_specification" placeholder="Tamanho/Especificação (ex: Tamanho G)" value={articleData.size_specification || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                <textarea name="observations" placeholder="Observações/Descrição" value={formData.observations || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900"/>
                {commonFields}
            </>
        )};
        default: return <p className="text-center text-gray-500">Selecione um tipo de item para começar.</p>
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Item' : 'Adicionar Novo Item'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Item</label>
            <select value={resourceType} onChange={handleTypeChange} disabled={isEditing} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white text-gray-900 disabled:bg-gray-100">
                <option value="">Selecione...</option>
                <option value="medicines">Medicamento</option>
                <option value="rations">Ração</option>
                <option value="articles">Artigo</option>
            </select>
        </div>
        
        {resourceType && renderFieldsForType()}

        {resourceType && 
            <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => navigate('/painel-ong')} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600">Salvar</button>
            </div>
        }
      </form>
    </div>
  );
};

export default ResourceFormPage;