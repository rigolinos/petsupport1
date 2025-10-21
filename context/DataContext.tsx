

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
  getOrganizationById: (id: string) => Promise<Organization | undefined>;
  addResource: (resourceData: Omit<Resource, 'id' | 'created_at'>, type: ResourceType) => Promise<Resource>;
  updateResource: (resourceData: Resource, type: ResourceType) => Promise<Resource>;
  getResourceByIdAndType: (type: ResourceType, id: string) => Promise<Resource | undefined>;

  createResourceRequest: (reqData: Omit<ResourceRequest, 'id'|'created_at'|'status'>) => Promise<ResourceRequest>;
  getResourceRequestsForNgo: (ngoId: string) => Promise<ResourceRequest[]>;
  updateResourceRequestStatus: (reqId: string, status: ResourceRequest['status']) => Promise<ResourceRequest>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [rations, setRations] = useState<Ration[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
      setLoading(true);
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
      setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch data when the component mounts or when a user logs in
    if(user) {
        fetchData();
    } else {
        // Clear data if user logs out
        setOrganizations([]);
        setMedicines([]);
        setRations([]);
        setArticles([]);
        setResourceRequests([]);
        setLoading(false);
    }
  }, [user, fetchData]);

  const addResource = async (resourceData: Omit<Resource, 'id' | 'created_at'>, type: ResourceType) => {
    const newResource = await api.add(type, resourceData);
    await fetchData(); // Refresh all data
    return newResource;
  };
  
  const updateResource = async (resourceData: Resource, type: ResourceType) => {
    const updatedResource = await api.update(type, resourceData);
    await fetchData(); // Refresh all data
    return updatedResource;
  };

  const createResourceRequest = async (reqData: Omit<ResourceRequest, 'id'|'created_at'|'status'>) => {
    const newRequest = await api.createResourceRequest(reqData);
    await fetchData(); // Refresh all data
    return newRequest;
  }

  const updateResourceRequestStatus = async (reqId: string, status: ApplicationStatus) => {
      const updatedRequest = await api.updateResourceRequestStatus(reqId, status);
      
      if (status === ApplicationStatus.Approved) {
        const resource = await api.getById(updatedRequest.resource_type, updatedRequest.resource_id) as Resource;
        if (resource) {
          resource.status = ResourceStatus.Donated;
          await updateResource(resource, updatedRequest.resource_type);
        }
      }
      await fetchData(); // Refresh all data
      return updatedRequest;
  }

  const value = {
    organizations,
    medicines,
    rations,
    articles,
    resourceRequests,
    loading,
    getOrganizationById: api.getOrganizationById,
    addResource,
    updateResource,
    getResourceByIdAndType: api.getById,
    createResourceRequest,
    getResourceRequestsForNgo: api.getResourceRequestsForNgo,
    updateResourceRequestStatus,
    refreshData: fetchData,
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