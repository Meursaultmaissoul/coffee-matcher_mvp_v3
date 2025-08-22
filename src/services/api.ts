interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
  version?: string;
}

interface User {
  email: string;
  name: string;
  age: number | null;
  gender: string;
  category: string;
  open: boolean;
  sameSex: boolean;
}

interface YapRequest {
  email: string;
  name: string;
  category: string;
  open: boolean;
  minAge: number;
  maxAge: number;
  sameSex: boolean;
  userGender: string;
  groupMin: number;
  groupMax: number;
}

interface CountsResponse {
  coffee: number;
  lunch: number;
  zanpan: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // TODO: Replace YOUR_SCRIPT_ID with your actual Google Apps Script deployment ID
    // Get this from: Extensions → Apps Script → Deploy → Manage deployments → Copy URL
    this.baseUrl = 'https://script.google.com/macros/s/AKfycbypx_biZEjw222Szshr5CwoKmvwZvTkYep4Ha2yzi8bQf_P3XtWBJeTbdcm7gQyHSJt/exec';
  }

  private async makeRequest<T>(payload: any): Promise<ApiResponse<T>> {
    // Use form-encoded data instead of JSON to avoid CORS issues with Google Apps Script
    const formData = new URLSearchParams();
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    console.log('Making request to Google Apps Script:', payload);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const text = await response.text();
    console.log('Response from Google Apps Script:', text);
    
    try {
      return JSON.parse(text);
    } catch (error) {
      return {
        ok: response.ok,
        message: text,
        error: response.ok ? undefined : text,
      };
    }
  }

  // Public method for debugging and alternative API calls
  async request<T>(payload: any): Promise<ApiResponse<T>> {
    return this.makeRequest(payload);
  }

  async register(user: Partial<User>): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'register',
      ...user,
    });
  }

  async yap(request: YapRequest): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'yap',
      ...request,
    });
  }

  async getCounts(filters: {
    excludeEmail?: string;
    minAge?: number;
    maxAge?: number;
    userGender?: string;
    sameSex?: boolean;
  }): Promise<ApiResponse<CountsResponse>> {
    return this.makeRequest({
      action: 'openCounts',
      ...filters,
    });
  }

  async autoMatch(request: {
    email: string;
    name: string;
    category: string;
    minAge: number;
    maxAge: number;
    sameSex: boolean;
    userGender: string;
    groupMin: number;
    groupMax: number;
  }): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'autoMatch',
      ...request,
    });
  }

  async getAcceptanceHistory(email: string): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'getAcceptanceHistory',
      email,
    });
  }

  async getOpenUsers(category: string): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'getOpenUsers',
      category,
    });
  }

  async getStats(params: {
    email: string;
    month: string;
    category: string;
  }): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'stats',
      ...params,
    });
  }
}

export const apiService = new ApiService();
export type { User, YapRequest, CountsResponse, ApiResponse };