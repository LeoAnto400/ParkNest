export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};
export type Database = {
  public: {
    Tables: {
      listings: {
        Row: Listing;
        Insert: Omit<Listing, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: Pick<
          Booking,
          "listing_id" | "driver_id" | "starts_at" | "ends_at"
        >;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: { name?: string; phone?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Listing = {
  id: string;
  owner_id: string;
  title: string;
  address: string;
  description: string;
  hourly_rate_paise: number;
  available_from: string;
  available_until: string;
  photo_path: string | null;
  created_at: string;
};
export type Booking = {
  id: string;
  listing_id: string;
  driver_id: string;
  starts_at: string;
  ends_at: string;
  total_paise: number;
  payment_status: "simulated";
  created_at: string;
};
