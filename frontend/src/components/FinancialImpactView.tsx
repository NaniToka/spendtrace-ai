import React, { useEffect, useState } from 'react';
import { fetchFinancialImpact } from '../services/api';
import { FinancialImpactResponse } from '../types/financial_impact';
import { FinancialImpactSection } from './FinancialImpactSection';

interface Props {
  anomalyId: string;
}

export const FinancialImpactView: React.FC<Props> = ({ anomalyId }) => {
  const [data, setData] = useState<FinancialImpactResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!anomalyId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFinancialImpact(anomalyId);
        if (!active) return;
        setData(res);
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to fetch financial impact data');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();

    return () => {
      active = false;
    };
  }, [anomalyId]);

  if (loading) return <div className="text-secondary p-8">Loading financial projections...</div>;
  if (error) return <div className="text-danger p-8">{error}</div>;
  if (!data) return null;

  return (
    <div className="w-full">
      <FinancialImpactSection impact={data} />
    </div>
  );
};
