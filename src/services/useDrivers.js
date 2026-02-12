import { useEffect, useState } from "react";
import api from "../api/axios";

export function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const response = await api.get("/driver/get");
        if (response.status === 200) {
          setDrivers(response.data.driver_data || []);
        } else {
          setError("Erro ao buscar motoristas");
        }
      } catch (err) {
        setError("Erro ao buscar motoristas");
      } finally {
        setLoading(false);
      }
    }
    fetchDrivers();
  }, []);

  return { drivers, loading, error };
} 