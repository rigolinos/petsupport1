import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Organization, Medicine, Ration, Article, ResourceRequest, ResourceStatus, ApplicationStatus, Resource, ResourceType } from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  organizations: Organization[];
  medicines: Medicine[];
  rations: Ration[];
  articles: Article[];
  resourceRequests: ResourceRequest[];
  loading: boolean;
  error: string | null;
  getOrganizationById: (id: string) => Promise<Organization | undefined>;
  addResource: (resourceData: Omit<Resource, 'id' | 'created_at'>, type: ResourceType) => Promise<Resource>;
  updateResource: (resourceData: Resource, type: ResourceType) => Promise<Resource>;
  getResourceByIdAndType: (type: ResourceType, id: string) => Promise<Resource | undefined>;
  createResourceRequest: (reqData: Omit<ResourceRequest, 'id'|'created_at'|'status'>) => Promise<ResourceRequest>;
  getResourceRequestsForNgo: (ngoId: string) => Promise<ResourceRequest[]>;
  updateResourceRequestStatus: (reqId: string, status: ApplicationStatus) => Promise<ResourceRequest>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [rations, setRations] = useState<Ration[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [orgsData, medsData, rationsData, articlesData, resReqsData] = await Promise.all([
        api.getOrganizations(),
        api.getMedicines(),
        api.getRations(),
        api.getArticles(),
        api.getResourceRequests(),
      ]);
      
      setOrganizations(orgsData);
      setMedicines(medsData);
      setRations(rationsData);
      setArticles(articlesData);
      setResourceRequests(resReqsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      // Clear data if user logs out
      setOrganizations([]);
      setMedicines([]);
      setRations([]);
      setArticles([]);
      setResourceRequests([]);
      setError(null);
      setLoading(false);
    }
  }, [user, fetchData]);

  const addResource = async (resourceData: Omit<Resource, 'id' | 'created_at'>, type: ResourceType) => {
    try {
      setError(null);
      const newResource = await api.add(type, resourceData);
      await fetchData(); // Refresh all data
      return newResource;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar recurso';
      setError(errorMessage);
      throw err;
    }
  };
  
  const updateResource = async (resourceData: Resource, type: ResourceType) => {
    try {
      setError(null);
      const updatedResource = await api.update(type, resourceData);
      await fetchData(); // Refresh all data
      return updatedResource;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar recurso';
      setError(errorMessage);
      throw err;
    }
  };

  const createResourceRequest = async (reqData: Omit<ResourceRequest, 'id'|'created_at'|'status'>) => {
    try {
      setError(null);
      const newRequest = await api.createResourceRequest(reqData);
      await fetchData(); // Refresh all data
      return newRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar solicitação';
      setError(errorMessage);
      throw err;
    }
  };

  const updateResourceRequestStatus = async (reqId: string, status: ApplicationStatus) => {
    try {
      setError(null);
      const updatedRequest = await api.updateResourceRequestStatus(reqId, status);
      
      // The trigger in the database will handle updating the resource status
      // No need to manually update it here
      
      await fetchData(); // Refresh all data
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status da solicitação';
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    organizations,
    medicines,
    rations,
    articles,
    resourceRequests,
    loading,
    error,
    getOrganizationById: api.getOrganizationById,
    addResource,
    updateResource,
    getResourceByIdAndType: api.getById,
    createResourceRequest,
    getResourceRequestsForNgo: api.getResourceRequestsForNgo,
    updateResourceRequestStatus,
    refreshData: fetchData,
    clearError,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};