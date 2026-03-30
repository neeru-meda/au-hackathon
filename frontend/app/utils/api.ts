import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  }
};

export const studentAPI = {
  getAll: async () => {
    const response = await api.get('/students');
    return response.data;
  },
  getByRollNo: async (rollNo: string) => {
    const response = await api.get(`/students/${rollNo}`);
    return response.data;
  }
};

export const attendanceAPI = {
  submit: async (data: any) => {
    const response = await api.post('/attendance', data);
    return response.data;
  }
};

export const alertAPI = {
  getAll: async () => {
    const response = await api.get('/alerts');
    return response.data;
  },
  send: async (alertId: string) => {
    const response = await api.post('/alerts/send', { alert_id: alertId });
    return response.data;
  }
};

export const letterAPI = {
  generate: async (rollNo: string, documentType: string) => {
    const response = await api.post('/letters/generate', { rollNo, documentType });
    return response.data;
  },
  generateFull: async (rollNo: string, docType: string, requestId?: string) => {
    const response = await api.post('/letters/generate-full', { rollNo, docType, requestId });
    return response.data;
  },
  createRequest: async (rollNo: string, docType: string) => {
    const response = await api.post('/letters/request', { rollNo, docType });
    return response.data;
  },
  getRequests: async () => {
    const response = await api.get('/letters/requests');
    return response.data;
  },
  updateRequest: async (requestId: string, data: any) => {
    const response = await api.put(`/letters/requests/${requestId}`, data);
    return response.data;
  },
  verify: async (token: string) => {
    const response = await api.get(`/letters/verify/${token}`);
    return response.data;
  }
};

export const analyticsAPI = {
  dayWise: async (date: string) => {
    const response = await api.get('/analytics/day-wise', { params: { date } });
    return response.data;
  },
  subjectWise: async (subject: string) => {
    const response = await api.get('/analytics/subject-wise', { params: { subject } });
    return response.data;
  },
  semesterWise: async () => {
    const response = await api.get('/analytics/semester-wise');
    return response.data;
  },
  atRisk: async () => {
    const response = await api.get('/analytics/at-risk');
    return response.data;
  }
};

export const seedAPI = {
  seedData: async () => {
    const response = await api.post('/seed-data');
    return response.data;
  }
};

export const auditAPI = {
  getLog: async () => {
    const response = await api.get('/audit-log');
    return response.data;
  }
};

export const studentManageAPI = {
  addStudent: async (data: any) => {
    const response = await api.post('/students', data);
    return response.data;
  }
};

export const attendanceSyncAPI = {
  bulkSync: async (items: any[]) => {
    const response = await api.post('/attendance/bulk-sync', items);
    return response.data;
  }
};

export default api;
