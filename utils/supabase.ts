import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
    Producto, Salsa, Promocion, Pedido, ClienteLeal, LoyaltyProgram, CajaSession, RestaurantSettings
} from '../types';


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Plan {
  id: string; 
  name: string;
  price: number;
  features: Json;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  plan_id: string;
  created_at: string;
  settings: RestaurantSettings;
}

export type UserRoleType = 'owner' | 'admin' | 'employee';

export interface UserRoleLink {
    user_id: string;
    restaurant_id: string;
    role: UserRoleType;
    created_at: string;
}

// Define the schema of the Base de Datos for a robust type inference.
export type Database = {
  public: {
    Tables: {
      products: {
        Row: Producto;
        Insert: Omit<Producto, 'id'>;
        Update: Partial<Producto>;
      };
      salsas: {
        Row: Salsa;
        Insert: Salsa;
        Update: Partial<Salsa>;
      };
      promotions: {
        Row: Promocion;
        Insert: Omit<Promocion, 'id'>;
        Update: Partial<Promocion>;
      };
      orders: {
        Row: Pedido;
        // FIX: Replaced `any` with specific types to resolve "not assignable to never" TS error.
        Insert: Omit<Pedido, 'id'>;
        Update: Partial<Pedido>;
      };
      customers: {
        Row: ClienteLeal;
        Insert: ClienteLeal;
        Update: Partial<ClienteLeal>;
      };
      loyalty_programs: {
        Row: LoyaltyProgram;
        Insert: Omit<LoyaltyProgram, 'id'>;
        Update: Partial<LoyaltyProgram>;
      };
      caja_history: {
        Row: CajaSession;
        Insert: Omit<CajaSession, 'id'>;
        Update: Partial<CajaSession>;
      };
      plans: {
        Row: Plan;
        Insert: Omit<Plan, 'id' | 'created_at'>;
        Update: Partial<Plan>;
      };
      restaurants: {
        Row: Restaurant;
        // FIX: Replaced `any` with specific types to resolve "not assignable to never" TS error.
        Insert: Omit<Restaurant, 'id' | 'created_at'>;
        Update: Partial<Restaurant>;
      };
      user_roles: {
        Row: UserRoleLink;
        // FIX: Omitted `created_at` from Insert type as it's handled by the database.
        Insert: Omit<UserRoleLink, 'created_at'>;
        Update: Partial<UserRoleLink>;
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = "https://hpyiywcnpgcnyydlsphn.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweWl5d2NucGdjbnl5ZGxzcGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjA5NjksImV4cCI6MjA3NzgzNjk2OX0.EHLUoqodT360fJkehaXIA5dvVe9J1RZ-Xekc1RZtuW8";

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(`Error de Configuración: No se encontraron las credenciales de Supabase.

Por favor, ve a la configuración de tu proyecto y asegúrate de que los nombres de las variables de entorno sean EXACTAMENTE:

1. Nombre: SUPABASE_URL
   Valor: [Tu URL de Supabase]

2. Nombre: SUPABASE_ANON_KEY
   Valor: [Tu clave "anon public" de Supabase]

Después de guardarlas, haz un "Redeploy".`);
    }
    
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
};