/**
 * API Client
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Employees
  getEmployees() {
    return this.request('/employees');
  }

  getEmployee(id) {
    return this.request(`/employees/${id}`);
  }

  createEmployee(data) {
    return this.request('/employees', { method: 'POST', body: JSON.stringify(data) });
  }

  // Payroll
  getPayroll() {
    return this.request('/payroll');
  }

  getEmployeePayroll(employeeId) {
    return this.request(`/payroll/employee/${employeeId}`);
  }

  createPayroll(data) {
    return this.request('/payroll', { method: 'POST', body: JSON.stringify(data) });
  }

  calculatePayroll(data) {
    return this.request('/payroll/calculate', { method: 'POST', body: JSON.stringify(data) });
  }

  // Teams
  getTeams() {
    return this.request('/teams');
  }

  getTeam(id) {
    return this.request(`/teams/${id}`);
  }

  createTeam(data) {
    return this.request('/teams', { method: 'POST', body: JSON.stringify(data) });
  }

  // Tasks
  getTasks() {
    return this.request('/tasks');
  }

  getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  createTask(data) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify(data) });
  }

  // Health check
  healthCheck() {
    return this.request('/health');
  }
}

export default new ApiClient();
