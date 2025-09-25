export enum OrganizationStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Rejected = 'Rejected',
}

export enum ResourceStatus {
  Available = 'Available',
  Requested = 'Requested',
  Donated = 'Donated',
}

export enum ApplicationStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum ArticleCondition {
  New = 'New',
  Used = 'Used',
}

export enum ArticleCategory {
  Accessories = 'Acessórios e Abrigo',
  Hygiene = 'Higiene e Limpeza',
  Others = 'Outros',
}


export interface Organization {
  id: string;
  created_at: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  contact_email: string;
  contact_phone: string;
  password: string; // Added for authentication
  status: OrganizationStatus;
  owner_user_id: string; 
  type: 'organization';
}

interface BaseResource {
  id: string;
  created_at: string;
  organization_id: string;
  status: ResourceStatus;
  photo_base64?: string; // Optional photo for all items
}


export interface Medicine extends BaseResource {
  name: string;
  active_ingredient: string;
  quantity: string;
  expiration_date: string;
  observations?: string;
}

export interface Ration extends BaseResource {
  brand: string;
  quantity_kg: number;
  expiration_date: string;
  observations?: string;
}

export interface Article extends BaseResource {
  name: string;
  category: ArticleCategory;
  quantity: number;
  condition: ArticleCondition;
  size_specification?: string;
  observations?: string;
}

export type Resource = Medicine | Ration | Article;
export type ResourceType = 'medicines' | 'rations' | 'articles';

export interface ResourceRequest {
  id: string;
  created_at: string;
  resource_id: string;
  resource_type: ResourceType;
  donating_organization_id: string;
  requesting_organization_id: string;
  status: ApplicationStatus;
}