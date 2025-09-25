import {
  Organization, Medicine, Ration, Article, ResourceRequest,
  OrganizationStatus, ResourceStatus, ApplicationStatus, ArticleCategory, ArticleCondition,
  ResourceType, Resource
} from '../types';

// --- MOCK DATABASE ---

let organizations: Organization[] = [
  { id: 'org1', created_at: new Date().toISOString(), name: 'Cão Sem Fome', cnpj: '11.111.111/0001-11', city: 'São Paulo', state: 'SP', contact_email: 'caosemfome@test.com', contact_phone: '11999999999', status: OrganizationStatus.Verified, owner_user_id: 'user1', type: 'organization', password: 'password123' },
  { id: 'org2', created_at: new Date().toISOString(), name: 'Patas Unidas', cnpj: '22.222.222/0001-22', city: 'Rio de Janeiro', state: 'RJ', contact_email: 'patasunidas@test.com', contact_phone: '21999999999', status: OrganizationStatus.Verified, owner_user_id: 'user2', type: 'organization', password: 'password123' },
  { id: 'org3', created_at: new Date().toISOString(), name: 'Focinhos Carentes', cnpj: '33.333.333/0001-33', city: 'Belo Horizonte', state: 'MG', contact_email: 'focinhos@test.com', contact_phone: '31999999999', status: OrganizationStatus.Pending, owner_user_id: 'user3', type: 'organization', password: 'password123' },
];

let medicines: Medicine[] = [
  { id: 'med1', created_at: new Date().toISOString(), organization_id: 'org2', status: ResourceStatus.Available, name: 'Vermífugo Drontal', active_ingredient: 'Praziquantel', quantity: '2 caixas', expiration_date: '2025-12-31' },
];

let rations: Ration[] = [
  { id: 'rat1', created_at: new Date().toISOString(), organization_id: 'org2', status: ResourceStatus.Available, brand: 'Golden Power Training', quantity_kg: 15, expiration_date: '2025-08-01' },
];

let articles: Article[] = [
  { id: 'art1', created_at: new Date().toISOString(), organization_id: 'org1', status: ResourceStatus.Available, name: 'Coleira Anti-pulgas', category: ArticleCategory.Accessories, quantity: 5, condition: ArticleCondition.New, size_specification: 'Tamanho M' },
];

let resourceRequests: ResourceRequest[] = [
    { id: 'req1', created_at: new Date().toISOString(), resource_id: 'art1', resource_type: 'articles', donating_organization_id: 'org1', requesting_organization_id: 'org2', status: ApplicationStatus.Pending }
];

const db = {
    organizations,
    medicines,
    rations,
    articles,
    resource_requests: resourceRequests
};

const simulateDelay = (ms: number = 500) => new Promise(res => setTimeout(res, ms));

const AUTH_USER_KEY = 'petconnect_auth_user';

// --- API FUNCTIONS ---

// Auth
export const login = async (email: string, password: string): Promise<Organization | null> => {
    await simulateDelay();
    const org = db.organizations.find(o => o.contact_email === email && o.password === password);
    if (org) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(org));
        return { ...org, type: 'organization' };
    }
    return null;
}

export const logout = async () => {
    await simulateDelay(200);
    localStorage.removeItem(AUTH_USER_KEY);
};

export const getAuthenticatedUser = async (): Promise<Organization | null> => {
    await simulateDelay(100);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
        const user = JSON.parse(storedUser) as Organization;
        // Re-fetch from "DB" to ensure data is fresh
        const freshUser = db.organizations.find(o => o.id === user.id);
        return freshUser ? { ...freshUser, type: 'organization' } : null;
    }
    return null;
};

export const registerNgo = async (ngoData: Omit<Organization, 'id' | 'created_at' | 'type' | 'status' | 'password' | 'owner_user_id'>, password: string): Promise<Organization> => {
    await simulateDelay();
    if (db.organizations.some(o => o.contact_email === ngoData.contact_email)) {
        throw new Error("Email already registered.");
    }
    const newNgo: Organization = {
        id: `org${db.organizations.length + 1}`,
        owner_user_id: `user${db.organizations.length + 1}`,
        created_at: new Date().toISOString(),
        ...ngoData,
        password,
        status: OrganizationStatus.Pending,
        type: 'organization'
    };
    db.organizations.push(newNgo);
    // Do not log in automatically, user should see pending page.
    return newNgo;
}

// Organizations
export const getOrganizations = async (): Promise<Organization[]> => {
    await simulateDelay();
    return [...db.organizations];
};
export const getOrganizationById = async (id: string): Promise<Organization | undefined> => {
    await simulateDelay();
    return db.organizations.find(o => o.id === id);
};

// Resources
export const getMedicines = async (): Promise<Medicine[]> => {
    await simulateDelay();
    return [...db.medicines];
};
export const getRations = async (): Promise<Ration[]> => {
    await simulateDelay();
    return [...db.rations];
};
export const getArticles = async (): Promise<Article[]> => {
    await simulateDelay();
    return [...db.articles];
};

// Generic resource fetcher
export const getById = async (key: ResourceType, id: string): Promise<Resource | undefined> => {
    await simulateDelay();
    return (db[key] as Resource[]).find(item => item.id === id);
};

export const add = async (key: ResourceType, item: Omit<Resource, 'id'|'created_at'>): Promise<Resource> => {
    await simulateDelay();
    const newItem = {
        ...item,
        id: `${key.slice(0,3)}${Date.now()}`,
        created_at: new Date().toISOString(),
    } as Resource;
    (db[key] as Resource[]).push(newItem);
    return newItem;
};

export const update = async (key: ResourceType, updatedItem: Resource): Promise<Resource> => {
    await simulateDelay();
    const collection = db[key] as Resource[];
    const index = collection.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
        collection[index] = { ...collection[index], ...updatedItem };
        return collection[index];
    }
    throw new Error("Item not found for update.");
};


// Resource Requests
export const getResourceRequests = async (): Promise<ResourceRequest[]> => {
    await simulateDelay();
    return [...db.resource_requests];
}
export const createResourceRequest = async (reqData: Omit<ResourceRequest, 'id'|'created_at'|'status'>): Promise<ResourceRequest> => {
    await simulateDelay();
    const newReq: ResourceRequest = { 
        ...reqData, 
        id: `req${Date.now()}`,
        created_at: new Date().toISOString(),
        status: ApplicationStatus.Pending 
    };
    db.resource_requests.push(newReq);
    return newReq;
}
export const getResourceRequestsForNgo = async (ngoId: string): Promise<ResourceRequest[]> => {
    await simulateDelay();
    return db.resource_requests.filter(req => req.donating_organization_id === ngoId);
}
export const updateResourceRequestStatus = async (reqId: string, status: ApplicationStatus): Promise<ResourceRequest> => {
    await simulateDelay();
    const request = db.resource_requests.find(req => req.id === reqId);
    if (request) {
        request.status = status;
        
        if (status === ApplicationStatus.Approved) {
            const resource = (db[request.resource_type] as Resource[]).find(r => r.id === request.resource_id);
            if(resource) {
                resource.status = ResourceStatus.Donated;
            }
        }
        return { ...request };
    }
    throw new Error("Request not found.");
}