import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { RoomType, RoomStatus, TempHumOverview } from "@/types/temphum";

export function useRoomsWithStatus() {
  return useQuery({
    queryKey: ["temphum", "rooms"],
    queryFn: () => apiGet<RoomStatus[]>("temphum/rooms"),
  });
}

export function useRoomTypes() {
  return useQuery({
    queryKey: ["temphum", "room-types"],
    queryFn: () => apiGet<RoomType[]>("temphum/room-types"),
  });
}

export function useTempHumOverview() {
  return useQuery({
    queryKey: ["temphum", "overview"],
    queryFn: () => apiGet<TempHumOverview>("temphum/overview"),
  });
}
