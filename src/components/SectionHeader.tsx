import { ReactNode } from 'react';

export const SectionHeader = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="section-header">
    <h2>{title}</h2>
    {action}
  </div>
);
