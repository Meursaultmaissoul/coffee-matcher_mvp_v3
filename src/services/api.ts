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

  private async request<T>(payload: any): Promise<ApiResponse<T>> {
    // Use form-encoded data instead of JSON to avoid CORS issues with Google Apps Script
    const formData = new URLSearchParams();
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const text = await response.text();
    
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

  async register(user: Partial<User>): Promise<ApiResponse> {
    return this.request({
      action: 'register',
      ...user,
    });
  }

  async yap(request: YapRequest): Promise<ApiResponse> {
    return this.request({
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
    return this.request({
      action: 'getCounts',
      ...filters,
    });
  }

  async getOpenUsers(category: string): Promise<ApiResponse> {
    return this.request({
      action: 'getOpenUsers',
      category,
    });
  }

  async getStats(params: {
    email: string;
    month: string;
    category: string;
  }): Promise<ApiResponse> {
    return this.request({
      action: 'stats',
      ...params,
    });
  }
}

export const apiService = new ApiService();
export type { User, YapRequest, CountsResponse, ApiResponse };