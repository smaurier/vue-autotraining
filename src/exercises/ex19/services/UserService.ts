import type { User, CreateUserInput, IHttpService } from "../types";

/**
 * TODO: Service utilisateur qui utilise IHttpService
 */
export class UserService {
  constructor(private http: IHttpService) {}

  async getAll(): Promise<User[]> {
    return this.http.get<User[]>("/users");
  }

  async getById(id: number): Promise<User> {
    return this.http.get<User>(`/users/${id}`);
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.http.post<User>("/users", data);
  }

  async update(id: number, data: Partial<CreateUserInput>): Promise<User> {
    return this.http.put<User>(`/users/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/users/${id}`);
  }
}
