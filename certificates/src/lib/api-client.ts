import axios, { AxiosInstance } from "axios";
import { Event, Attendee, User, CheckIn } from "@/types/evenday";

/**
 * HTTP Client for evenday.app API
 * Consumes the Laravel backend API to fetch events, attendees, and check-ins
 */
class EvdayApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EVENDAY_API_URL || "http://localhost:8000",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  /**
   * Set authorization token for authenticated requests
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Authenticate user with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: User }> {
    const response = await this.client.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  /**
   * Get authenticated user info
   */
  async getUser(token: string): Promise<User> {
    const response = await this.client.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * Get all events for authenticated user
   */
  async getEvents(token: string): Promise<Event[]> {
    const response = await this.client.get("/events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  }

  /**
   * Get single event by ID
   */
  async getEvent(eventId: number, token: string): Promise<Event> {
    const response = await this.client.get(`/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  }

  /**
   * Get attendees for a specific event
   */
  async getAttendees(eventId: number, token: string): Promise<Attendee[]> {
    const response = await this.client.get(`/events/${eventId}/attendees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  }

  /**
   * Get single attendee by ID
   */
  async getAttendee(attendeeId: number, token: string): Promise<Attendee> {
    const response = await this.client.get(`/events/attendees/${attendeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  }

  /**
   * Get check-ins for a specific event
   */
  async getCheckIns(eventId: number, token: string): Promise<CheckIn[]> {
    const response = await this.client.get(`/events/${eventId}/check-ins`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data;
  }
}

export const evdayApi = new EvdayApiClient();
