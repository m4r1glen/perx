import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OfferLocation = {
  id: string;
  offer_id: string;
  provider_id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string | null;
  address: string | null;
  provider: {
    id: string;
    business_name: string;
    brand_color: string | null;
    logo_url: string | null;
    category: string | null;
  };
  offer: {
    id: string;
    title_sq: string;
    title_en: string;
    price_l: number;
    category: string;
  };
};

export function useOfferLocations() {
  return useQuery({
    queryKey: ["offer_locations"],
    queryFn: async (): Promise<OfferLocation[]> => {
      const { data, error } = await supabase.from("offer_locations").select(`
          id, offer_id, provider_id, name, latitude, longitude, city, address,
          provider:providers!offer_locations_provider_id_fkey ( id, business_name, brand_color, logo_url, category ),
          offer:offers!offer_locations_offer_id_fkey ( id, title_sq, title_en, price_l, category )
        `);
      if (error) throw error;
      return ((data ?? []) as unknown as OfferLocation[]).filter(
        (l) => l.latitude != null && l.longitude != null && l.provider && l.offer,
      );
    },
  });
}
