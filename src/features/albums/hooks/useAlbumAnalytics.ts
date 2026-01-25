"use client";

import { useState, useEffect, useRef } from "react";
import type { EntityAnalyticsData } from "@/features/smart-links/analytics/data";

const CACHE_DURATION = 30000; // 30 seconds

// Module-level cache for completed requests
const cache = new Map<
  string,
  { data: EntityAnalyticsData; timestamp: number }
>();

// Module-level map to track in-flight requests and their promises
const inFlightRequests = new Map<string, Promise<EntityAnalyticsData>>();

type UseAlbumAnalyticsResult = {
  data: EntityAnalyticsData | null;
  loading: boolean;
  error: Error | null;
};

export function useAlbumAnalytics(
  albumId: string,
  scope: string = "30",
  enabled: boolean = true
): UseAlbumAnalyticsResult {
  const [data, setData] = useState<EntityAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !albumId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    const cacheKey = `${albumId}-${scope}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (mountedRef.current) {
        setData(cached.data);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // Check if request is already in-flight
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      existingRequest
        .then((result) => {
          if (mountedRef.current) {
            setData(result);
            setLoading(false);
            setError(null);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
          }
        });
      return;
    }

    // Start new request
    setLoading(true);
    setError(null);

    const fetchPromise = fetch(`/api/admin/albums/${albumId}/analytics?scope=${scope}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.statusText}`);
        }
        const result = await response.json();
        
        // Store in cache
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        // Remove from in-flight requests
        inFlightRequests.delete(cacheKey);

        return result as EntityAnalyticsData;
      })
      .catch((err) => {
        // Remove from in-flight requests on error
        inFlightRequests.delete(cacheKey);
        throw err;
      });

    // Track in-flight request
    inFlightRequests.set(cacheKey, fetchPromise);

    fetchPromise
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
  }, [albumId, scope, enabled]);

  return { data, loading, error };
}
