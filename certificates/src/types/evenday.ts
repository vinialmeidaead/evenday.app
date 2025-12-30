// Type definitions for evenday.app entities

export interface Event {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  timezone: string;
  location?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: number;
  event_id: number;
  first_name: string;
  last_name: string;
  email: string;
  ticket_id: number;
  public_id: string;
  created_at: string;
  checked_in?: boolean;
}

export interface CheckIn {
  id: number;
  attendee_id: number;
  event_id: number;
  order_id?: number;
  checked_in_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  account_id?: number;
}
