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

    const supabaseUrl = "https://ubipvdzpvoffyyvitfdc.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaXB2ZHpwdm9mZnl5dml0ZmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjEwMTEsImV4cCI6MjA3NzgzNzAxMX0.lYDKtDLhfLl655qRbQW256K8ixh1NSRDF8k5LeFl-NY";

    if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.startsWith("[")) {
        throw new Error(`Error de Configuración: Credenciales de Supabase incompletas.

Por favor, sigue estos pasos:
1. Abre el archivo 'utils/supabase.ts' en el editor.
2. Ve a tu proyecto en Supabase -> Project Settings -> API.
3. Copia la clave 'anon' 'public' y pégala reemplazando el texto "[Pega aquí tu Supabase Anon Key]".
4. Guarda el archivo. La aplicación se recargará automáticamente.`);
    }
    
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
};