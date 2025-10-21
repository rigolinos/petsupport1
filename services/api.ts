import {
  Organization, Medicine, Ration, Article, ResourceRequest,
  OrganizationStatus, ResourceStatus, ApplicationStatus, ArticleCategory, ArticleCondition,
  ResourceType, Resource
} from '../types';
import { supabase } from './supabaseClient';

// --- SUPABASE API FUNCTIONS ---

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

export const login = async (email: string, password: string): Promise<Organization | null> => {
  try {
    // Fazer login no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return null;
    }

    if (!authData.user) {
      return null;
    }

    // Buscar dados da organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_user_id', authData.user.id)
      .single();

    if (orgError || !organization) {
      console.error('Organization error:', orgError);
      return null;
    }

    return {
      ...organization,
      type: 'organization' as const
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getAuthenticatedUser = async (): Promise<Organization | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    if (orgError || !organization) {
      return null;
    }

    return {
      ...organization,
      type: 'organization' as const
    };
  } catch (error) {
    console.error('Get authenticated user error:', error);
    return null;
  }
};

export const registerNgo = async (
  ngoData: Omit<Organization, 'id' | 'created_at' | 'type' | 'status' | 'password' | 'owner_user_id'>, 
  password: string
): Promise<Organization> => {
  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ngoData.contact_email,
      password,
      options: {
        data: {
          role: 'organization'
        }
      }
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Erro ao criar usuário');
    }

    // Criar organização no banco
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        ...ngoData,
        owner_user_id: authData.user.id,
        status: OrganizationStatus.Pending,
        type: 'organization'
      })
      .select()
      .single();

    if (orgError) {
      // Se falhou ao criar organização, deletar o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(orgError.message);
    }

    return {
      ...organization,
      type: 'organization' as const
    };
  } catch (error) {
    console.error('Register NGO error:', error);
    throw error;
  }
};

// =============================================
// ORGANIZATION FUNCTIONS
// =============================================

export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get organizations error:', error);
      return [];
    }

    return data.map(org => ({
      ...org,
      type: 'organization' as const
    }));
  } catch (error) {
    console.error('Get organizations error:', error);
    return [];
  }
};

export const getOrganizationById = async (id: string): Promise<Organization | undefined> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      ...data,
      type: 'organization' as const
    };
  } catch (error) {
    console.error('Get organization by ID error:', error);
    return undefined;
  }
};

// =============================================
// RESOURCE FUNCTIONS
// =============================================

export const getMedicines = async (): Promise<Medicine[]> => {
  try {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get medicines error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get medicines error:', error);
    return [];
  }
};

export const getRations = async (): Promise<Ration[]> => {
  try {
    const { data, error } = await supabase
      .from('rations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get rations error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get rations error:', error);
    return [];
  }
};

export const getArticles = async (): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get articles error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get articles error:', error);
    return [];
  }
};

// Generic resource fetcher
export const getById = async (key: ResourceType, id: string): Promise<Resource | undefined> => {
  try {
    const { data, error } = await supabase
      .from(key)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return data as Resource;
  } catch (error) {
    console.error('Get resource by ID error:', error);
    return undefined;
  }
};

export const add = async (key: ResourceType, item: Omit<Resource, 'id' | 'created_at'>): Promise<Resource> => {
  try {
    const { data, error } = await supabase
      .from(key)
      .insert(item)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Resource;
  } catch (error) {
    console.error('Add resource error:', error);
    throw error;
  }
};

export const update = async (key: ResourceType, updatedItem: Resource): Promise<Resource> => {
  try {
    const { data, error } = await supabase
      .from(key)
      .update(updatedItem)
      .eq('id', updatedItem.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Resource;
  } catch (error) {
    console.error('Update resource error:', error);
    throw error;
  }
};

// =============================================
// RESOURCE REQUEST FUNCTIONS
// =============================================

export const getResourceRequests = async (): Promise<ResourceRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('resource_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get resource requests error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get resource requests error:', error);
    return [];
  }
};

export const createResourceRequest = async (
  reqData: Omit<ResourceRequest, 'id' | 'created_at' | 'status'>
): Promise<ResourceRequest> => {
  try {
    const { data, error } = await supabase
      .from('resource_requests')
      .insert({
        ...reqData,
        status: ApplicationStatus.Pending
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Create resource request error:', error);
    throw error;
  }
};

export const getResourceRequestsForNgo = async (ngoId: string): Promise<ResourceRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('resource_requests')
      .select('*')
      .eq('donating_organization_id', ngoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get resource requests for NGO error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get resource requests for NGO error:', error);
    return [];
  }
};

export const updateResourceRequestStatus = async (
  reqId: string, 
  status: ApplicationStatus
): Promise<ResourceRequest> => {
  try {
    const { data, error } = await supabase
      .from('resource_requests')
      .update({ status })
      .eq('id', reqId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Update resource request status error:', error);
    throw error;
  }
};

// =============================================
// MESSAGE FUNCTIONS
// =============================================

export const getMessages = async (organizationId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_organization:organizations!sender_organization_id(name),
        recipient_organization:organizations!recipient_organization_id(name)
      `)
      .or(`sender_organization_id.eq.${organizationId},recipient_organization_id.eq.${organizationId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get messages error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get messages error:', error);
    return [];
  }
};

export const sendMessage = async (messageData: {
  sender_organization_id: string;
  recipient_organization_id: string;
  subject: string;
  content: string;
  resource_request_id?: string;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};

// =============================================
// NOTIFICATION FUNCTIONS
// =============================================

export const getNotifications = async (organizationId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get notifications error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
};

// =============================================
// STATISTICS FUNCTIONS
// =============================================

export const getOrganizationStats = async (organizationId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .rpc('get_organization_stats', { p_organization_id: organizationId });

    if (error) {
      console.error('Get organization stats error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get organization stats error:', error);
    return null;
  }
};

// =============================================
// SEARCH FUNCTIONS
// =============================================

export const searchResources = async (filters: {
  search_query?: string;
  resource_type?: ResourceType;
  category?: ArticleCategory;
  state?: string;
  urgent_only?: boolean;
  organization_id?: string;
}): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('search_resources', {
        p_search_query: filters.search_query || null,
        p_resource_type: filters.resource_type || null,
        p_category: filters.category || null,
        p_state: filters.state || null,
        p_urgent_only: filters.urgent_only || false,
        p_organization_id: filters.organization_id || null
      });

    if (error) {
      console.error('Search resources error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Search resources error:', error);
    return [];
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const canRequestResource = async (
  requestingOrganizationId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('can_request_resource', {
        p_requesting_organization_id: requestingOrganizationId,
        p_resource_type: resourceType,
        p_resource_id: resourceId
      });

    if (error) {
      console.error('Can request resource error:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Can request resource error:', error);
    return false;
  }
};